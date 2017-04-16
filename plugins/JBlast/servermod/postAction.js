var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var filter = require("./filter");   // filter processing
var offsetfix = require("./offsetfix");
var blast2json = require("./blastxml2json");

module.exports = {
    doCompleteAction: function(kWorkflowJob,hista) {
        doCompleteAction(kWorkflowJob,hista);
    }
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
    var dataSetPath = g.jbrowsePath + kWorkflowJob.data.jbrowseDataPath + '/';    //g.dataSet[0].dataPath;
    var targetDir = dataSetPath + g.jblast.blastResultPath;
    
    //sails.log("steps",steps);
    kWorkflowJob.data.blastData.outputs = {};
    
    var filecount = 0;  // this is used to identify number of outstanding files to copy, when it reaches zero, we are finished copying.
    
    //sails.log.debug("wf steps", steps);
    
    // find entries with "export" labels and copy those files to the dataset path
    var filesToMove = 0;
    for(var i in steps) {
        var label = steps[i].workflow_step_label;
        var id = steps[i].job_id;
        //sails.log.debug(wId,'step',i,"typeof label",label);
        sails.log('step',i,'id',id);
        if (label != null && label.indexOf('export') !== -1) {
            
            filesToMove++;
            //sails.log('label',label);
            if (typeof hista[id] === 'undefined'){
                sails.log.error("error undefined hist[id]",id);
                continue;
            }
            sails.log.debug('id, hista[id]',id,hista[id],hista[id].extension);
            var ext = hista[id].extension;
            var url = g.galaxy.galaxyUrl+'/'+hista[id].url + "/display";
            var hid = hista[id].hid;
            //var filename = hid+'_'+id;  //+'.'+ext;
            var assetId = kWorkflowJob.id+'_'+id;  //+'.'+ext;
            var filepath = targetDir + '/' + assetId + '.'+ext;
            
            kWorkflowJob.data.blastData.outputs[ext] = assetId; 
            //kWorkflowJob.data.blastData.assetId = assetId; 
            
            
            sails.log.info(wId,'writing',filepath);
            filecount++;
            
            // move the files to the destination folder
            var stream = request(url).pipe(fs.createWriteStream(filepath));
            stream.on('finish', function () {     // detect file finished copying
                sails.log.debug("finished file");
                filecount--;
            });
        }
    }
    if (filesToMove==0) {
        var msg = "No files to export.  Is the label: export [type] defined in the workflow?";
        sails.log.error(msg);
        //kWorkflowJob.data.errorMsg = msg;
        //kWorkflowJob.state('failed');
        //kWorkflowJob.save();
        kWorkflowJob.kDoneFn(new Error(msg));
    }
    else {
        // wait for files to finish copying
        var t = setInterval(function() {
            if (filecount === 0) {
                sails.log.debug("done moving files");
                kWorkflowJob.save();

                // insert track into trackList.json
                postMoveResultFiles(kWorkflowJob,function(newTrackJson){

                    // convert xml to json
                    blast2json.convert(kWorkflowJob,newTrackJson,function(err) {
                        if (err) {
                            sails.log.error(err.msg);
                            kWorkflowJob.kDoneFn(new Error(err.msg));
                            return;
                        }
                        // check if there were any hits.
                        if (getHits(kWorkflowJob,newTrackJson)===0) {
                            var msg = "No Blast Hits";
                            sails.log.error(msg);
                            //kWorkflowJob.data.errorMsg = msg;
                            //kWorkflowJob.state('failed');
                            //kWorkflowJob.save();
                            kWorkflowJob.kDoneFn(new Error(msg));
                        }
                        else {
                            offsetfix.process(kWorkflowJob,newTrackJson,function() {
                                processFilter(kWorkflowJob,newTrackJson,function() {
                                    addToTrackList(kWorkflowJob,newTrackJson);
                                });
                            });
                        }
                        
                    });

                });
                clearInterval(t);
            }
        },100);
    }
}
/**
 * 
 * 
 * @param {type} steps is list of functions i.e. ['function1','function2']
 * @param {type} kJob
 * @param {type} newTrackJson
 * @param {type} cb
 * @returns {undefined}
 */
function processResults(steps,kJob,trackJson,cb) {
    
    var stepctx = {
        step: 0,
        steps:steps
    }
}
function processResultStep(stepctx,kJob,trackJson,cb) {
    
    stepctx.steps[stepctx.step](kJob,trackJson,function(stepctx) {
       stepctx.step++;
       if (stepctx.steps.length == stepctx.step) {
           cb();
       }
       else {
           processResultStep(stepctx,kJob,trackJson,cb);
       }
    });
}
/**
 * this generates track template
 * @returns {undefined}
 */
