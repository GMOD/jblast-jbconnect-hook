/**
 * @module
 * @description
 * This module implements the actions that occur after a galaxy workflow completes.
 * It supports galaxyBlastService job service.
 * 
 */
var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var filter = require("./filter");   // filter processing
var offsetfix = require("./offsetfix");
var blast2json = require("./blastxml2json");
var galaxy = require("./galaxyUtils");
var _ = require('lodash');

module.exports = {
    postMoveResultFiles: function(kJob,cb) {
        return postMoveResultFiles(kJob,cb);
    },
    getHits: function(kJob,newTrackJson) {
        return getHits(kJob,newTrackJson);
    },
    processFilter: function(kJob,newTrackJson,cb) {
        return processFilter(kJob,newTrackJson,cb);
    }
};


/*
 * process results
 * 
 * @param {array} steps is list of functions i.e. ['function1','function2']
 * @param {object} kJob - kue job object
 * @param {object} newTrackJson - working new track object
 * @param {function} cb - callback function
 */
/* obsolete
function processResults(steps,kJob,trackJson,cb) {
    
    var stepctx = {
        step: 0,
        steps:steps
    }
}
*/
/**
 * processResultStep
 * 
 * @param {object} stepctx - galaxy workflow step context
 * @param {object} kJob - kue job object
 * @param {JSON} trackJson - working new track object
 * @param {function} cb - callback function
 * 
 */
/* obsolete
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
*/
/**
 * this generates track template
 * 
 * @param {type} kJob - kue job object
 * @param {type} cb - callback
 * 
 */
function postMoveResultFiles(kJob,cb) {

    function escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    var g = sails.config.globals.jbrowse;
    // this is the track template file
    var trackListPath = g.jbrowsePath + kJob.data.dataset; //g.dataSet[0].dataPath;// + g.jblast.blastResultPath;
    var blastResultPath = trackListPath +'/'+ g.jblast.blastResultPath;
    var newTrackPath = blastResultPath+'/'+g.jblast.trackTemplate; //"inMemTemplate.json"
    
    var p = fs.readFileAsync (newTrackPath)
    .then(function(newTrackData) {
        p.exited = 0;

        var newTrackJson = JSON.parse(newTrackData);

        //if it's a single definition, coerce to an array
        // istanbul ignore next
        if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
            newTrackJson = [ newTrackJson ];
        }

        // validate the new track JSON structures
        newTrackJson.forEach (function (track) {
            // istanbul ignore next
            if (!track.label) {
                console.error("Invalid track JSON: missing a label element");
                p.exited = 1;
                return;
            }
        });
        
        // merge trackData from job submit options, if any
        // istanbul ignore next
        if (kJob.data.trackData)
            newTrackJson[0] = _.merge(newTrackJson[0],kJob.data.trackData);

        var dateFormat = require('dateformat');
        var ts = new Date();  

        var fileGffOnly = kJob.data.blastData.outputs.gff3 +'.gff3';
        var fileJsonOnly = kJob.data.blastData.outputs.json + '.json';
        var fileBlastFilter = kJob.data.blastData.outputs.blastxml + '_filtersettings.json';

        // replace some track info
        newTrackJson[0].baseUrl = kJob.data.dataset; //g.dataSet[0].dataPath;
        newTrackJson[0].urlTemplate = g.jblast.blastResultPath+"/"+fileGffOnly;
        //newTrackJson[0].jblastData = g.jblast.blastResultPath+"/"+fileJsonOnly;
        
        // todo: should not be outputs.blastxml (too specific to filetype);  should be something like assetId
        newTrackJson[0].label = kJob.data.blastData.outputs.blastxml; //"jblast-"+ (new Date().getTime());
        //newTrackJson[0].key = trackLabel;     // the track label is determined after the filter process, bc we need the hit count.
        newTrackJson[0].metadata = {
                description: 'Workflow: '+kJob.data.name
            };
        newTrackJson[0].category = g.jblast.blastResultCategory;
        newTrackJson[0].storeCache = false;
        
        // alternate track info
        var dataset = replaceAll(kJob.data.dataset,'/','%2F');   //g.dataSet[0].dataPath
        
        newTrackJson[0].baseUrl = '/';
        //newTrackJson[0].urlTemplate = '/jbapi/gettrackdata/' +kJob.data.blastData.outputs.blastxml + '/' + dataset;  // old way
        newTrackJson[0].urlTemplate = '/service/exec/get_trackdata/?asset=' +kJob.data.blastData.outputs.blastxml + '&dataset=' + dataset;
        newTrackJson[0].storeCache = false;
        newTrackJson[0].filterSettings = g.jblast.blastResultPath+"/"+fileBlastFilter;
        newTrackJson[0].jblast = 1;     // indicate this is a jblast generated track

        kJob.data.track = newTrackJson[0];
        kJob.update(function() {});
        
        cb(newTrackJson);
    });
}
/**
 * Generate the GFF file 
 * 
 * @param {type} kJob = kue job object
 * @param {type} newTrackJson - working track object
 * @param {type} cb - callback
 * 
 */
function processFilter(kJob,newTrackJson,cb) {
    sails.log("processFilter()");
    var g = sails.config.globals.jbrowse;
    var fileBlastFilter = kJob.data.blastData.outputs.blastxml + '_filtersettings.json';
    kJob.data.blastData.filterSettings = g.jblast.blastResultPath+"/"+fileBlastFilter;
    kJob.update(function() {});

    filter.filterInit(kJob, function(filtered){
        var asset = {
            "asset": kJob.data.blastData.outputs.blastxml, //newTrackJson[0].label,
            "dataset": kJob.data.dataset,   //g.dataSet[0].dataPath
            "noAnnounce": true,
            "contig": kJob.data.sequence.seq
        };
        filter.applyFilter(0,asset,function(hitdata) {
            kJob.data.blastData.hits = hitdata.hits;
            let seq = kJob.data.sequence;
            
            // change the title is sequence is unmapped (not in source refseq space)
            let refseq = kJob.data.unmappedSeq ? "unmapped" : seq.seq;
            
            var trackLabel = 'blast '+kJob.id+' ('+refseq+':'+seq.start+'..'+seq.end+')'
                +' '+hitdata.hits + ' hits';
            
            newTrackJson[0].key = trackLabel;
            
            kJob.update(function() {});
            cb(hitdata);
        });
    });
}
/**
 * return number of hits
 * 
 * @param {object} kJob - kue job object
 * @param {JSON} newTrackJson - working track object
 * @returns {Number} number of hits
 * 
 */
function getHits(kJob,newTrackJson) {
    sails.log.debug('getHits()');
    var g = sails.config.globals.jbrowse;
    var asset = newTrackJson[0].label;
    var dataSet = kJob.data.dataset;

    var resultFile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'.json';

    try {
        var content = fs.readFileSync(resultFile, 'utf8');
    }
    catch(e) {
        /* istanbul ignore next */
        if (true) {
            sails.log.error("failed to read blast json in getHits",resultFile);
            return 0;
        }
    }
    var blastJSON = JSON.parse(content);
    var blastData = blastJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
    var hits = 0;
    for(var x in blastData) {
        hits ++;
    }
    sails.log('>>> getHits return',hits, typeof hits);
    return hits;
}
