var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');

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
    sails.log.debug(wId,'moveResultFiles()');

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
    sails.log("addToTrackList()");
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
            sails.hooks['jbcore'].sendEvent("track-new",track);
            sails.log ("Announced new track ",track.label);
        });
        deferred.map (replacedTracks, function (track) {
            sails.hooks['jbcore'].sendEvent("track-replace",track);
            sails.log ("Announced replacement track ",track.label);
        });
    });
}


