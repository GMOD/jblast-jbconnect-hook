/**
 * @module
 * @description
 * This module implements the actions that occur after a galaxy workflow completes.
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
 * @param {object} kJob
 * @param {object} hista - associative array of histories
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
                sails.log.error("Failed to write",filepath)
            }
        }
    }
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
                        if (err) {
                            sails.log.error(err.msg);
                            kJob.kDoneFn(new Error(err.msg));
                            return;
                        }
                        sails.log.debug("post convert newTrackJson",newTrackJson);

                        // check if there were any hits.
                        if (getHits(kJob,newTrackJson)===0) {
                            var msg = "No Blast Hits";
                            sails.log.error(msg);
                            kJob.kDoneFn(new Error(msg));
                        }
                        else {
                            offsetfix.process(kJob,newTrackJson,function() {
                                processFilter(kJob,newTrackJson,function(hitdata) {
                                    // postAction is a service in JBServer
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
 * 
 * 
 * @param {array} steps is list of functions i.e. ['function1','function2']
 * @param {object} kJob
 * @param {JSON object} newTrackJson
 * @param {function} cb - callback function
 */
function processResults(steps,kJob,trackJson,cb) {
    
    var stepctx = {
        step: 0,
        steps:steps
    }
}
/**
 * processResultStep
 * 
 * @param {object}      stepctx
 * @param {object}      kJob
 * @param {JSON} trackJson
 * @param {function}    cb - callback function
 */
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
 * 
 * @param {type} kJob
 * @param {type} cb
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
 * @param {type} kJob
 * @param {type} newTrackJson
 * @param {type} cb
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
            "dataset": kJob.data.dataset   //g.dataSet[0].dataPath
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
 * @param {object} kJob
 * @param {JSON} newTrackJson
 * @returns {Number} hits
 */
function getHits(kJob,newTrackJson) {
    sails.log.debug('getHits()');
    var g = sails.config.globals.jbrowse;
    var asset = newTrackJson[0].label;
    var dataSet = kJob.data.dataset;
    //var filterData = requestData.filterParams;
    //sails.log.debug('newTrackJson',newTrackJson);

    var resultFile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'.json';

    try {
        var content = fs.readFileSync(resultFile, 'utf8');
    } catch(e) {
        sails.log.error("failed to read blast json in getHits",resultFile);
        return 0;
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
