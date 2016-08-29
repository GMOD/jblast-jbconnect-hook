#!/usr/bin/env node

/* 
 * get global data and output files to specified location.
 * from global file /etc/jbrowse/globals.dat
 * format in global:

  var blastData = {
        "name": "JBlast Test", 
        "blastSeq": "/var/www/html-jb-galaxy-blaster/tmp/vBlast.fasta",
        "originalSeq": "/var/www/html-jb-galaxy-blaster/tmp/volvox.fa",
        "offset": 17400
    };
*/


var request = require('request');
//var prettyjson = require('prettyjson');
//var prompt = require('prompt');
var fs = require('fs');
var getopt = require('node-getopt');


var globalPath = "/etc/jbrowse";
var globalFile = globalPath + "/globals.dat";

var opt = getopt.create([
    ['b' , 'blastseq=PATH'            , 'output BLAST seq file'],
    ['r' , 'refseq=PATH'            , 'output reference seq file'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var blastSeqOut = opt.options['blastseq'] || '.';
var refSeqOut = opt.options['refseq'] || '.';

readInGlobals(function(gbl) {

    console.log(gbl.jblast);
    blastSeqIn = gbl.jblast.blastSeq;
    refSeqIn = gbl.jblast.originalSeq;
    
    console.log(blastSeqIn,blastSeqOut);
    console.log(refSeqIn,refSeqOut);

    try {
        fs.createReadStream(blastSeqIn).pipe(fs.createWriteStream(blastSeqOut));    
        fs.createReadStream(refSeqIn).pipe(fs.createWriteStream(refSeqOut));
    }
    catch (e) {
        logMyErrors(e.message, e.name);
    }
});

function readInGlobals (postFn) {
    
    fs.readFile(globalFile, function read(err, data) {
        if (err) {
            throw err;
        }
        var g = JSON.parse(data);
        postFn(g);
    });
}