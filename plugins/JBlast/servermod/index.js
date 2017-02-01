/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
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


//var prettyjson = require('prettyjson');   // for debugging

var historyName = '';
var historyId = '';


// for testing
var file_i = 0;

module.exports = function (sails) {
   return {
        initialize: function(cb) {
            sails.log.info("Sails Hook: JBlast initialize"); 
            // todo: check that galaxy is running

            sails.on('hook:orm:loaded', function() {
                // do something after hooks are loaded
                return cb();
            });
            // initialize history
            init_history(this);
            //return cb();
            kueSyncJobs.start();
        },
        routes: {
           after: {
              //'post /jbapi/blastregion': rest_BlastRegion,
              'post /jbapi/workflowsubmit': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/workflowsubmit");
                  rest_WorkflowSubmit(req,res);
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
                  //sails.log.debug("req.body", JSON.stringify(req.body));
                  rest_applyFilter(req,res);
              },
              'get /jbapi/getworkflows': function (req, res, next) {
                    sails.log("JBlast /jbapi/getworkflows called");
                    //console.dir(req.params);
                    sails.hooks['jb-galaxy-blast'].galaxyGetAsync("/api/workflows").then(function(workflows) {
                        res.send(workflows);
                    }).catch(function(err){
                        sails.log.error(err.message);
                        sails.log.error(err.options.uri);
                        res.send([]);
                    });
                    //return res.send(galaxyWorkflows);
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
                    var gfffile = g.jbrowsePath + dataset +'/'+ g.jblast.blastResultPath + '/' + asset +'.gff3';

                    var content = fs.readFileSync(gfffile);

                    res.send(content);
              },
              /**
               * Return hits data given hit key
               */
              'get /jbapi/gethitdetails/:asset/:dataset/:hitkey': function (req, res, next) {
                    sails.log("JBlast /jbapi/gethitdetails called");
                    rest_getHitDetails(req,res,function(hitData) {
                        res.send(hitData);
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
              },
              /*
               * test rest operations
               */
              /**
               * /test/newtrack - sim creation of new track
               * a new track is added to trackList.json and an add-track event is sent to listeners.
               */
              'get /test/newtrack': function (req, res, next) {
                  sails.log.info("JBlst /test/newtrack");
                  rest_testNewTrack(function(data) {
                      res.send(data);
                  });
              },
              'get /test/getgff': function (req, res, next) {
                  sails.log.info("JBlast /test/getgff");
                  var g = sails.config.globals.jbrowse;
                  var blastPath = g.jbrowsePath + g.dataSet[0].dataPath + g.jblast.blastResultPath;
                  
                  var theGFF = blastPath+'/'+'test_'+file_i+'.gff3';
                  file_i++;
                  if (file_i >=3) file_i = 0;
                  
                  var content = fs.readFileSync(theGFF);
                  
                  res.send(content);
              },
              
              /**
               * /test/post test post operation
               */
              'post /test/post': function (req, res, next) {
                  sails.log.info("JBlast /test/post");
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                  res.send(req.body);
              },
              /*
               * test get operation
               */
              'get /test/get': function (req, res, next) {
                  sails.log.info("JBlast /test/get");
                  res.send({result:"jb-galaxy-blast /get/test success"});
                  //return next();
              }
              
           }
        },
        /* promise-ized galaxyGetJSON function
         * 
         * @param {type} api
         * @returns {Promise}
         */
        galaxyGetAsync: function(api) {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                thisB.galaxyGetJSON(api, resolve, reject);
            });
        },
        /* promise-ized galaxyPostJSON function
         * 
         * @param {type} api
         * @returns {Promise}
         */
        galaxyPostAsync: function(api,params) {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                thisB.galaxyPostJSON(api,params, resolve, reject);
            });
        },
        /**
         * send JSON GET request to galaxy server
         * @param {type} api - i.e. '/api/histories'
         * @param {type} cb  callback i.e. function(retval)
         * @returns {undefined}
         * 
         */
        galaxyGetJSON: function(api,cb,cberr) {
            var g = sails.config.globals.jbrowse;
            var gurl = g.galaxy.galaxyUrl;
            var apikey = g.galaxy.galaxyAPIKey;

            var options = {
                uri: gurl+api+"?key="+apikey,
                headers: { 'User-Agent': 'Request-Promise' },
                json: true  // parse json response
            };

            sails.log.debug("GET", options);

            requestp(options)
                .then(function (data) {
                    cb(data);
                })
                .catch(function (err) {
                    sails.log.error('erro GET');
                    cberr(err);
                });
        },
        /* send JSON POST request to galaxy server
         * 
         * @param {type} api - e.g. "/api/workflows"
         * @param {type} params - json parameter i.e. {a:1,b:2}
         * @param {type} cb - callback function cb(retval)
         * 
         * retval return {status: x, data:y}
         */
        galaxyPostJSON: function(api,params,cb,cberr) {

            var g = sails.config.globals.jbrowse;
            var gurl = g.galaxy.galaxyUrl;
            var apikey = g.galaxy.galaxyAPIKey;

            var pstr = JSON.stringify(params);

            if(typeof apikey==='undefined') {
                cberr("missing apikey");
                return;
            }

            var req = {
                url: gurl+api+"?key="+apikey, 
                method: 'POST',
                encoding: null,
                gzip:true,
                //qs: params,
                headers: {
                    'Connection': 'keep-alive',
                    'Accept-Encoding' : 'gzip, deflate',
                    'Accept': '*/*',
                    'Accept-Language' : 'en-US,en;q=0.5',
                    'Content-Length' : pstr.length
                },
                json: params
            };
            sails.log.debug("req",req);
            requestp(req)
                .then(function(data){
                    cb(data);
                })
                .catch(function(err){
                    cberr(err);
                });

        },
        getHistoryId: function() {
            return historyId;
        },
        getHistoryName: function() {
            return historyName;
        },
        /**
         * send file POST (promise)
         * @param {type} theFile
         * @param {type} hId
         * @param {type} cb
         * @returns {undefined}
         */
        sendFileAsync: function(theFile,hId) {
            return new Promise(function (resolve, reject) {
                sendFile(theFile,hId,resolve,reject);
            }); 
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
/**
 * acquire history id from galaxy
 * @returns {undefined}
 */
function init_history(th) {
    sails.log("init_history");
    var g = sails.config.globals.jbrowse;
    historyName = g.galaxy.historyName;
    
    th.galaxyGetAsync('/api/histories')
        .then(function(histlist) {
            for(var i in histlist) {
                if (histlist[i].name===historyName) {
                    historyId = histlist[i].id;
                    sails.log.info('Galaxy History: "'+historyName+'"',historyId);
                    return;
                }
            }
        })
        .catch(function(err) {
            sails.log.error('init_history failed');
        });
}
function rest_applyFilter(req,res) {
    sails.log.debug("rest_applyFilter()");
    var g = sails.config.globals;
    var requestData = req.body;
    
    //sails.log.debug("data",JSON.stringify(data, null, 4));
    //sails.log.debug("requestData",requestData);

    var err = filter.writeFilterSettings(requestData,function(filterData) {
        filter.applyFilter(filterData,requestData,function() {
    
            res.send({result:'success'});
            
        });        
    });
    
    if (err)
        res.send({result:err});
}
/**
 * submit workflow
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
function rest_WorkflowSubmit(req,res) {
    var g = sails.config.globals;
    var region = req.body.region;
    var workflow = req.body.workflow;
    var dataSetPath = req.body.dataSetPath;
    
    // get starting coord of region
    var startCoord = getRegionStart(region);
    
    var seq = parseSeqData(region);

    var d = new Date();

    // write the BLAST region file
    
    var theBlastFile = "blast_region"+d.getTime()+".fa";
    
    // write the received region into a file
    // todo: handle errors
    
    var blastPath = g.jbrowse.jbrowsePath + g.jbrowse.dataSet[0].dataPath + g.jbrowse.jblast.blastResultPath;
    var theFullBlastFilePath = blastPath+'/'+theBlastFile; 
            
    // if direcgtory doesn't exist, create it
    if (!fs.existsSync(blastPath)){
        fs.mkdirSync(blastPath);
    }  
    
    try {
        ws = fs.createWriteStream(theFullBlastFilePath);
        ws.write(region);
        ws.end();
    }
    catch (e) {
        sails.log.error(e,theFullBlastFilePath);
        //res.send(e); // return POST
        return;
    }
    
    // write variable to global
    // todo: later the name and perhaps additional info should come from the FASTA header (ie: JBlast ctgA ctgA:46990..48410 (- strand)
    // which should appear as the track name when the operation is done.
    var blastData = {
            "name": "JBlast", 
            //"blastSeq": "/var/www/html/jb-galaxy-blaster/tmp/44705works.fasta",
            "blastSeq": theFullBlastFilePath,
//            "originalSeq": "/var/www/html/jb-galaxy-blaster/tmp/volvox.fa",
            "offset": startCoord
    };
    
    sails.hooks['jbcore'].setGlobalSection(blastData,"jblast", function(err) {
        
        if (err) {
            sails.log.error("jbcore: failed to save globals");
            //res.send(err); // return POST
            return;
        }

        var jg = g.jbrowse;
        var theFile = jg.jbrowseURL + jg.dataSet[0].dataPath + jg.jblast.blastResultPath+'/'+theBlastFile;
        
        // create the kue job entry
        var jobdata = {
            jbrowseDataPath: dataSetPath,
            sequence: seq,
            blastData: blastData,
            dataset: {
                workflow: workflow,
                file: theFile
            }
        };
        var kJob = g.kue_queue.create('galaxy-workflow-watch', jobdata)
        .state('active')
        .save(function(err){
            if (!err) {
                sails.log.debug("workflow watch adding job id = "+kJob.id);
                //res.send(err); // return POST
                return;
            }
            sails.log.error('error creating workflow watch job');
        });
        
        // promise chain
        // send the file
        var p = sails.hooks['jb-galaxy-blast'].sendFileAsync(theFile,historyId)
            .then(function(data) {

                kJob.data.dataset = data;
                kJob.save();

                var fileId = data.outputs[0].id;

                var params = {
                    workflow_id: workflow,
                    history: 'hist_id='+historyId,
                    ds_map: {
                        "0": {
                            src: 'hda',
                            id: fileId
                        }
                    }
                };
                // submit the workflow
                return sails.hooks['jb-galaxy-blast'].galaxyPostAsync('/api/workflows',params);
            })
            .then(function(data) {
                kJob.data.workflow = data;
                kJob.save();
                //res.send(data); // return POST
                sails.log.debug("********************* get workflows");
                sails.hooks['jb-galaxy-blast'].galaxyGetJSON('/api/workflows',function(data){
                    sails.log.debug("********************check data",data);
                    for(var i in data) {
                        var wf = data[i];
                        if (wf.id === workflow) {
                            sails.log.info("Workflow starting: "+wf.name+' - '+wf.id);
                            kJob.data.workflow.name = wf.name;
                            kJob.save();
                        }
                    }
                },
                function(err) {
                    sails.log.error("err /api/workflows",err);
                });
                
                
                // start monioring
                monitorWorkflow(kJob);
            })
            .catch(function(err){
                sails.log.error(err);
                kJob.data.error = err;
                kJob.save();
                //res.send(err); // return POST
            });
    });    
}
/**
 * Monitor workflow
 * @param {type} kWorkflowJob
 * @returns {undefined}
 */
function monitorWorkflow(kWorkflowJob){
    var wId = kWorkflowJob.data.workflow.workflow_id;
    sails.log.debug(wId,'monitorWorkflow starting');
    
    var timerloop = setInterval(function(){
        var hId = sails.hooks['jb-galaxy-blast'].getHistoryId();
        var outputs = kWorkflowJob.data.workflow.outputs;    // list of workflow output history ids
        var outputCount = outputs.length;
        
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
            // complete if all states ok
            if (outputCount === okCount) {
                clearInterval(timerloop);
                kWorkflowJob.state('complete');
                kWorkflowJob.save();
                sails.log.debug(wId,'workflow completed');
                setTimeout(function() {
                    postAction.doCompleteAction(kWorkflowJob,hista);
                },10);
            }
        })
        .catch(function(err){
            sails.log.error(wId,"monitorWorkflow: failed to get history",hId);
            clearInterval(timerloop);
        });
        
    },3000);
}

