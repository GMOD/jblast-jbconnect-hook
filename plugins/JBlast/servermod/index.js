/**
 *  
 */
var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var postAction = require('./postAction');
var kueSyncJobs = require ('./kueSyncJobs');
var filter = require("./filter");   // filter processing
var galaxy = require("./galaxyUtils");
var util = require("./utils");
//var prettyjson = require('prettyjson');   // for debugging

module.exports = function (sails) {
    return {
        initialize: function(cb) {
            // todo: check that galaxy is running

            galaxy.init(function(history) {
                
                historyId = history.historyId;
                
                sails.log.info("starting kueJobMon"); 
                kueSyncJobs.start(historyId);
                
            }, function(err) {
                sails.log.error("failed galaxy.init",err);
            });


            sails.on('hook:orm:loaded', function() {
                // do something after hooks are loaded
                return cb();
            });
        },
        routes: {
           after: {
              'post /jbapi/workflowsubmit': function (req, res, next) {
                  sails.log.info("/jbapi/workflowsubmit");
                  var params = {
                    region:req.body.region,
                    workflow:req.body.workflow,
                    dataSetPath:req.body.dataSetPath,
                    monitorFn:monitorWorkflow
                  };
                  galaxy.workflowSubmit(params,
                    function(data) {
                        sails.hooks['jbcore'].resSend(res,data);
                    },
                    function(err) {
                        sails.hooks['jbcore'].resSend(res,err);
                    });
              },
              
              'get /jbapi/getworkflows': function (req, res, next) {
                    sails.log("JBlast /jbapi/getworkflows called");
                    
                    galaxy.galaxyGET("/api/workflows",
                        function(workflows) {
                            return sails.hooks['jbcore'].resSend(res,workflows);
                        },
                        function(error) {
                            return sails.hooks['jbcore'].resSend(res,{status:'error',msg:"galaxy GET /api/workflows failed",err:error});
                        });
              },
              /** post /jbapi/setfilter - send filter parameters
               * 
               * @param {type} req
               *    data = req.body
               *    data.filterParams = {score:{val: 50}, evalue:{val:-2}...
               *    data.dataSet = (i.e. "sample_data/json/volvox" generally from config.dataRoot)
               *    data.asset = 
               * @param {type} res
               * @param {type} next
               * @returns {undefined}
               */
               
              'post /jbapi/setfilter': function (req, res, next) {
                  sails.log.info("JBlast","POST /jbapi/setfilter");
                  rest_applyFilter(req,res);
              },
              /**
               * Get info about the given track
               */
              'get /jbapi/getblastdata/:asset/:dataset': function (req, res, next) {
                  sails.log.info("JBlast","/jbapi/getblastdata");
                  rest_applyFilter(req,res);
              },
              'get /jbapi/gettrackdata/:asset/:dataset': function (req, res, next) {
                    sails.log("JBlast /jbapi/gettrackdata called");
                    var params = req.allParams();
                    sails.log('asset',req.param('asset'));
                    sails.log('dataset',req.param('dataset'));
                    //sails.log('req.allParams()',req.allParams());
                    
                    var asset = req.param('asset');
                    var dataset = req.param('dataset');
                    
                    var g = sails.config.globals.jbrowse;
                    
                    //var gfffile = g.jbrowsePath + dataset +'/'+ g.jblast.blastResultPath + '/' + 'sampleResult.gff3';
                    var gfffile = g.jbrowsePath + dataset + '/'+ g.jblast.blastResultPath + '/' + asset +'.gff3';

                    try {
                        var content = fs.readFileSync(gfffile);
                    }
                    catch (err) {
                        var str = JSON.stringify(err);
                        //var str = str.split("\n");
                        sails.log.error("failed to retrieve gff3 file",str);
                        return sails.hooks['jbcore'].resSend(res,{status: 'error', msg: str, err:err});
                    };

                    return res.send(content);
              },
              /**
               * Return hits data given hit key
               */
              'get /jbapi/gethitdetails/:asset/:dataset/:hitkey': function (req, res, next) {
                    sails.log("JBlast /jbapi/gethitdetails called");
                    //todo: handle errors
                    rest_getHitDetails(req,res,function(hitData) {
                        return sails.hooks['jbcore'].resSend(res,hitData);
                    });
              },
              /**
               * returns accession data given accesion number.
               * Utilizes Entrez service
               */
              'get /jbapi/lookupaccession/:accession': function (req, res, next) {
                    sails.log("JBlast /jbapi/lookupaccession called");
                    rest_lookupAccession(req,res,function(data) {
                        res.send(data);
                    });
              }
              
           }
        }
    };
};

