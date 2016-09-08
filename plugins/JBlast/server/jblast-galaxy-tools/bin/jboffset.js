#!/usr/bin/env node

/* 
 */


var request = require('request');
//var prettyjson = require('prettyjson');
//var prompt = require('prompt');
var fs = require('fs');
var getopt = require('node-getopt');

var globalPath = "/etc/jbrowse";
var globalFile = globalPath + "/globals.dat";

var opt = getopt.create([
    ['i' , 'infile=PATH'            , 'input file'],
    ['o' , 'outfile=PATH'           , 'output file'],
    ['t' , 'type=STRING'            , 'type gff or json'],
    ['d' , 'offset=STRING'          , 'offset'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var inFile = opt.options['infile'] || '.';
var outFile = opt.options['outfile'] || '.';
var filetype = opt.options['type'] || 'none';



readInGlobals(function(gbl) {

    //console.log(gbl.jblast);
    //blastSeqIn = gbl.jblast.blastSeq;
    //refSeqIn = gbl.jblast.originalSeq;
    
    //console.log(blastSeqIn,blastSeqOut);
    //console.log(refSeqIn,refSeqOut);

    if (filetype=='gff') {
        console.log('type: GFF');
        fixGFF(gbl,function() {
            console.log("done");
        });
    }
    else {
        console.log("unknown type");
    }
    return;
    
    try {
        var stream = fs.createReadStream(inFile).pipe(fs.createWriteStream(outFile));
        //console.log(inFile,outFile);
        stream.on('finish', function () {
            // do nothing for now
        });
    }
    catch (e) {
        logMyErrors(e.message, e.name);
        process.exit(1);
    }
    
});
// read the global file
function readInGlobals (postFn) {
    
    fs.readFile(globalFile, function read(err, data) {
        if (err) {
            throw err;
        }
        var g = JSON.parse(data);
        postFn(g);
    });
}


function fixGFF (gbl, postFn) {
    
    var offset = parseInt(gbl.jblast.offset);
    var stream = fs.createWriteStream(outFile);
    
    stream.once('open', function(fd) {
        var lineReader = require('readline').createInterface({
            input: fs.createReadStream(inFile)
        });    
        lineReader.on('line', function (line) {

            var a = line.split('\t',-1);
            //console.log(line);
            a[3] = parseInt(a[3]) + offset;
            a[4] = parseInt(a[4]) + offset;

            var str = a.join([separator = '\t'])
            //console.log(str);
            stream.write(str+'\n');
        });
        lineReader.on('close', function () {

            //console.log('global',gbl);
            console.log('offset:',offset);
            stream.end();
        });
    });
    
}


