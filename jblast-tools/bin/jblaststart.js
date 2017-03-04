#!/usr/bin/env node

/** this tool is obsolete
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

var fs = require('fs');
var getopt = require('node-getopt');
var util = require('./util.js');


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
//var refSeqOut = opt.options['refseq'] || '.';


util.getGlobals (function(gbl) {

    if (gbl==null)
        return;

    console.log(gbl.jblast);
    blastSeqIn = gbl.jblast.blastSeq;
    //refSeqIn = gbl.jblast.originalSeq;
    
    console.log(blastSeqIn,blastSeqOut);
    //console.log(refSeqIn,refSeqOut);

    try {
        fs.createReadStream(blastSeqIn).pipe(fs.createWriteStream(blastSeqOut));
        
        // 
        //fs.createReadStream(refSeqIn).pipe(fs.createWriteStream(refSeqOut));
    }
    catch (e) {
        console.log(e.message, e.name);
        process.exit(1);
    }
});
