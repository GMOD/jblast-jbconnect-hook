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

//var prettyjson = require('prettyjson');   // for debugging

var historyName = '';
var historyId = '';

module.exports = function (sails) {

   return {
        initialize: function(cb) {
            sails.log.info("Sails Hook: "+path.basename(__filename)+" initialize"); 
            // todo: check that galaxy is running

            sails.on('hook:orm:loaded', function() {
                // do something after hooks are loaded
                //console.log(sails.hooks);
                return cb();
            });
            // initialize history
            init_history(this);
            //return cb();
        },
        routes: {
           after: {
              //'post /jbapi/blastregion': rest_BlastRegion,
              'post /jbapi/workflowsubmit': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/workflowsubmit");
                  rest_WorkflowSubmit(req,res);
              },
              'get /jbapi/getworkflows': function (req, res, next) {
                    console.log("jb-galaxy-kue-sync /jbapi/getworkflows called");
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

              'post /jbapi/posttest': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/posttest");
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                  res.send(req.body);
              },
              'get /jbapi/test': function (req, res, next) {
                  sails.log.info(path.basename(__filename),"/jbapi/gettest");
                  res.send({result:"jb-galaxy-blast gettest success"});
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

            requestp(options)
                .then(function (data) {
                    cb(data);
                })
                .catch(function (err) {
                    console.log('erro GET /api/histories');
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

            //console.log(req);
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
            console.log('init_history failed');
        });
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
    
    // get starting coord of region
    var startCoord = getRegionStart(region);

    var d = new Date();

    // write the BLAST region file
    
    var theBlastFile = "blast_region"+d.getTime()+".fa";
    
    // write the received region into a file
    // todo: handle errors
    
    var blastPath = g.jbrowse.jbrowsePath + g.jbrowse.dataSet[0].dataPath + g.jbrowse.jblast.blastResultPath;
    var theFullBlastFilePath = blastPath+'/'+theBlastFile; 
    console.log("theBlastFile",theBlastFile);
            
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
        console.log(e,theFullBlastFilePath);
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
            console.log("jbcore: failed to save globals");
            return;
        }

        var jg = g.jbrowse;
        var theFile = jg.jbrowseURL + jg.dataSet[0].dataPath + jg.jblast.blastResultPath+'/'+theBlastFile;
        
        // create the kue job entry
        var kJob = g.kue_queue.create('galaxy-workflow-watch', {
            blastData: blastData,
            dataset: {
                workflow: workflow,
                file: theFile
            }
        })
        .state('active')
        .save(function(err){
            if (!err) {
                console.log("workflow watch adding job id = "+kJob.id);
                return;
            }
            console.log('error creating workflow watch job');
        });
        
        // promise chain
        // send the file
        var p = sails.hooks['jb-galaxy-blast'].sendFileAsync(theFile,historyId)
            .then(function(data) {
                //console.log("send file result",data);

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
                
                // start monioring
                monitorWorkflow(kJob);
            })
            .catch(function(err){
                sails.log.error(err);
                kJob.data.error = err;
                kJob.save();
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
                    doCompleteAction(kWorkflowJob,hista);
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
 * Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.
 * 
 * @param {type} kWorkflowJob
 * @param {type} hista - associative array of histories
 */
function doCompleteAction(kWorkflowJob,hista) {
    var wId = kWorkflowJob.data.workflow.workflow_id;
    sails.log.debug(wId,'doCompleteAction()');
    
    var steps = kWorkflowJob.data.workflow.steps;
    var g = sails.config.globals.jbrowse;
    var dataSetPath = g.jbrowsePath + g.dataSet[0].dataPath;
    var targetDir = dataSetPath + g.jblast.blastResultPath;
    
    //sails.log("steps",steps);
    kWorkflowJob.data.blastData.outputs = {};
    
    // find entries with export labels
    for(var i in steps) {
        var label = steps[i].workflow_step_label;
        var id = steps[i].job_id;
        //sails.log.debug(wId,'step',i,"typeof label",label);
        sails.log('step',i,'id',id);
        if (label != null && label.indexOf('export') !== -1) {
            sails.log('label',label);
            if (typeof hista[id] === 'undefined'){
                sails.log("undefined hist[id]",id);
                continue;
            }
            sails.log.debug('id, hista[id]',id,hista[id],hista[id].extension);
            var ext = hista[id].extension;
            var url = g.galaxy.galaxyUrl+'/'+hista[id].url + "/display";
            var hid = hista[id].hid;
            var filename = hid+'_'+id+'.'+ext;
            var filepath = targetDir + '/' + filename;
            
            kWorkflowJob.data.blastData.outputs[ext] = filename; 
            
            sails.log.info(wId,'writing',filepath)
            request(url).pipe(fs.createWriteStream(filepath));
        }
    }
    kWorkflowJob.save();
    
    // insert track into trackList.json
    moveResultFiles(kWorkflowJob,function(newTrackJson){
        addToTrackList(newTrackJson);
    });
}
/**
 * 
 * @returns {undefined}
 */
function moveResultFiles(kWorkflowJob,cb) {
    var wId = kWorkflowJob.data.workflow.workflow_id;
    sails.log.debug(wId,'insertTrack()');

    var g = sails.config.globals.jbrowse;
    // this is the track template file
    var trackListPath = g.jbrowsePath+g.dataSet[0].dataPath;// + g.jblast.blastResultPath;
    var blastResultPath = trackListPath + g.jblast.blastResultPath;
    var newTrackPath = blastResultPath+'/'+"inMemTemplate.json";
    
    var p = fs.readFileAsync (newTrackPath)
    .then(function(newTrackData) {
        p.exited = 0;

        var newTrackJson = JSON.parse(newTrackData);

        //console.log("file content");
        //console.info(newTrackJson);

        //if it's a single definition, coerce to an array
        if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
            newTrackJson = [ newTrackJson ];
        }

        // validate the new track JSON structures
        newTrackJson.forEach (function (track) {
            if (!track.label) {
                console.error("Invalid track JSON: missing a label element");
                p.exited = 1;
                return;
            }
        });
        
        var dateFormat = require('dateformat');
        var ts = new Date();  
        var trackLabel = kWorkflowJob.data.blastData.name+'-'+dateFormat(ts,"isoDateTime");

        var fileGffOnly = kWorkflowJob.data.blastData.outputs.gff3;
        var fileJsonOnly = kWorkflowJob.data.blastData.outputs.json;

        // replace some track info
        newTrackJson[0].baseUrl = g.dataSet[0].dataPath;
        newTrackJson[0].urlTemplate = g.jblast.blastResultPath+"/"+fileGffOnly;
        newTrackJson[0].blastData = g.jblast.blastResultPath+"/"+fileJsonOnly;
        newTrackJson[0].label = "jblast-"+ (new Date().getTime());
        newTrackJson[0].key = trackLabel;
        newTrackJson[0].category= g.jblast.blastResultCategory;

        addToTrackList(newTrackJson);
    });
}
/**
 * 
 * @param {type} req
 * @param {type} res
 * @param {type} next
 * @returns {addTrackJson.indexAnonym$4}
 */
function addToTrackList(newTrackJson) {
    sails.log("addTrackJson()");
    var g = sails.config.globals.jbrowse;
    
    //todo: make this configurable later
    var trackListPath = g.jbrowsePath + g.dataSet[0].dataPath + 'trackList.json';
    
    sails.log("trackListPath = "+trackListPath);
    sails.log("newTrackJson = ",newTrackJson);
    
    var p = fs.readFileAsync(trackListPath)
    .then(function (trackListData) {
        var trackListJson = JSON.parse(trackListData);
        //trackListJson.tracks = trackListJson.tracks || [];
        
        sails.log("read "+trackListJson.tracks.length + " tracks");

        // if it's a single definition, coerce to an array
        if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
            newTrackJson = [ newTrackJson ];
        }
        else {
            sails.log("is array of tracks");
        }

        // validate the new track JSON structures
        sails.log("validating...");
        newTrackJson.forEach (function (track) {
            if (!track.label) {
                console.log ("Invalid track JSON: missing a label element");
            }
        });

        // insert/replace the tracks (merge)
        sails.log("insert/replace...");
        var addedTracks = [], replacedTracks = [];

        sails.log("start track count "+trackListJson.tracks.length);

        newTrackJson.forEach (function (newTrack) {
            var newTracks = [];
            trackListJson.tracks.forEach (function (oldTrack) {
                if (oldTrack.label === newTrack.label) {
                    newTracks.push (newTrack);
                    replacedTracks.push (newTrack);
                    newTrack = {};
                } else {
                    newTracks.push (oldTrack);
                }
            });
            if (newTrack.label) {
                newTracks.push (newTrack);
                addedTracks.push (newTrack);
                sails.log("newtrack",newTrack.label);
            }
            trackListJson.tracks = newTracks;
        });

        // write the new track list
        sails.log("start track count "+trackListJson.tracks.length);
        sails.log("writing new tracklist...");

        var trackListOutputData = JSON.stringify (trackListJson, null, 2);
        fs.writeFileSync (trackListPath, trackListOutputData);

        // publish notifications
        deferred.map (addedTracks, function (track) {
            sails.hooks['jbcore'].sendEvent("track-new",{"value":track});
            sails.log ("Announced new track ",track.label);
        });
        deferred.map (replacedTracks, function (track) {
            sails.hooks['jbcore'].sendEvent("track-replace",{value:track});
            sails.log ("Announced replacement track ",track.label);
        });
    });
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

