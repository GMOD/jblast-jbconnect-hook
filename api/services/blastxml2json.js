/**
 * @module
 * @desc
 * Convert BlastXML to JSON
 * (not a straight conversion)
 * This script not only converts the XML to json, it flattens the hits per hsp where there are multiple hsp.
 * 
 * Creates an indexed list by feature ID.
 * Essentially, it simpifies the hit array into an associative array and makes it indexed by key,
 * where key is <Hit_id>;<Hsp_num>
 * 
 */

var fs = require('fs');
var path = require('path');
var to_json = require('xmljson').to_json;

module.exports = {

    /**
     * Perform the conversion operation
     * 
     * @param (object) kJob - kue job object
     * @param (JSON) trackJson
     * @param (function) cb - callback function
     * 
     */
    convert: function (kJob,trackJson,cb) {
        sails.log('converting blast to json');
        var g = sails.config.globals.jbrowse;
        // i.e. /var/www/html/jbrowse/sample_data/json/volvox/jblastdata
        var jblastDataPath = g.jbrowsePath + kJob.data.dataset + '/' + g.jblast.blastResultPath + '/';
        var assetId = kJob.data.blastData.outputs['blastxml'];
        if (typeof assetId === 'undefined') {
            cb({status:'error',msg:'error in blastxml to json - assetId undefined'});
            return;
        }
        var blastxml = jblastDataPath + assetId + '.blastxml';
        var jsonfile = jblastDataPath + assetId + '.json';

        sails.log.debug('blastxml2json',blastxml,jsonfile);

        fs.readFile(blastxml, function(err, xml) {

            if (err) {
                sails.log.error(err);
                cb({status:'error',err:err});
                return;
            }
            to_json(xml, function (error, data) {
                // Module returns a JS object 
                var hits = data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits.Hit;

                //console.log(hits);

                //create & build our custom hit table, where we index different from original layout for jbrowse (associative array)
                data.BlastOutput.BlastOutput_iterations.Iteration.Hit = new Object();

                var obj = data.BlastOutput.BlastOutput_iterations.Iteration.Hit;
                var count = 0;
                for (var x in hits) {

                    // add offset to HSP query from/to
                    var fixHsp = function(hsp) {

                        var start = parseInt(hsp['Hsp_query-from']) + offset;
                        var end = parseInt(hsp['Hsp_query-to']) + offset;

                        hsp['Hsp_query-from'] = start;
                        hsp['Hsp_query-to'] = end;

                        console.log(start,end);

                        return hsp;
                    };

                    var insertHsp = function(hit,hsp) {
                        return {
                            Hit_num: hit.Hit_num,
                            Hit_id: hit.Hit_id,
                            Hit_def: hit.Hit_def,
                            Hit_accession: hit.Hit_accession,
                            Hit_len: hit.Hit_len,
                            Hsp: hsp
                            //Hsp: fixHsp(hsp)
                        };
                    };

                    var hspNum = 1;
                    var sep = '-'

                    /*// debug
                    console.log("hit num ", hits[x].Hit_num);
                    if (hits[x].Hit_num === 25) {
                        console.log('hsp array: ',util.inspect(hits[x], false, null));
                        return;
                    }
                    */
                    if (typeof hits[x].Hit_hsps.Hsp.Hsp_num !== 'undefined') { 
                        //console.log("hit single hsp", hits[x].Hit_num);
                        var key = hits[x].Hit_id + sep + hits[x].Hit_hsps.Hsp.Hsp_num;
                        key = key.replace(/[|.]/g,'-');
                        hits[x].Hit_hsps.Hsp.Hsp_count = 1;     // hsps in this group
                        obj[key] = insertHsp(hits[x],hits[x].Hit_hsps.Hsp);
                    }
                    else { 
                        //console.log("hit multiple hsp ", hits[x].Hit_num);
                        // multiple hsp
                        var hsps = hits[x].Hit_hsps.Hsp;

                        // count HSPs in this group
                        var hsp_count = 0;
                        for(var h in hsps){
                            hsp_count++;
                        }

                        for (var h in hsps) {
                            var key = hits[x].Hit_id + sep + hsps[h].Hsp_num;
                            key = key.replace(/[|.]/g,'-');
                            hsps[h].Hsp_count = hsp_count; 
                            obj[key] = insertHsp(hits[x],hsps[h]);
                            hspNum++;
                        }
                        //console.log(util.inspect(hsps, false, null));
                        //return;
                    }

                    //if (count++ > 30) return;   // debug
                }
                // remove the original hit list
                delete data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits;

                //console.log(obj);

                fs.writeFile(jsonfile,JSON.stringify(data,null,2), function (err) {
                    if (err) {
                        sails.log.error('failed to write',jsonfile,err);
                        cb({status:'error',err:err});
                        return;
                    }
                    sails.log.debug("convert successful", blastxml);
                    cb(null);
                });

            });    

        });
    }
};
    
