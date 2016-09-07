#!/usr/bin/env node

/*
 * add blast globals to global file 
 */
var fs = require("fs");
var getopt = require('node-getopt');
var globals = require('../config/globals');

console.log('globals',globals.globals.jbrowse);

//var globalPath = "/etc/jbrowse";
//var globalFile = globalPath + "/globals.dat";

var blastData = {
        "name": "JBlast Test", 
        "blastSeq": "/var/www/html/jb-galaxy-blaster/tmp/44705works.fasta",
//            "originalSeq": "/var/www/html/jb-galaxy-blaster/tmp/volvox.fa",
        "offset": 44705
    };


var opt = new getopt([
    ['a' , 'add'                , "add artificial 'jblast' section"],
//    ['r' , 'remove'             , "remove 'jblast' section"],
    ['h' , 'help'               , 'display this help']
]);              // create Getopt instance
opt.bindHelp();     // bind option 'help' to default action
opt.parseSystem(); // parse command line

var addGlobal = opt.options['add'];

//if (typeof addGlobal !== 'undefined')
//    storeInGlobals(blastData,"jblast");

// add a new section to global data
function storeInGlobals (sectionData,sectionName) {
    
    console.log("global file: "+ globalFile);
    
    jGlobals = 
    fs.readFile(globalFile, function read(err, data) {
        if (err) {
            throw err;
            console.log('Read Failed: '+err);
            process.exit(1);
        }
        var g = JSON.parse(data);
        
        
        if (typeof addGlobal === 'undefined')
            // just display if -add is not specified
            console.log(JSON.stringify(g,null,4));
        
        else {
            // write the file
            g[sectionName] = sectionData;

            if (typeof addGlobal !== 'undefined')
            var gStr = JSON.stringify(g,null,4);

            fs.writeFile(globalFile,gStr, function (err) {
                if (err) {
                    throw err;
                    console.log("Write FAILED: "+err);
                    process.exit(1)
                }
                console.log(gStr);
                console.log("written... ");
            });
        }
    });    
        
}



