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
    ['o' , 'json=PATH'      , 'path JSON output file'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var blastxml = opt.options['blastxml'] || '.';
var jsonfile = opt.options['json'] || '.';


//var parser = new xml2js.Parser();

fs.readFile(blastxml, function(err, xml) {
    
    if (err) {
        console.log(err);
        process.exit(1);
    }
    to_json(xml, function (error, data) {
        // Module returns a JS object 
        var hits = data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits.Hit;
        
        //console.log(hits);

        var obj = new Object();
        var count = 0;
        for (var x in hits) {
            
            var insertHsp = function(hit,hsp) {
                return {
                    Hit_num: hit.Hit_num,
                    Hit_id: hit.Hit_id,
                    Hit_def: hit.Hit_def,
                    Hit_accession: hit.Hit_accession,
                    Hit_len: hit.Hit_len,
                    Hsp: hsp
                };
            };
            
            var hspNum = 1;
            
            /*// debug
            console.log("hit num ", hits[x].Hit_num);
            if (hits[x].Hit_num === 25) {
                console.log('hsp array: ',util.inspect(hits[x], false, null));
                return;
            }
            */
            if (typeof hits[x].Hit_hsps.Hsp.Hsp_num !== 'undefined') { 
                console.log("hit single hsp", hits[x].Hit_num);
                var key = hits[x].Hit_id + ';' + hits[x].Hit_hsps.Hsp.Hsp_num;
                obj[key] = insertHsp(hits[x],hits[x].Hit_hsps.Hsp);
            }
            else { 
                console.log("hit multiple hsp ", hits[x].Hit_num);
                // multiple hsp
                var hsps = hits[x].Hit_hsps.Hsp;
                
                for (var h in hsps) {
                    var key = hits[x].Hit_id + ';' + hsps[h].Hsp_num;
                    obj[key] = insertHsp(hits[x],hsps[h]);
                    hspNum++;
                }
                //console.log(util.inspect(hsps, false, null));
                //return;
            }
            
            //if (count++ > 30) return;   // debug
        }

        //console.log(obj);

        fs.writeFile(jsonfile,JSON.stringify(obj,null,2), function (err) {
            if (err) {
                console.log(err);
                process.exit(1);
            }
        });

    });    
    
});
