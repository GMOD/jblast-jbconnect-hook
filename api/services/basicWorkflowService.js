/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var path = require('path');
var resolvePath = require('resolve-path');
var fs = require("fs-extra");
var util = require("./utils");
var shelljs = require('shelljs'); 
var appPath = require("app-root-path").path;

module.exports = {

    fmap: {
//        workflow_submit:    'post',
        get_workflows:      'get',
        get_hit_details:    'get'
    },
    init: function(params,cb) {
        return cb();
    },
    validateParams: function(params) {
        if (typeof params.workflow === 'undefined') return "workflow not defined";
        if (typeof params.region === 'undefined') return "region not undefined";
        return 0;   // success
    },
    generateName(params) {
        return params.workflow;
    },
    /*
    workflow_submit: function(req, res) {
        var params = req.allParams();
        this._workflowSubmit(params,function(result) {
            res.ok(result);
        });
    },
    */
    get_workflows: function(req, res) {
        
        var wfpath = './workflows/';
        
        sails.log(wfpath,process.cwd());
        
        var fs = require('fs-extra');

        wflist = [];
        
        fs.readdirSync(wfpath).forEach(function(file) {
            if (file.indexOf('.blast.workflow.') !== -1) {
                
                var name = file.split('.workflow.');
                
                wflist.push( {
                   id: file,
                   name: name[0],
                   script: file,
                   path: resolvePath(wfpath)
                });
            }
        });
        res.ok(wflist);
    },
    get_hit_details: function(req, res) {
        var params = req.allParams();

        var asset = params.asset;
        var hitkey = params.hitkey;
        var dataset = params.dataset;

        filter.getHitDetails(hitkey, dataset, asset, function(hitData) {
            return res.ok(hitData); 
        });
    },
    
    /**
     * submit workflow.
     * 
     * @param {type} params
     * @param {type} cb
     */
    beginProcessing: function(kJob) {
        sails.log.info("basicWorkflowService beginProcessing"+kJob.data);
        var params = kJob.data;
        
        var thisb = this;
        var g = sails.config.globals;

        var region = params.region;
        var workflow = params.workflow;
        //var dataSetPath = params.dataset;
        var monitorFn = this._monitorWorkflow;

        // get starting coord of region
        var startCoord = util.getRegionStart(region);
        var seq = util.parseSeqData(region);

        var d = new Date();

        //sails.log.debug('g.jbrowse',g.jbrowse);

        // write the BLAST region file (.fasta)
        var theBlastFile = "blast_region"+d.getTime()+".fa";
        var blastPath = g.jbrowse.jbrowsePath + '/' + params.dataset +'/'+ g.jbrowse.jblast.blastResultPath;
        var theFullBlastFilePath = blastPath+'/'+theBlastFile; 

        console.log("blastPath",blastPath);
        
        try {
            // if direcgtory doesn't exist, create it
            fs.ensureDirSync(blastPath);
        }
        catch(err) {
            sails.log.error(err);            
            return cb(null,{status: 'error',err:err});
        }
        
        try {
            ws = fs.createWriteStream(theFullBlastFilePath);
            ws.write(region);
            ws.end();
        }
        catch (err) {
            sails.log.error(err,theFullBlastFilePath);
            return cb(null,{status: 'error', msg: "failed to write",err:err});
        }

        var blastData = {
            name: "JBlast", 
            blastSeq: theFullBlastFilePath,
            offset: startCoord
        };

        //sails.log.debug('>>> jbrowse globals',g.jbrowse);

        var theFile = g.jbrowse.jbrowseRest+'/'+g.jbrowse.routePrefix+'/'+ params.dataset+'/' + g.jbrowse.jblast.blastResultPath+'/'+theBlastFile;

        //params.dataSetPath = params.dataset;

        var name = workflow.split('.workflow.');
        
        
        
        //kJob.data.requestParams = params;
        kJob.data.sequence = seq;
        kJob.data.blastData = blastData;
        kJob.data.seqFile = theFile;

        this.determineBlastProfile(kJob);

        kJob.update(function() {});
        
        this.beginProcessing2(kJob);
    },
    /*
     * creates kJob.data.blastOptions based on kJob.data.blastProfile
     * also creates blastOptionFile
     */
    determineBlastProfile(kJob) {
        let g = sails.config.globals.jbrowse;       
        
        if (typeof kJob.data.blastProfile === 'undefined') {
            // use defaultBlastProfile
            if (g.jblast.defaultBlastProfile) {
                let profile = g.jblast.defaultBlastProfile;
                if (typeof g.jblast.blastProfiles[profile] !== 'undefined') {
                    kJob.data.blastOptions = g.jblast.blastProfiles[profile];
                }
            }
        }
        else {
            if (typeof kJob.data.blastProfile === 'string') {
                // get blast profile based on string
                let profile = kJob.data.blastProfile;
                if (typeof g.jblast.blastProfiles[profile] !== 'undefined') {
                    kJob.data.blastOptions = g.jblast.blastProfiles[profile];
                }
                
                // if not found use default
            }
            else if (typeof kJob.data.blastProfile === 'object') {
                kJob.data.blastOptions = kJob.data.blastProfile;
            }
            else {
                //type not supported.
            }
        }
        // create blastOptionFile
        if (typeof kJob.data.blastOptions !== "undefined") {
            // create file blastOption file
            var d = new Date();

            // write blast option file
            kJob.data.blastOptionFile = "/tmp/blast_option"+d.getTime()+".json";
            let optionFile = appPath + kJob.data.blastOptionFile;
            
            try {
                fs.writeFileSync(optionFile,JSON.stringify(kJob.data.blastOptions,null,4));
            } catch (err) {
                return kJob.kDoneFn(Error('faild to write blastOptionFile',optionFile));
            }
        }
        else {
            sails.log.error("blastProfile is not defiled");
        }
    },
    beginProcessing2(kJob) {
        var g = sails.config.globals.jbrowse;
        var thisb = this;
        

        kJob.progress(0,10,{file_upload:0});

        // delay 5 seconds for nothing, really. (just so it sits in the queue for longer)
        setTimeout(function() {
            thisb._runWorkflow(kJob);
        },5000);
    },
    _runWorkflow: function(kJob) {

        var thisb = this;
        var g = sails.config.globals.jbrowse;

        var wf = process.cwd()+'/workflows/'+kJob.data.workflow;
        var outPath = g.jbrowsePath + kJob.data.dataset + '/' + g.jblast.blastResultPath;

        sails.log('>>> Executing workflow',wf);
        
        let optionFile = appPath + kJob.data.blastOptionFile;

        let cmd = 'node '+ wf + ' --in '+kJob.data.blastData.blastSeq + ' --ext blastxml --out '+outPath+' --profile '+optionFile;
        sails.log.debug("cmd",cmd);

        var child = shelljs.exec(cmd,{async:true},
            function(code, stdout, stderr) {
                if (code !== 0) {    // completed in error
                    console.log('Script Exit code:', code, typeof code);
                    console.log('Script Program stderr:', stderr);                
                }
                console.log('Script output [[[[', stdout,']]]]');

                // if no workflowResults terminate
                if (stdout.indexOf("workflowResults:") === -1) {
                    sails.log.error("failed to find workflow results");
                    return kJob.kDoneFn(Error('workflow failed -', stdout));
                }
                
                // extract workflow results
                var results = extractjson(stdout);
                
                // the script may generate any number of files so we rely on the script results to tell us the generated file
                
                kJob.data.workflowResult = results;
                kJob.data.blastData.outputs = { blastxml: kJob.id+"_" + Date.now() };
                kJob.update(function() {});
                
                // rename the generated file to be the asset id 
                // this is a clunky should be improved.
                renamefile(results.out);
                
                // start post processing.
                thisb._postProcess(kJob);
                
                // extract the json from the result string
                function extractjson(str) {
                    var jstr = str.split("workflowResults:")[1];
                    return JSON.parse(jstr);
                }
                // rename to file asset name
                function renamefile(theFile) {
                    var dir = path.dirname(theFile);
                    var ext = path.extname(theFile);
                    var assetid = kJob.data.blastData.outputs.blastxml;
                    var cmd = "mv "+theFile+" "+dir+"/"+assetid+ext;
                    sails.log(cmd);
                    shelljs.exec(cmd);
                }
            }
        );
        //sails.log('>>> Workflow complete');
        
    },
    _postProcess: function(kJob) {
        var blast2json = require("./blastxml2json");
        //var postAction = require("./postAction");
        
        
        // insert track into trackList.json
        jblastPostAction.postMoveResultFiles(kJob,function(newTrackJson) {

            // convert xml to json
            blast2json.convert(kJob,newTrackJson,function(err) {
                if (err) {
                    sails.log.error(err.msg);
                    kJob.kDoneFn(new Error(err.msg));
                    return;
                }
                sails.log.debug("post convert newTrackJson",newTrackJson);

                // check if there were any hits.
                if (jblastPostAction.getHits(kJob,newTrackJson)===0) {
                    var msg = "No Blast Hits";
                    sails.log.error(msg);
                    kJob.kDoneFn(new Error(msg));
                }
                else {
                    offsetfix.process(kJob,newTrackJson,function() {
                        jblastPostAction.processFilter(kJob,newTrackJson,function(hitdata) {
                            
                            // postAction service is in JBServer 
                            postAction.addToTrackList(kJob,newTrackJson);
                        });
                    });
                }

            });
        });
    }
    
};

