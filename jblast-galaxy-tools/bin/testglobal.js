#!/usr/bin/env node

var global = require('./global-rest.js');
var getopt = require('node-getopt');

var getopt = new getopt([
    ['g' , 'get'        , 'get config'],
    ['s' , 'set'        , 'set config'],
    ['n' , 'name=NAME'  , 'name'],
    ['v' , 'value=VALUE', 'value'],
    
    ['h' , 'help'            , 'display this help']
]);              // create Getopt instance
getopt.bindHelp()     // bind option 'help' to default action
opt = getopt.parseSystem(); // parse command line

if (!process.argv.slice(2).length) {
    getopt.showHelp();
    process.exit(1);
}

var getcfg = opt.options['getcfg'];
var setcfg = opt.options['setcfg'];
var name = opt.options['name'];
var val = opt.options['value'];

if (setcfg) {
    global.setConfig(name,val);
}

if (getcfg) {
    if (typeof name === 'undefined')
        console.log('returned',global.getConfig(''));
    else
        console.log('returned',global.getConfig(name));
}