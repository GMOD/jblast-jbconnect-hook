#!/usr/bin/env node

/*
 * simulate blastn output
 * 
 */

//var requestp = require('request-promise');
var fs = require('fs');
//var path = require('path');
var getopt = require('node-getopt');
//var util = require('./util.js');
//var config = require('../config.js');

var getopt = new getopt([
    ['b' , 'blastxml=FILE'          , 'sim blastxml result file (found in /jblastdata)'],
    ['f' , 'fail'                   , 'simulate failure (process.exit(1))'],
    ['i' , 'infile=PATH'            , 'dummy input (does nothing with input)'],
    ['o' , 'outfile=PATH'           , 'output will be the file passed in -b'],
    
    ['h' , 'help'            , 'display this help']
]);              // create Getopt instance
getopt.bindHelp();     // bind option 'help' to default action
opt = getopt.parseSystem(); // parse command line

getopt.setHelp(
    "Usage: jblast-simblast [OPTION]\n" +
    "[[OPTIONS]]\n" +
    "\n" +
    "jblast-simblast -i <inputfile> -o <outputfile> -b blastn-sample-with-hits.blastxml\n" +
    "jblast-simblast -i <inputfile> -o <outputfile> -f\n" 
);

/* Display help if no arguments are passed */
if (!process.argv.slice(2).length) {
	getopt.showHelp();
	process.exit(1);
}

// simulate failure
var fail = opt.options['fail'];
if (typeof fail !== 'undefined') {
    process.exit(1);
}

var blastxml = opt.options['blastxml'];
var outfile = opt.options['outfile'];
var infile = opt.options['infile'];


if (typeof blastxml !== 'undefined') {
    var src = 'data/' + blastxml;

    console.log("blastxml src",src);
    console.log("infile",infile);
    console.log("output",outfile);

    
    fs.access(src, fs.F_OK, function(err) {
        if (!err) {
            fs.createReadStream(src).pipe(fs.createWriteStream(outfile));            
        } else {
            console.log('failed to access',src);
            process.exit(1);
        }
    });    
    
}
