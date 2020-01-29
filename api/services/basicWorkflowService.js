/**
 * @module
 * @desc
 * This is a job services that executes local NCBI blast by either excuting 
 * NCBI.blast or Sim.blast, defined by the job.
 * 
 * This job service is functionally equivelant to galaxyService, which
 * does blast search through Galaxy API.
 * 
 * Job submission example:
 * ::
 *   var postData = {
 *         service: "jblast",
 *         dataset: "sample_data/json/volvox",
 *         region: ">ctgA ctgA:44705..47713 (- strand) class=remark length=3009\nacatccaatggcgaacataa...gcgagttt",
 *         workflow: "NCBI.blast.workflow.js"
 *     };
 *   $.post( "/job/submit", postData , function( result ) {
 *       console.log( result );
 *   }, "json");
 *
 * Configuration:
 * ::
 *        jblast: {
 *           // The subdir where blast results will be deposited (i.e. ``sample_data/json/volvox/jblastdata``)
 *           blastResultPath: "jblastdata",
 *           
 *           // The category for successful blast results in the track selector
 *           blastResultCategory: "JBlast Results",
 *           
 *           // Track template of the blast result track that will be inserted in trackList.json
 *           trackTemplate: "jblastTrackTemplate.json",
 *           
 *           // Type of file that will be imported for processing blast.
 *           import: ["blastxml"],
 *           
 *           
 *           // BLAST profiles
 *           // blast profiles are parameter lists that translate to blastn cli parameters sets
 *           // (i.e. for "remote_htgs" would translate to "blastn -db htgs -remote")
 *           // These will override any default parameters defined in ``blastjs``
 *           // 
 *           // Blast profiles generally apply to basicWorkflowService only
 *           // and do no apply to galaxyService.
 *           // 
 *           // Our example uses a subset of htgs, an NCBI curated blast database.
 *           // So, it is our default profile.
 *           defaultBlastProfile: 'htgs',
 *           blastProfiles: {
 *               'htgs': {
 *                   'db': 'htgs'
 *               },
 *               'remote_htgs': {
 *                   'db': 'htgs',
 *                   'remote': ""
 *               }
 *           }
 *       },
 *       // list of services that will get registered.
 *       services: {
 *           'basicWorkflowService':     {name: 'basicWorkflowService',  type: 'workflow', alias: "jblast"},
 *           'filterService':            {name: 'filterService',         type: 'service'},
 *           'entrezService':            {name: 'entrezService',         type: 'service'}
 *       },
 * 
 * Job queue entry example:
 * ::
 *     {
 *       "id": 145,
 *       "type": "workflow",
 *       "progress": "0",
 *       "priority": 0,
 *       "data": {
 *         "service": "jblast",
 *         "dataset": "sample_data/json/volvox",
 *         "region": ">ctgA ctgA:44705..47713 (- strand) class=remark length=3009\nacatccaatggcgaacataagcgagttttgt...tggccc",
 *         "workflow": "NCBI.blast.workflow.js",
 *         "name": "NCBI.blast.workflow.js",
 *         "sequence": {
 *           "seq": "ctgA",
 *           "start": "44705",
 *           "end": "47713",
 *           "strand": "-",
 *           "class": "remark",
 *           "length": "3009"
 *         },
 *         "blastData": {
 *           "name": "JBlast",
 *           "blastSeq": "/var/www/html/jbconnect/node_modules/jbrowse//sample_data/json/volvox/jblastdata/blast_region1517044304838.fa",
 *           "offset": "44705"
 *         },
 *         "seqFile": "http://localhost:1337/jbrowse/sample_data/json/volvox/jblastdata/blast_region1517044304838.fa",
 *         "blastOptions": {
 *           "db": "htgs"
 *         },
 *         "blastOptionFile": "/tmp/blast_option1517044304843.json"
 *       },
 *       "state": "failed",
 *       "promote_at": "1517044302842",
 *       "created_at": "1517044302842",
 *       "updated_at": "1517044310134",
 *       "createdAt": "2018-02-01T05:38:27.406Z",
 *       "updatedAt": "2018-02-01T05:38:27.406Z"
 *     },
 *  
 */

var path = require('path');
var resolvePath = require('resolve-path');
var fs = require("fs-extra");
var util = require("./utils");
var shelljs = require('shelljs'); 
var appPath = require("app-root-path").path;
const _ = require('lodash');