/**
 * 
 * @param {type} theFile
 * @param {type} hId
 * @param {type} cb
 * @param {type} cberr
 * @returns {undefined}
 */
function sendFile(theFile,hId,cb,cberr) {
    var params = 
    {
        "tool_id": "upload1",
        "history_id": hId,   // must reference a history
        "inputs": {

            "dbkey":"?",
            "file_type":"auto",
            "files_0|type":"upload_dataset",
            "files_0|space_to_tab":null,
            "files_0|to_posix_lines":"Yes",
            "files_0|url_paste":theFile
        }
    };
    sails.hooks['jb-galaxy-blast'].galaxyPostAsync('/api/tools',params)
       .then(function(data) {
            cb(data);
       })
       .catch(function(err) {
           cb(err);
       });
}

/**
 * return the starting coordinate
 * >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
 * @param {type} str
 * @returns {unresolved}
 */
function getRegionStart(str) {
    var line = str.split("\n")[0];
    var re = line.split(":")[1].split("..")[0];
    return re;
}
function parseSeqData(str) {
    var line = str.split("\n")[0];
    return {
        seq: line.split(">")[1].split(" ")[0],
        start: line.split(":")[1].split("..")[0],
        end: line.split("..")[1].split(" ")[0],
        strand: line.split("(")[1].split(" ")[0],
        class: line.split("class=")[1].split(" ")[0],
        length: line.split("length=")[1]
    };
}
/**
 * 
 * @param {type} cb - callback cb(data)
 * @returns {undefined}
 */
function rest_testNewTrack(cb) {
    sails.log("addTrackJson()");
    var g = sails.config.globals.jbrowse;

    var theFile = g.jbrowsePath + g.dataSet[0].dataPath + g.jblast.blastResultPath + '/testTrack2.json';
    
    var addTrack = fs.readFileSync(theFile);
    addTrack = JSON.parse(addTrack);
    
    
    var t = new Date().getTime()
    
    // generate random label
    addTrack.label = "test" + t;
    addTrack.key = addTrack.label;
    
    //addTrack = [addTrack];
    
    // publish notifications
    //deferred.map (addTrack, function (track) {
        var track = addTrack;
        //sails.hooks['jbcore'].sendEvent("track-new",{"value":track});
        sails.hooks['jbcore'].sendEvent("track-new",track);
        sails.log ("Announced new track ",track.label);
        cb({result:track.label});
    //});
}
