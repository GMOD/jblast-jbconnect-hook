#!/usr/bin/env node

/*
 * Convert BlastXML to JSON
 * (not a straight conversion)
 * This script not only converts the XML to json, it flattens the hits per hap where there are multiple hsp.
 * 
 * Essentially, it simpifies the hit array into an associative array and makes it indexed by key,
 * where key is <Hit_id>;<Hsp_num>
 * 
 */

//var request = require('request'),
var fs = require('fs'),
    path = require('path'),
    getopt = require('node-getopt'),
    util = require('util');

var to_json = require('xmljson').to_json;

var opt = getopt.create([
    ['x' , 'blastxml=PATH'       , 'path BlastXML input file'],
    ['o' , 'csv=PATH'      , 'path CSV output file'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var blastxml = opt.options['blastxml'] || '.';
var outfile = opt.options['csv'] || '.';

console.log('files',blastxml,outfile);

var offset = "0";

//var parser = new xml2js.Parser();

// start by reading globals
global.getGlobals (function(gbl) {
    
    if (typeof gbl.jblast != 'undefined')
        offset = gbl.jblast.offset || "0";
    offset = parseInt(offset);
    
    console.log('offset',offset);
    
    
    doMain();
});

function doMain () {
    
    fs.readFile(blastxml, function(err, xml) {

        if (err) {
            console.log(err);
            process.exit(1);
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

                    //console.log(start,end);

                    return hsp;
                };

                var insertHsp = function(hit,hsp) {
                    return {
                        Hit_num: hit.Hit_num,
                        Hit_id: hit.Hit_id,
                        Hit_def: hit.Hit_def,
                        Hit_accession: hit.Hit_accession,
                        Hit_len: hit.Hit_len,
                        Hsp: fixHsp(hsp)
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

            var ws = fs.createWriteStream(outfile);

            var count = 0;
            ws.write('Hit_num, Hit_id, Hit_def, Hit_len, Hsp_num, bit-score, score, evalue, qfrom,qto,hfrom,hto,queryframe,hitframe,identity,positive,gaps,align-len\n');
            for(var i in obj) {
 
                //if (++count > 10) break;
                
                //console.log(obj[i]);
                ws.write(
                        obj[i].Hit_num +', '+
                        obj[i].Hit_id +', '+
                        obj[i].Hit_def.split(',').join('') +', '+
                        obj[i].Hit_len +', '+
                        obj[i].Hsp['Hsp_num'] +', '+
                        obj[i].Hsp['Hsp_bit-score'] +', '+
                        obj[i].Hsp['Hsp_score'] +', '+
                        obj[i].Hsp['Hsp_evalue'] +', '+
                        obj[i].Hsp['Hsp_query-from'] +', '+
                        obj[i].Hsp['Hsp_query-to'] +', '+
                        obj[i].Hsp['Hsp_hit-from'] +', '+
                        obj[i].Hsp['Hsp_hit-to'] +', '+
                        obj[i].Hsp['Hsp_query-frame'] +', '+
                        obj[i].Hsp['Hsp_hit-frame'] +', '+
                        obj[i].Hsp['Hsp_identity'] +', '+
                        obj[i].Hsp['Hsp_positive'] +', '+
                        obj[i].Hsp['Hsp_gaps'] +', '+
                        obj[i].Hsp['Hsp_align-len']
                        +'\n');
            }
            ws.end();
            //console.log(obj);
            /*
            fs.writeFile(outfile,JSON.stringify(data,null,2), function (err) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
            });
            */
        });    

    });
}
    


