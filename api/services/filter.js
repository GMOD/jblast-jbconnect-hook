/**
 * @module
 * @description
 * Supporting methods for the filterService jservice.
 * 
 */
var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var merge = require('deepmerge');
var util = require("./utils");
const _ = require("lodash");

module.exports = {

    /**
     * create initial filter settings file
     * 
     * @param {object} kJob - kue job object
     * @param (function) cb - callback
     */
    filterInit: function(kJob,cb) {
        sails.log("filterInit()");
        var g = sails.config.globals.jbrowse;

        // read blast json file
        //var blastfile = g.jbrowsePath + kJob.data.dataset +'/' + g.jblast.blastResultPath +"/"+ newTrackJson[0].label + ".json";
        //var blastFilterFile = g.jbrowsePath + kJob.data.dataset + '/' + newTrackJson[0].filterSettings;
        var blastfile = g.jbrowsePath + kJob.data.dataset +'/' + g.jblast.blastResultPath +"/"+ kJob.data.blastData.outputs.blastxml + ".json";
        var blastFilterFile = g.jbrowsePath + kJob.data.dataset + '/' + kJob.data.blastData.filterSettings;
        
        sails.log('blastfile',blastfile);
        try {
            var content = fs.readFileSync(blastfile, 'utf8');
        } catch(e) {
            sails.log.error("failed to read blast file",blastfile);
            return;
        }
        //sails.log('content',content.length,content);
        this.blastData = JSON.parse(content);
        
        var filter = {
            "score": {
                "type": "abs",
                "min": Math.floor(this.getLowest('Hsp_bit-score')),
                "max": Math.ceil(this.getHighest('Hsp_bit-score')),
                "val": Math.floor(this.getLowest('Hsp_bit-score'))
            },
            "evalue": {
                "type": "exp",
                "min": this.getLowest10('Hsp_evalue'),
                "max": this.getHighest10('Hsp_evalue'),
                "val": this.getHighest10('Hsp_evalue')
            },
            "identity": {
                "type": "pct",
                "min": Math.floor(this.getLowestPct('Hsp_identity')),
                "max": Math.ceil(this.getHighestPct('Hsp_identity')),
                "val": Math.floor(this.getLowestPct('Hsp_identity'))
            },
            "gaps": {
                "type": "pct",
                "min": Math.floor(this.getLowestPct('Hsp_gaps')),
                "max": Math.ceil(this.getHighestPct('Hsp_gaps')),
                "val": Math.ceil(this.getHighestPct('Hsp_gaps'))
            }
        };
        
        sails.log('filter',filter);
        try {
            fs.writeFileSync(blastFilterFile,JSON.stringify(filter));
        } catch(e) {
            sails.log.error("failed to write",blastFilterFile);
        }
        cb(filter);
    },
    /**
     * get filterData
     * 
     * @param {object} requestData - eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox' }
     * @param {object} cb - function(filterData)
     * ::
     *       eg. filterData: { 
     *           score: {type: 'abs', min: 58, max: 593, val: 421 },
     *           evalue: { type: 'exp', min: 5.96151e-165, max: 0.000291283, val: 0.000291283 },
     *           identity: { type: 'pct', min: 78, max: 100, val: 78 },
     *           gaps: { type: 'pct', min: 0, max: 13, val: 13 } 
     *       }
     */
    getFilterSettings(requestData,cb) {
        sails.log.debug('getFilterSettings()');
        var asset = requestData.asset;
        var dataSet = requestData.dataset;
        
        var g = sails.config.globals.jbrowse;
        var filterfile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'_filtersettings.json';
        var fsettings = {};
        try {
            fsettings = JSON.parse(fs.readFileSync(filterfile));
            
        }catch (err) {
            sails.log.error('getFilterSettings failed to read',filterfile);
            return err;
        }

        cb(fsettings);
    },
    /**
     * write new data to filter settings file, given requestData
     * 
     * @param {object} requestData - eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox', filterParams: filterData }
     * @param {object} cb - updated filterData function(filterData)
     * ::
     *       eg. filterData: { 
     *           score: {type: 'abs', min: 58, max: 593, val: 421 },
     *           evalue: { type: 'exp', min: 5.96151e-165, max: 0.000291283, val: 0.000291283 },
     *           identity: { type: 'pct', min: 78, max: 100, val: 78 },
     *           gaps: { type: 'pct', min: 0, max: 13, val: 13 } 
     *       }
     */
    writeFilterSettings(requestData,cb) {
        sails.log.debug('writeFilterSettings()');
        
        this.getFilterSettings(requestData,function(fsettings) {
            try {
                var filterData = requestData.filterParams;
                //sails.log.debug('fitlerData',filterData);
                var asset = requestData.asset;
                var dataSet = requestData.dataset;
                var g = sails.config.globals.jbrowse;
                var filterfile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'_filtersettings.json';

                fsettings = _.merge(fsettings,filterData);
                
                fs.writeFileSync(filterfile,JSON.stringify(fsettings));
            } catch (err) {
                sails.log.error('writeFilterSettings failed to write',filterfile,err);
                return cb();
            }
            var merged = fsettings;

            // special case if no filter data, then don't merge
            if (typeof filterData !== 'undefined')
                merged = merge(fsettings,filterData);

            convert2Num(merged);
            cb(merged);

        });
    },
    /**
     * Based on the filterData, generate a new gff3 file.
     * Also announces the track to subscribed clients.
     * 
     * @param {object} filterData - the output of writeFilterSettings or getFilterSettings.
     * @param {object} requestData - eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox' }
     * 
     * callback:
     * ::
     *   cb({
     *      totalFeatures: x,               // total number of features
     *      filteredFeatures: x             // filtered features.
     *   })
     *   
     */
    applyFilter(filterData,requestData,cb) {
        sails.log.debug('applyFilter()',requestData);
        let thisb = this;
        
        this.getHitDataFiltered(filterData,requestData,function(filterSummary,filteredGffStr) {

            var g = sails.config.globals.jbrowse;
            var asset = requestData.asset;
            var dataSet = typeof Dataset !== 'undefined' ? Dataset.Resolve(requestData.dataset).path : requestData.dataset;
            var blastGffFile = g.jbrowsePath + dataSet + '/' + g.jblast.blastResultPath+'/'+asset+'.gff3';
            
            // write filtered gff
            var error = false;
            try {
                fs.writeFileSync(blastGffFile,filteredGffStr);
            } catch (err) {
                sails.log.error('applyFilter failed to write',blastGffFile);
                error = true;
            }
            if (error) {
                return cb({result:'fail', error: 'applyFilter failed to write '+blastGffFile});    
            }
            sails.log("file written",blastGffFile);
            
            if (!requestData.noAnnounce)
                thisb._announceTrack(Dataset.Resolve(requestData.dataset).id,asset);
            
            cb(filterSummary);
        });
    },
    /*
     * Reads the filterSettings of the given asset and generates a filtered GFF string.
     * Although, it does not write the GFF file.  (it's just a legacy artifact)
     * applyFitler() writes the GFF file.
     * 
     * Todo: for larger hit results, it may not be practical to keep the results in a memory buffer (gff string).
     * 
     * @param {object} filterData - the output of writeFilterSettings or getFilterSettings.
     * @param {type} requestData - eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox' }
     * @param {function} cb - function(filterSummary, gff string)
     *     filterSummary (eg. { result: 'success', hits: 792, filteredHits: 24 }
     */
    getHitDataFiltered(filterData,requestData,cb) {
        sails.log.debug('getHitDataFiltered()',filterData,requestData);
        var thisb = this;
        var g = sails.config.globals.jbrowse;
        var asset = requestData.asset;
        var dataSet = requestData.dataset; //typeof dataSet !== 'string' ? Dataset.Resolve(requestData.dataset) : dataSet;
        //var filterData = requestData.filterParams;
        
        //sails.log('dataSet',dataSet);
        
        var resultFile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'.json';
        //var blastGffFile = g.jbrowsePath + dataSet + '/' + g.jblast.blastResultPath+'/'+asset+'.gff3';

        try {
            var content = fs.readFileSync(resultFile, 'utf8');
        } catch(e) {
            sails.log.error("failed to read blast json in applyFilter",resultFile);
            cb({result:'fail', error: 'failed to read '+blastGffFile});
            return;
        }
        var blastJSON = JSON.parse(content);
        
        var blastData = blastJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;


        // determine the sequence (i.e. "ctgA")
        var seqstr = blastJSON.BlastOutput['BlastOutput_query-def'];
        var seqdata = util.parseSeqData('>'+seqstr);
        var sequence = seqdata.seq;

        var hitCount = 0;
        var filteredHits = 0;

        var str = "";
       
        for(var x in blastData) {
            hitCount++;
            
            var selected = 0;
            if (filterData===0) selected = 1;
            else if (
                parseFloat(
                    blastData[x].Hsp['Hsp_bit-score']) >= filterData.score.val &&
                    +blastData[x].Hsp['Hsp_evalue'] <= filterData.evalue.val &&     
                    ((parseFloat(blastData[x].Hsp['Hsp_identity']) / parseFloat(blastData[x].Hsp['Hsp_align-len'])) * 100) >= filterData.identity.val &&    
                    ((parseFloat(blastData[x].Hsp['Hsp_gaps']) / parseFloat(blastData[x].Hsp['Hsp_align-len'])) * 100) <= filterData.gaps.val   &&  
                1 ) selected = 1;
       
            if (selected) {
                filteredHits++;
                
                var qstart = blastData[x].Hsp["Hsp_query-from"];
                var qend = blastData[x].Hsp["Hsp_query-to"];
                var hstart = parseInt(blastData[x].Hsp["Hsp_hit-from"]);
                var hend = parseInt(blastData[x].Hsp["Hsp_hit-to"]);
                var strand = hend - hstart > 0 ? "+" : "-";
                var score = blastData[x].Hsp["Hsp_bit-score"];
                var seq = sequence;
                str += "ctgA\t";                            // 1 seqid
                str += "blastn:blastdb\t";                  // 2 source
                str += "blastn\t";                          // 3 type
                str += qstart+"\t";                         // 4 start
                str += qend+"\t";                           // 5 end
                str += score+"\t";                          // 6 score
                str += strand+"\t";                        // 7 strand
                str += ".\t";                               // 8 phase
                str += "blastHit="+x;
                    str += ";Name="+blastData[x].Hit_def;
                    str += ";HitNum="+blastData[x].Hit_num;
                str += "\t\n";
            }
        }
        
        var filteredGff = str;
        
        var filterSummary = {
            result:'success',
            hits: hitCount,
            filteredHits: filteredHits
        };
        cb(filterSummary,filteredGff);
    },
    /*
     * Announce change in track
     * 
     * @param {int} dataset - database id of dataset
     * @param {string} key - this is the asset id
     */
    _announceTrack: function(dataset,key) {
        //var dataSet = Dataset.Resolve(dataset);
        var srch = {dataset:dataset,lkey:key};
        sails.log('_announceTrack',srch);
        
        Track.findOne(srch).then(function(found) {
            if (typeof found === 'undefined') {
                sails.log.error('_announceTrack not found',key);
                return;
            }
            sails.log("Announced track update",found.id,found.lkey);
            return Track.publishUpdate(found.id,found);
        }).catch(function(err) {
            sails.log.error("_announceTrack failed",err);
        });
    },
    /**
     * return hit details given hit key, including all HSPs of the original hit.
     * The hit key looks like this "gi-402239547-gb-JN790190-1--3"
     * Separate the hit id ==> "gi-402239547-gb-JN790190-1--" (basically remove the last number)
     * Returns multiple HSPs for each hit id: data for "gi-402239547-gb-JN790190-1--1", "gi-402239547-gb-JN790190-1--2"...
     * 
     * @param {string} hitkey - eg. "gi-402239547-gb-JN790190-1--3"
     * @param (string) dataSet - eg. "sample_data/json/volvox"
     * @param {function} cb - callback
     * 
     */
    getHitDetails: function(hitKey,dataSet,asset,cb) {
        sails.log.debug('getHitDetails()');
        var g = sails.config.globals.jbrowse;
        var resultFile = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath+'/'+asset+'.json';
        var blastGffFile = g.jbrowsePath + dataSet + '/' + g.jblast.blastResultPath+'/'+asset+'.gff3';

        try {
            var content = fs.readFileSync(resultFile, 'utf8');
        } catch(e) {
            sails.log.error("failed to read blast json in getHitDetails()",resultFile);
            return;
        }
        var blastJSON = JSON.parse(content);
        
        var blastData = blastJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        
        // open the blast json
        
        // separate hit id 
        var hId = getHitId(hitKey);
        
        sails.log.debug("hId",hitKey,hId);
        
        // build hsp data list 
        var i = 1;
        var hitData = {};
        var key = hId + '-' +i;
        while ( typeof blastData[key] !== 'undefined') {
            sails.log.debug("key",key);
            hitData[key] = blastData[key];
            key = hId + '-' + (++i);
        }
        
        cb(hitData);
    },
    // get the hightest value of the blast data variable
    getHighest: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = 0;
        for(var x in blastData) {
            if (+blastData[x].Hsp[variable] > val)
                val = +blastData[x].Hsp[variable];
        }
        return val;
    },
    // get the lowest value of the blast data variable.
    getLowest: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            if (val === -1) val = +blastData[x].Hsp[variable];
            if (+blastData[x].Hsp[variable] < val)
                val = +blastData[x].Hsp[variable];
        }
        return val;
    },
    // get the hightest value of the blast data variable
    getHighest10: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        //var val = Math.log10(Number.MIN_VALUE);
        var minval = Number.MIN_VALUE;
        for(var x in blastData) {
            //var v = Math.log10(+blastData[x].Hsp[variable]);
            var v = +blastData[x].Hsp[variable];
            if (v > minval) minval = v;
        }
        return minval;
    },
    // get the lowest value of the blast data variable.
    getLowest10: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            //var v = Math.log10(+blastData[x].Hsp[variable]);
            var v = +blastData[x].Hsp[variable];
            if (val === -1) val = v;
            if (v < val)  val = v;
        }
        return val;
    },
    // get the hightest value of the blast data variable as a percent of align-len
    getHighestPct: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = 0;
        for(var x in blastData) {
            var cval = parseFloat(blastData[x].Hsp[variable]) / parseFloat(blastData[x].Hsp['Hsp_align-len']) * 100;
            if (cval > val) val = cval;
        }
        return val;
    },
    // get the lowest value of the blast data variable as a percent of align-len
    getLowestPct: function(variable) {
        var blastData = this.blastData.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            var cval = parseFloat(blastData[x].Hsp[variable]) / parseFloat(blastData[x].Hsp['Hsp_align-len']) * 100;
            if (val === -1) val = cval;
            if (cval < val) val = cval;
        }
        return val;
    }
};
function convert2Num(obj) {
    for(var x in obj) {
        if (typeof obj[x].val === 'string')
            obj[x].val = Number(obj[x].val);
    }
}

function getHitId(hitkey) {
    var a = hitkey.split('-');
    var l = a.length;
    a.splice(l-1,1);
    return a.join('-');
}