module.exports = {

    fmap: {
        get_workflows:      'get',
        get_hit_details:    'get'
    },
    init: function(params,cb) {
        return cb();
    },
    /**
     * job service validate
     * 
     * @param {object} params - parameters
     * @returns {int} 0 if successful
     * 
     */
    // istanbul ignore next
    validateParams(params) {
        if (typeof params.workflow === 'undefined') return "workflow not defined";
        if (typeof params.region === 'undefined') return "region not undefined";
        return 0;   // success
    },
    /**
     * job service generate name.
     * 
     * @param {object} params - parameters
     * @returns {string} string job name
     * 
     */
    generateName(params) {
        return params.workflow;
    },
    /**
     * Enumerate available workflow scripts
     * 
     * @param {object} req - request
     * @param {object} res - responseg
     * 
     */
    get_workflows: workflowService.get_workflows,
    
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
     * Job service - job execution entry point
     * 
     * @param {object} kJob - reference to the kue job object
     * 
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
        var blastPath = g.jbrowse.jbrowsePath + params.dataset +'/'+ g.jbrowse.jblast.blastResultPath;
        var theFullBlastFilePath = blastPath+'/'+theBlastFile; 

        console.log("blastPath",blastPath);
        
        try {
            // if direcgtory doesn't exist, create it
            fs.ensureDirSync(blastPath);
        }
        catch(err) {
            // istanbul ignore next
            if (true) {
                sails.log.error(err);            
                return cb(null,{status: 'error',err:err});
            }
        }
        
        try {
            //fs.writeFileSync(theFullBlastFilePath,region);
            ws = fs.createWriteStream(theFullBlastFilePath);
            ws.write(region);
            ws.end();
        }
        catch (err) {
            // istanbul ignore next
            if (true) {
                sails.log.error(err,theFullBlastFilePath);
                return cb(null,{status: 'error', msg: "failed to write",err:err});
            }
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
        
        switch (typeof kJob.data.blastProfile) {
            // istanbul ignore next
            case 'undefined':
                // use defaultBlastProfile
                if (g.jblast.defaultBlastProfile) {
                    let profile = g.jblast.defaultBlastProfile;
                    if (typeof g.jblast.blastProfiles[profile] !== 'undefined') {
                        kJob.data.blastOptions = g.jblast.blastProfiles[profile];
                    }
                }
                break;
            // istanbul ignore next
            case 'string':
                // get blast profile based on string
                let profile = kJob.data.blastProfile;
                if (typeof g.jblast.blastProfiles[profile] !== 'undefined') {
                    kJob.data.blastOptions = g.jblast.blastProfiles[profile];
                }
                break;
            // istanbul ignore next    
            case 'object':
                kJob.data.blastOptions = kJob.data.blastProfile;
                break;
            // istanbul ignore next    
            default:
                sails.log.info("no Blast profile defined");
        }
        
        // ensure tmp directory
        let tmpdir = appPath+"/tmp";
        try {
            fs.ensureDirSync(tmpdir);            
        } catch (err) {
            // istanbul ignore next
            if (true) {
                let msg = 'failed to create tmp dir: '+tmpdir+", err: "+err;
                return kJob.kDoneFn(Error(msg));
            }
        }
        
        // create blastOptionFile
        // istanbul ignore else
        if (typeof kJob.data.blastOptions !== "undefined") {
            // create file blastOption file
            var d = new Date();

            // write blast option file
            kJob.data.blastOptionFile = "/tmp/blast_option"+d.getTime()+".json";
            let optionFile = appPath + kJob.data.blastOptionFile;
            
            try {
                fs.writeFileSync(optionFile,JSON.stringify(kJob.data.blastOptions,null,4));
            } catch (err) {
                // istanbul ignore next
                return kJob.kDoneFn(Error('failed to write blastOptionFile:',optionFile));
            }
        }
        else {
            
            sails.log.error("blastProfile is not defined");
            return kJob.kDoneFn(Error('blastProfile is not defined'));
            
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

        var wf = appPath+'/workflows/'+kJob.data.workflow;
        var outPath = g.jbrowsePath + kJob.data.dataset + '/' + g.jblast.blastResultPath;

        sails.log('>>> Executing workflow',wf);
        
        let optionFile = appPath + kJob.data.blastOptionFile;

        let cmd = 'node '+ wf + ' --in '+kJob.data.blastData.blastSeq + ' --ext blastxml --out '+outPath+' --profile '+optionFile;
        sails.log.debug("cmd",cmd);

        var child = shelljs.exec(cmd,{async:true},
            function(code, stdout, stderr) {
                // istanbul ignore next
                if (code !== 0) {    // completed in error
                    console.log('Script Exit code:', code, typeof code);
                    console.log('Script Program stderr:', stderr);                
                }
                console.log('Script output [[[[', stdout,']]]]');

                // if no workflowResults terminate
                // istanbul ignore next
                if (stdout.indexOf("workflowResults:") === -1) {
                    sails.log.error("failed to find workflow results");
                    return kJob.kDoneFn(Error('workflow failed -', stdout));
                }
                
                // extract workflow results
                var results = extractjson(stdout);
                if (results===false)    return kJob.kDoneFn(Error('workflow failed'));

                // the script may generate any number of files so we rely on the script results to tell us the generated file
                
                kJob.data.workflowResult = results;
                kJob.data.blastData.outputs = { blastxml: kJob.id+"_" + Date.now() };
                kJob.update(function() {});
                
                // rename the generated file to be the asset id 
                // this is a clunky should be improved.
                //console.log(">>>>> renaming file asset",results.out);
                renamefile(results.out);
                
                // start post processing.
                thisb._postProcess(kJob);
                
                // extract the json from the result string
                function extractjson(str) {
                    let results = null;
                    try {
                        let jstr = str.split("workflowResults:")[1];
                        console.log(">>>>> workflowresults",jstr);
                        results = JSON.parse(jstr);
                    }
                    catch(err) {
                        sails.log.error("extractjson() failed", err);
                        return false;   
                    }
                    return results;
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
        
        // insert track into trackList.json
        jblastPostAction.postMoveResultFiles(kJob,function(newTrackJson) {

            // convert xml to json
            blast2json.convert(kJob,newTrackJson,function(err) {
                // istanbul ignore next
                if (err) {
                    sails.log.error(err.msg);
                    kJob.kDoneFn(new Error(err.msg));
                    return;
                }
                //sails.log.debug("post convert newTrackJson",newTrackJson);

                // check if there were any hits.
                // istanbul ignore if
                if (jblastPostAction.getHits(kJob,newTrackJson)===0) {
                    
                    kJob.data.name = kJob.data.name+' No Hits';
                    kJob.update();
                    
                    var msg = "No Blast Hits";
                    sails.log.error(msg);
                    kJob.kDoneFn(new Error(msg));
                }
                else {
                    offsetfix.process(kJob,newTrackJson,function() {
                        jblastPostAction.processFilter(kJob,newTrackJson,function(hitdata) {
                            
                            // postAction service is in JBConnect 
                            postAction.addToTrackList(kJob,newTrackJson);
                        });
                    });
                }

            });
        });
    }
    
};

