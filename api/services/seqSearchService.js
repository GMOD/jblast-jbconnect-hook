/*
 * seqSearchService
 * service to handle  
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
        submit_search:          'post',
        send_search_result:     'post'
    },
    init: function(params,cb) {
        return cb();
    },
    /**
     * 
     * @param {object} req
     *      searchParams - search parameters
     *           expr": "tgac"          - search sequence or regex string
     *           "regex": false/true    - 
     *           "caseIgnore": false/true
     *           "translate": false/true,
     *           "fwdStrand": false/true,
     *           "revStrand": false/true,
     *           "maxLen": 100,     
     *      dataset - the dataset path i.e. "sample_data/json/volvox" 
     * @param {object} res
     */
    submit_search: function(req, res) {
        var params = req.allParams();
        this._searchSubmit(params,function(result) {
            res.ok(result);
        });
    },
    /**
     * This is used to send result data from the phantomjs component
     * @param {object} req
     *      jobid           job that is managing this session
     *      end             true if this is the end of the series
     *      ...             other fields
     *      data            data returned.
     * @param {object} res
     */
    send_search_result: function(req, res) {
        
        // (not functional yet.)
        
        var params = req.allParams();
        
        // lookup job kJob = ...
        
        // setup kJob.kDonefn
        
        this._postProcess(kJob);
        
    },
    
    /*
     * submit workflow.
     * 
     * @param {object} params
     *      searchParams - search parameters
     *      dataset - the dataset path i.e. "sample_data/json/volvox" 
     * @param {function} cb
     */
    _searchSubmit: function(params,cb) {
        var thisb = this;
        var g = sails.config.globals.jbrowse;
        var gg = sails.config.globals;
        
        var searchParams = params.searchParams;
        var dataset = params.dataset;
        var workflow = params.workflow;

        searchParams = this._fixParams(searchParams);  // necessary?
        //console.log("searchParams fixed:",searchParams);

        // create the kue job entry
        var jobdata = {
            name: searchParams.expr+' search',
            workflow: workflow,
            searchParams: searchParams, 
            dataset: dataset,
            jbrowseDataPath: dataset        // cleanup later (postAction uses this)
        };
        var job = gg.kue_queue.create('workflow', jobdata)
        .save(function(err){
            if (err) {
                return cb(null,{status:'error',msg: "error create kue workflow",err:err});
            }
            var d = new Date();
            
            job.data.asset = job.id+"_search_"+d.getTime();
            job.data.searchParamFile = job.data.asset+".json";
            job.data.path = g.jbrowsePath + '/' + dataset +'/'+ g.jblast.blastResultPath;
            job.data.outfile = job.data.asset+".gff";
            job.save();
            
            cb({status:'success',jobId: job.id,asset:job.data.asset},null);

            // process job
            gg.kue_queue.process('workflow', function(kJob, kDone){
                kJob.kDoneFn = kDone;
                sails.log.info("workflow job id = "+kJob.id);

                thisb._createSearchParamFile(job);
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
    _createSearchParamFile: function(job) {
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
            job.kDoneFn(new Error('failed to create search param file'));
            error = true;
        }
    },
    _runWorkflow: function(kWorkflowJob) {

        var thisb = this;
        var g = sails.config.globals.jbrowse;
        
        var workflowFile = g.searchSeq.workflowScript;              //"ServerSearch.workflow.js";
        if (typeof kWorkflowJob.data.workflow !== 'undefined')
            workflowFile = kWorkflowJob.data.workflow;
        
        var wf = process.cwd()+'/workflows/'+workflowFile;
        var outPath = g.jbrowsePath + kWorkflowJob.data.jbrowseDataPath + '/' + g.jblast.blastResultPath;

        sails.log('>>> Executing workflow',wf);
        
        // pass to workflow script
        var program = phantomjs.exec(wf,
            g.routePrefix,                                                      // prefix
            g.searchSeq.processScript,                                          // 'http://localhost:1337/jbrowse/SearchProcess.html',
            kWorkflowJob.data.path+'/'+kWorkflowJob.data.outfile,               // output file (full path)
            JSON.stringify(kWorkflowJob.data.searchParams),                     // search parameters
            kWorkflowJob.id                                                     // job id
        );
            
        program.stdout.pipe(process.stdout);
        program.stderr.pipe(process.stderr);
        program.on('exit', function(code) {
          // do something on end
          sails.log(">>> workflow completed",code);
          
          if (code !== 0) {
              kWorkflowJob.kDoneFn(new Error('Workflow script completion error: '+code));
              return;
          }
          thisb._postProcess(kWorkflowJob);
          
        });        
    },
    _postProcess: function(kWorkflowJob) {
        var blast2json = require("./blastxml2json");
        var postAction = require("./postAction");
        
        // insert track into trackList.json
        this.postMoveResultFiles(kWorkflowJob,function(newTrackJson) {
            postAction.addToTrackList(kWorkflowJob,newTrackJson);
        });
    },
    /**
     * this generates track template
     * 
     * @param {type} kWorkflowJob
     * @param {type} cb
     */
    postMoveResultFiles:function(kWorkflowJob,cb) {

        var g = sails.config.globals.jbrowse;
        var newTrackPath = kWorkflowJob.data.path+'/'+g.jblast.insertTrackTemplate; //"inMemTemplate.json"

        var newTrackData = fs.readFileSync(newTrackPath);
        newTrackJson = JSON.parse(newTrackData);

        //if it's a single definition, coerce to an array
        if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
            newTrackJson = [ newTrackJson ];
        }

        // validate the new track JSON structures
        newTrackJson.forEach (function (track) {
            if (!track.label) {
                var msg = "Invalid track JSON: missing a label element";
                sails.error(msg);
                kWorkflowJob.kDoneFn(new Error(msg));
                return;
            }
        });
        
        var trackLabel = kWorkflowJob.data.searchParams.expr+' results';
        
        // replace some track info
        //if (typeof newTrackJson[0].baseUrl !== 'undefined') delete newTrackJson[0].baseUrl;
        /*
         *  TODO: if we don't add the baseUrl, then the the track will get a 404 error b/c
         *  the client track insertion does not yet determine the baseUrl on its own, yet.
         */
        
        newTrackJson[0].baseUrl = g.jbrowseRest+'/'+g.routePrefix+'/'+kWorkflowJob.data.dataset+'/';
        
        newTrackJson[0].urlTemplate = g.jblast.blastResultPath+"/"+kWorkflowJob.data.outfile;  // gff, TODO (should not be blast result path)

        newTrackJson[0].label = kWorkflowJob.data.asset; 
        newTrackJson[0].key = trackLabel;     
        
        newTrackJson[0].metadata = {
                description: 'Search result job: '+kWorkflowJob.id
            }
        newTrackJson[0].category = "Search Results";
        //newTrackJson[0].storeCache = false;

        newTrackJson[0].sequenceSearch = true;     
        kWorkflowJob.data.track = newTrackJson[0];
        kWorkflowJob.save();

        cb(newTrackJson);
        
        // some utility functions
        function escapeRegExp(str) {
            return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        }
        function replaceAll(str, find, replace) {
            return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
        }
    }
    
};

