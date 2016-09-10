#!/usr/bin/env node

/*
 * copy tools and configuration to galaxy dir. 
 */

var fse = require('fs.extra');
var getopt = require('node-getopt');

console.log("copyfiles.js");

var opt = getopt.create([
    ['g' , 'galaxypath=PATH'            , 'Galaxy root path (i.e. "/var/www/galaxy" )'],
    
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var gPath = opt.options['galaxy'];

