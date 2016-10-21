#!/usr/bin/env node

/*
 * simulate blastn output
 * 
 */

//var requestp = require('request-promise');
var fs = require('fs');
var path = require('path');
var getopt = require('node-getopt');
var util = require('./util.js');
var config = require('../config.js');

var getopt = new getopt([
    ['b' , 'blastxml=FILE'          , 'sim blastxml result file (found in /jblastdata)'],
    ['f' , 'fail'                   , 'simulate failure (process.exit(1))'],
    ['i' , 'input'                  , 'dummy input (does nothing with input)'],
    ['o' , 'output'                 , 'output will be the file passed in -b'],
    
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
var output = opt.options['output'];
if (typeof blastxml !== 'undefined') {
    var src = config.jbrowsePath+config.dataSet[0].dataPath+config.jblast.blastResultPath+'/'+blastxml;
    
    fs.access(path, fs.F_OK, function(err) {
        if (!err) {
            fs.createReadStream(src).pipe(fs.createWriteStream(output));            
        } else {
            console.log('failed to access',src);
            process.exit(1);
        }
    });    
    
}
