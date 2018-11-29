/**
 * @module
 * @description
 * This module implements the actions that occur after a galaxy workflow completes.
 * It supports galaxyService job service.
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

module.exports = {
    doCompleteAction: function(kJob,hista) {
        return doCompleteAction(kJob,hista);
    },
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


/**
 * Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.
 * 
 * @param {object} kJob - kue job object
 * @param {object} hista - associative array of histories
 * 
 */
function doCompleteAction(kJob,hista) {
    var wId = kJob.data.workflow;
    sails.log.debug(wId,'doCompleteAction()');
    
    var steps = kJob.data.workflowData.steps;
    var g = sails.config.globals.jbrowse;
    var dataSetPath = g.jbrowsePath + kJob.data.dataset + '/';    //g.dataSet[0].dataPath;
    var targetDir = dataSetPath + g.jblast.blastResultPath;
    
    //sails.log("steps",steps);
    kJob.data.blastData.outputs = {};
    
    var filecount = 0;  // this is used to identify number of outstanding files to copy, when it reaches zero, we are finished copying.
    
    //sails.log.debug("wf steps", steps);
    
    // find entries with "export" labels and copy those files to the dataset path
    var filesToMove = 0;
    for(var i in steps) {
        //var label = steps[i].workflow_step_label;
        var id = steps[i].job_id;
        //sails.log.debug(wId,'step',i,"typeof label",label);
        sails.log('step',i,'id',id);
        //if (label != null && label.indexOf('export') !== -1) {
        // check extension is importable (defined in the global import list)
        if (id !== null && typeof hista[id].extension !== 'undefined' && g.jblast.import.indexOf(hista[id].extension) !== -1) {
        
            filesToMove++;
            //sails.log('label',label);
            /* istanbul ignore next */
            if (typeof hista[id] === 'undefined'){
                sails.log.error("error undefined hist[id]",id);
                continue;
            }
            sails.log.debug('id, hista[id]',id,hista[id],hista[id].extension);
            var ext = hista[id].extension;
            var url = g.galaxy.galaxyUrl+'/'+hista[id].url + "/display";
            var hid = hista[id].hid;
            //var filename = hid+'_'+id;  //+'.'+ext;
            var assetId = kJob.id+'_'+id;  //+'.'+ext;
            var filepath = targetDir + '/' + assetId + '.'+ext;
            
            kJob.data.blastData.outputs[ext] = assetId; 
            //kJob.data.blastData.assetId = assetId; 
            
            sails.log("id ")
            sails.log.info(wId,'writing',filepath);
            filecount++;
            
            // move the files to the destination folder
            try {
                var stream = request(url).pipe(fs.createWriteStream(filepath));
                stream.on('finish', function () {     // detect file finished copying
                    sails.log.debug("finished file");
                    filecount--;
                });
            }
            catch(err) {
                /* istanbul ignore next */
                sails.log.error("Failed to write",filepath)
            }
        }
    }
    /* istanbul ignore if */
    if (filesToMove==0) {
        var msg = "No files to export.  Is the label: export [type] defined in the workflow?";
        sails.log.error(msg);
        kJob.kDoneFn(new Error(msg));
    }
    else {
        // wait for files to finish copying
        var t = setInterval(function() {
            if (filecount === 0) {
                sails.log.debug("done moving files");
                //kJob.update(function() {});

                    // insert track into trackList.json
                    postMoveResultFiles(kJob,function(newTrackJson){

                    // convert xml to json
                    blast2json.convert(kJob,newTrackJson,function(err) {
                        // istanbul ignore next
                        if (err) {
                            sails.log.error(err.msg);
                            kJob.kDoneFn(new Error(err.msg));
                            return;
                        }
                        sails.log.debug("post convert newTrackJson",newTrackJson);

                        // check if there were any hits.
                        // istanbul ignore if
                        if (getHits(kJob,newTrackJson)===0) {

                            kJob.data.name = kJob.data.name+' No Hits';
                            kJob.update();
                    
                            var msg = "No Blast Hits";
                            sails.log.error(msg);
                            kJob.kDoneFn(new Error(msg));
                        }
                        else {
                            offsetfix.process(kJob,newTrackJson,function() {
                                processFilter(kJob,newTrackJson,function(hitdata) {
                                    // postAction is a service in JBConnect
                                    postAction.addToTrackList(kJob,newTrackJson);
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
        
        var dateFormat = require('dateformat');
        var ts = new Date();  
        //var trackLabel = kJob.data.blastData.name+'-'+dateFormat(ts,"isoDateTime");
        
        // galaxy history id
        //var galaxyHistId = kJob.data.blastData.outputs.json.split("_")[0];
        
        //var trackLabel = 'blast '+kJob.id+' ('+kJob.data.sequence.start+'..'+kJob.data.sequence.end+')'
        //    +' '+kJob.data.blastData.hits + ' hits';
        //var trackLabel = newTrackJson[0].key;
    
        //sails.log.info('trackLabel',trackLabel);

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
            
            var trackLabel = 'blast '+kJob.id+' ('+kJob.data.sequence.start+'..'+kJob.data.sequence.end+')'
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
