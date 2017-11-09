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

var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;
 

module.exports = {

    fmap: {
        submit_search:    'post'
    },
    init: function(params,cb) {
        return cb();
    },
    submit_search: function(req, res) {
        var params = req.allParams();
        this._searchSubmit(params,function(result) {
            res.ok(result);
        });
    },
    
    /**
     * submit workflow.
     * 
     * @param {object} params
     *      searchParams - search parameters
     *      dataset - the dataset path i.e. "sample_data/json/volvox" 
     * @param {function} cb
     */
    _searchSubmit: function(params,cb) {
        var thisb = this;
        var g = sails.config.globals;
        
        var searchParams = params.searchParams;
        var dataset = params.dataset;
        var workflow = params.workflow;

        searchParams = this._fixParams(searchParams);
        console.log("searchParams fixed:",searchParams);

        // create the kue job entry
        var jobdata = {
            name: "workflow",
            workflow: workflow,
            searchParams: searchParams, 
            dataset: dataset
        };
        var job = g.kue_queue.create('workflow', jobdata)
        .save(function(err){
            if (err) {
                return cb(null,{status:'error',msg: "error create kue workflow",err:err});
            }
            var d = new Date();
            
            job.data.asset = job.id+"_search_"+d.getTime();
            job.data.searchParamFile = job.data.asset+".json";
            job.data.path = g.jbrowse.jbrowsePath + '/' + dataset +'/'+ g.jbrowse.jblast.blastResultPath;
            job.data.outfile = job.data.asset+".gff";
            job.save();
            
            cb({status:'success',jobId: job.id},null);

            // process job
            g.kue_queue.process('workflow', function(kJob, kDone){
                kJob.kDoneFn = kDone;
                sails.log.info("workflow job id = "+kJob.id);

                thisb._createFile(job);
                thisb._runWorkflow(kJob);
            });
        });
    },
    _fixParams(s) {
        var _s={};
        _s.expr          = s.expr;
        _s.regex         = eval(s.regex);
        _s.caseIgnore     = eval(s.caseIgnore);
        _s.translate     = eval(s.translate);
        _s.fwdStrand     = eval(s.fwdStrand);
        _s.revStrand     = eval(s.revStrand);
        _s.maxLen        = eval(s.maxLen);
        _s.test = false;
        return _s;
    },
    _createFile: function(job) {
        // if direcgtory doesn't exist, create it
        var filePath = job.data.path+'/'+job.data.searchParamFile;
        
        if (!fs.existsSync(job.data.path)){
            fs.mkdirSync(job.data.path);
        }  
        var error = false;
        try {
            ws = fs.createWriteStream(filePath);
            ws.write(JSON.stringify(job.data.searchParams,null,4));
            ws.end();
        }
        catch (e) {
            sails.log.error(e,filePath);
            job.kDoneFn();
            error = true;
        }
        //if (error)
        //    return cb(null,{status: 'error', msg: "failed to write",err:e});
    },
    _runWorkflow: function(kWorkflowJob) {

        var thisb = this;
        var g = sails.config.globals.jbrowse;
        
        var workflowFile = "ServerSearch.workflow.js";
        if (typeof kWorkflowJob.data.workflow !== 'undefined')
            workflowFile = kWorkflowJob.data.workflow;
        
        var wf = process.cwd()+'/workflows/'+workflowFile;
        var outPath = g.jbrowsePath + kWorkflowJob.data.jbrowseDataPath + '/' + g.jblast.blastResultPath;

        //var cmd = binPath+"/phantomjs "+wf;

        sails.log('>>> Executing workflow',wf);
        
        var program = phantomjs.exec(wf,'jbrowse',
            'http://localhost:1337/jbrowse/SearchProcess.html',
            kWorkflowJob.data.path+'/'+kWorkflowJob.data.outfile,
            //'/var/www/html/3jbserver/node_modules/jbrowse/sample_data/json/volvox/jblastdata/test.gff',
            JSON.stringify(kWorkflowJob.data.searchParams));
            
        program.stdout.pipe(process.stdout);
        program.stderr.pipe(process.stderr);
        program.on('exit', function(code) {
          // do something on end
          sails.log(">>> workflow completed",code);
        });        
    },
    _postProcess: function(kWorkflowJob) {
        var blast2json = require("./blastxml2json");
        var postAction = require("./postAction");
        
        
        // insert track into trackList.json
        postAction.postMoveResultFiles(kWorkflowJob,function(newTrackJson) {

            // convert xml to json
            blast2json.convert(kWorkflowJob,newTrackJson,function(err) {
                if (err) {
                    sails.log.error(err.msg);
                    kWorkflowJob.kDoneFn(new Error(err.msg));
                    return;
                }
                sails.log.debug("post convert newTrackJson",newTrackJson);

                // check if there were any hits.
                if (postAction.getHits(kWorkflowJob,newTrackJson)===0) {
                    var msg = "No Blast Hits";
                    sails.log.error(msg);
                    //kWorkflowJob.data.errorMsg = msg;
                    //kWorkflowJob.state('failed');
                    //kWorkflowJob.save();
                    kWorkflowJob.kDoneFn(new Error(msg));
                }
                else {
                    offsetfix.process(kWorkflowJob,newTrackJson,function() {
                        postAction.processFilter(kWorkflowJob,newTrackJson,function(hitdata) {
                            postAction.addToTrackList(kWorkflowJob,newTrackJson);
                        });
                    });
                }

            });
        });
    },
    
    
};