function postMoveResultFiles(kWorkflowJob,cb) {
    var wId = kWorkflowJob.data.workflow.workflow_id;
    sails.log.debug(wId,'moveResultFiles()');

    function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    var g = sails.config.globals.jbrowse;
    // this is the track template file
    var trackListPath = g.jbrowsePath + kWorkflowJob.data.jbrowseDataPath; //g.dataSet[0].dataPath;// + g.jblast.blastResultPath;
    var blastResultPath = trackListPath +'/'+ g.jblast.blastResultPath;
    var newTrackPath = blastResultPath+'/'+g.jblast.insertTrackTemplate; //"inMemTemplate.json"
    
    var p = fs.readFileAsync (newTrackPath)
    .then(function(newTrackData) {
        p.exited = 0;

        var newTrackJson = JSON.parse(newTrackData);

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
        //var trackLabel = kWorkflowJob.data.blastData.name+'-'+dateFormat(ts,"isoDateTime");
        
        // galaxy history id
        //var galaxyHistId = kWorkflowJob.data.blastData.outputs.json.split("_")[0];
        
        var trackLabel = 'blast '+kWorkflowJob.id+' '+kWorkflowJob.data.sequence.seq+':('+kWorkflowJob.data.sequence.start+'..'+kWorkflowJob.data.sequence.end+')'
            + kWorkflowJob.data.sequence.strand+' len '+kWorkflowJob.data.sequence.length;
    
        sails.log.info('trackLabel',trackLabel);

        var fileGffOnly = kWorkflowJob.data.blastData.outputs.gff3 +'.gff3';
        var fileJsonOnly = kWorkflowJob.data.blastData.outputs.json + '.json';
        var fileBlastFilter = kWorkflowJob.data.blastData.outputs.json + '_filtersettings.json';

        // replace some track info
        newTrackJson[0].baseUrl = kWorkflowJob.data.jbrowseDataPath; //g.dataSet[0].dataPath;
        newTrackJson[0].urlTemplate = g.jblast.blastResultPath+"/"+fileGffOnly;
        //newTrackJson[0].jblastData = g.jblast.blastResultPath+"/"+fileJsonOnly;
        newTrackJson[0].label = kWorkflowJob.data.blastData.outputs.json; //"jblast-"+ (new Date().getTime());
        newTrackJson[0].key = trackLabel;
        newTrackJson[0].metadata = {
                description: 'Workflow: '+kWorkflowJob.data.workflow.name
            }
        newTrackJson[0].category = g.jblast.blastResultCategory;
        newTrackJson[0].storeCache = false;
        
        // alternate track info
        var dataset = replaceAll(kWorkflowJob.data.jbrowseDataPath,'/','%2F');   //g.dataSet[0].dataPath
        
        newTrackJson[0].baseUrl = '/';
        newTrackJson[0].urlTemplate = '/jbapi/gettrackdata/' +kWorkflowJob.data.blastData.outputs.json + '/' + dataset;
        newTrackJson[0].storeCache = false;
        newTrackJson[0].filterSettings = g.jblast.blastResultPath+"/"+fileBlastFilter;
        newTrackJson[0].jblast = 1;     // indicate this is a jblast generated track
        //newTrackJson[0].jblastGff = g.jblast.blastResultPath+"/"+kWorkflowJob.data.blastData.outputs.json + '.gff3';

        //addToTrackList(kWorkflowJob,newTrackJson);
        //processOffset(kWorkflowJob,newTrackJson);
        kWorkflowJob.data.track = newTrackJson[0];
        kWorkflowJob.save();
        
        cb(newTrackJson);
    });
}
/**
 * Generate the GFF file 
 * @param {type} newTrackJson
 * @returns {undefined}
 */
function processFilter(kWorkflowJob,newTrackJson,cb) {
    sails.log("processFilter()");
    //var g = sails.config.globals.jbrowse;
    
    filter.filterInit(kWorkflowJob,newTrackJson, function(filtered){
        var asset = {
            "asset": newTrackJson[0].label,
            "dataSet": kWorkflowJob.data.jbrowseDataPath   //g.dataSet[0].dataPath
        };
        filter.applyFilter(0,asset,function() {
            cb();
        });
    });
}
function getHits(kWorkflowJob,newTrackJson) {
    sails.log.debug('applyFilter()');
    var g = sails.config.globals.jbrowse;
    var asset = newTrackJson[0].label;
    var dataSet = kWorkflowJob.data.jbrowseDataPath;
    //var filterData = requestData.filterParams;
    //sails.log.debug('newTrackJson',newTrackJson);

    var resultFile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'.json';

    try {
        var content = fs.readFileSync(resultFile, 'utf8');
    } catch(e) {
        sails.log.error("failed to read blast json",resultFile);
        return 0;
    }
    var blastJSON = JSON.parse(content);
    var blastData = blastJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
    var hits = 0;
    for(var x in blastData) {
        hits ++;
    }
    
    return hits;
}
/**
 * 
 */
function addToTrackList(kWorkflowJob,newTrackJson) {
    sails.log("addToTrackList()");
    var g = sails.config.globals.jbrowse;
    
    //todo: make this configurable later
    var trackListPath = g.jbrowsePath + kWorkflowJob.data.jbrowseDataPath + '/trackList.json';   //g.dataSet[0].dataPath

    sails.log("trackListPath = "+trackListPath);
    sails.log("newTrackJson",newTrackJson.key);
    
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
                sails.log.error ("Invalid track JSON: missing a label element");
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


        //return;
        

        // write the new track list
        sails.log("start track count "+trackListJson.tracks.length);
        sails.log("writing new tracklist...");

        var trackListOutputData = JSON.stringify (trackListJson, null, 2);
        fs.writeFileSync (trackListPath, trackListOutputData);

        // publish notifications
        deferred.map (addedTracks, function (track) {
            sails.hooks['jbcore'].sendEvent("track-new",track);
            sails.log ("Announced new track ",track.label);
        });
        //deferred.map (replacedTracks, function (track) {
        //    sails.hooks['jbcore'].sendEvent("track-replace",track);
        //    sails.log ("Announced replacement track ",track.label);
        //});
        
        kWorkflowJob.progress(100,100);
        
        kWorkflowJob.kDoneFn();                                                 // kue workflow completed successfully
    });
}