/**
 * this does an esummary lookup (using Entrez api), adding the link field into the result.
 * @param {type} req
 * @param {type} res
 * @param {type} cb
 * Ref: https://www.ncbi.nlm.nih.gov/books/NBK25499/
 */

function rest_lookupAccession(req,res, cb) {
    var accession = req.param('accession');
    
    var req = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nucleotide&id=[[accession]]&retmode=json";
    var linkout = "https://www.ncbi.nlm.nih.gov/nucleotide/[[linkout]]?report=genbank";
    
    req = req.replace("[[accession]]",accession);
    
    var options = {
        uri: req,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };

    sails.log.debug("options",options,accession,typeof accession);

    requestp(options)
        .then(function (data) {
            for (var i in data.result) {
                var link = linkout.replace("[[linkout]]",data.result[i].uid);
                data.result[i].link = link;
            }
            cb(data);
        })
        .catch(function (err) {
            cb(err);
        });    
};

/**
 * Process REST /jbapi/gethitdetails
 * @param {type} req
 * @param {type} res
 * @param {type} cb
 * @returns {undefined}
 */

function rest_getHitDetails(req,res, cb) {
    var asset = req.param('asset');
    var hitkey = req.param('hitkey');
    var dataset = req.param('dataset');
    filter.getHitDetails(hitkey, dataset, asset, function(hitData) {
       cb(hitData); 
    });
};

function rest_applyFilter(req,res) {
    sails.log.debug("rest_applyFilter()");
    var g = sails.config.globals;
    var requestData = req.body;

    // get /jbapi/getdata is used then the asset and dataset will be in th params, so extract them.
    var asset = req.param('asset');
    var dataSet = req.param('dataset');

    if (typeof asset !== 'undefined') requestData.asset = asset;
    if (typeof dataSet !== 'undefined') requestData.dataSet = dataSet;
    
    sails.log.debug("requestData",requestData);

    var err = filter.writeFilterSettings(requestData,function(filterData) {
        filter.applyFilter(filterData,requestData,function(data) {
    
            return sails.hooks['jbcore'].resSend(res,data);
        });
    });
    if (err) {
        return sails.hooks['jbcore'].resSend(res,{status:'error',err:err});
    }
};
    
/**
 * Monitor workflow
 * @param {type} kWorkflowJob
 * @returns {undefined}
 */

function monitorWorkflow(kWorkflowJob){
    var wId = kWorkflowJob.data.workflow.workflow_id;
    sails.log.debug('monitorWorkflow starting, wId',wId);
    
    var timerloop = setInterval(function(){
        var hId = sails.hooks['jb-galaxy-blast'].getHistoryId();
        var outputs = kWorkflowJob.data.workflow.outputs;    // list of workflow output history ids
        var outputCount = outputs.length;
        
        sails.log.info ("history",hId);
        
        // get history entries
        var p = sails.hooks['jb-galaxy-blast'].galaxyGetAsync('/api/histories/'+hId+'/contents')
        .then(function(hist) {
            p.exited = 0;
            // reorg to assoc array
            var hista = {};
            for(var i in hist) hista[hist[i].id] = hist[i];

            // determine aggregate state
            var okCount = 0;
            for(var i in outputs) {
                // if any are running or uploading, we are active
                if(hista[outputs[i]].state==='running' || hista[outputs[i]].state==='upload')
                    break;
                // if something any history error, the whole workflow is in error
                if(hista[outputs[i]].state==='error') {
                    clearInterval(timerloop);
                    kWorkflowJob.state('failed');
                    kWorkflowJob.save();
                    sails.log.debug(wId,'workflow completed in error');
                    break;
                }
                if(hista[outputs[i]].state==='ok')
                    okCount++;
            }
            sails.log.debug(wId,'workflow step',okCount,'of',outputCount);
            
            kWorkflowJob.progress(okCount,outputCount+1,{workflow_id:wId});

            // complete if all states ok
            if (outputCount === okCount) {
                clearInterval(timerloop);
                kWorkflowJob.state('complete');
                kWorkflowJob.save();
                sails.log.debug(wId,'workflow completed');
                setTimeout(function() {
                    postAction.doCompleteAction(kWorkflowJob,hista);            // workflow completed
                },10);
            }
        })
        .catch(function(err){
            var msg = wId + " monitorWorkflow: failed to get history "+hId;
            sails.log.error(msg,err);
            clearInterval(timerloop);
            kWorkflowJob.kDoneFn(new Error(msg))
        });
        
    },3000);
};
