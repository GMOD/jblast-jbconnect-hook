#!/usr/bin/env node

var request = require('request'),
    fs = require('fs'),
    path = require('path'),
    getopt = require('node-getopt');
var global = require('./global-rest.js');
var Finder = require('fs-finder');
var execSync = require('child_process').execSync;

var getopt = new getopt([
    ['g' , 'gpath=PATH'       , 'set and save Galaxy install path'],
    ['a' , 'apikey=STRING'    , 'set and save Galaxy API key'],
    ['p' , 'blastdbpath=PATH' , 'existing database path'],
    ['w' , 'setupworkflow=ARG', '[install|<path>] "install" project wf, or specify .ga file '],
    ['t' , 'setuptools'       , 'setup jblast tools for galaxy'],
    ['v' , 'view'             , 'view status of config'],
    
    ['h' , 'help'            , 'display this help']
]);              // create Getopt instance
getopt.bindHelp();     // bind option 'help' to default action
opt = getopt.parseSystem(); // parse command line

getopt.setHelp(
    "Usage: jblast-config [OPTION]\n" +
    "[[OPTIONS]]\n" +
    "\n" +
    "Examples:\n" +
    "\n" +
    "Set gpath and apikey for later commands\n" +
    "Jblast-config --gpath <path> --apikey <apikey\n" +
    "\n" +
    "Install an existing blast database\n" +
    "Jblast-config --gpath <path> --blastdbpath [local path]\n" +
    "\n" +
    "Install jblast package workflows to galaxy\n" +
    "Jblast-config --gpath <path> --setupworkflows import\n" +
    "\n" +
    "Install jblast package tools to galaxy\n" +
    "Jblast-config --gpath <path> --setuptools\n" +
);

/* Display help if no arguments are passed */
if (!process.argv.slice(2).length) {
	getopt.showHelp();
	process.exit(1);
}

var gpath = opt.options['gpath'];
var apikey = opt.options['apikey'];


// save gpath or get it if it exists
if (typeof gpath !== 'undefined') global.setConfig('gpath',gpath);
else gpath = global.getConfig('gpath');

// save apikey or get it if it exists
if (typeof apikey !== 'undefined') global.setConfig('apikey',apikey);
else apikey = global.getConfig('apikey');

var gdataroot = gpath;
var gdatapath = gpath+"/galaxy-central";
try {
    // check if gdatapath directory exists
    fs.accessSync(gdataroot, fs.F_OK);
}
catch(err) {
    console.log(gdataroot,'does not exist');
    process.exit(1);
}
try {
    // check if gdatapath directory exists
    fs.accessSync(gdatapath, fs.F_OK);
}
catch (err) {
    console.log(gdatapath,'does not exist');
    gdatapath = gpath;
}

console.log('gdataroot / gdatapath',gdataroot,'/',gdatapath);

/*
var dir = Finder.from(gpath).findDirectories('tool-data');
if (dir.length==0) {
    console.log("tool-data dir not found\n");
    process.exit(1);
}
var tooldir = dir[0];
console.log('tool-data directory:',tooldir);

var files = Finder.from(tooldir).exclude('*.sample').findFiles('blastdb.loc');
console.log('files',files);
*/

var srcpath = __dirname+"/..";
console.log("srcpath",srcpath);
try {
    fs.accessSync(srcpath, fs.F_OK);
}
catch(err) {
    console.log(srcpath,'does not exist');
}

/*
 * --setuptools - install galaxy tools
 */
var setuptools = opt.options['setuptools'];
if (typeof setuptools !== 'undefined') {
    exec_setuptools();
}

var blastdbpath = opt.options['blastdbpath'];
if (typeof blastdbpath !== 'undefined') {
    exec_blastdbpath();
}

var setupworkflows = opt.options['setupworkflows'];
if (typeof setupworkflows !== 'undefined') {
    exec_setupworkflows();
}
/*
 * import the package workflows
 */
function exec_setupworkflows() {
    
}
/*
 * register blast nucleotide databases
 */
function exec_blastdbpath() {

    var tooldir = gdatapath+'/tool-data';
    
    var files = Finder.from(tooldir).exclude('*.sample').findFiles('blastdb.loc');
    try {
        // check existance of blastdbpath 
        fs.accessSync(blastdbpath, fs.F_OK);
    }
    catch (err) {
        console.log(blastdbpath,'does not exist');
        process.exit(1);
    }
    console.log('files',files);
    for(var i in files) {
        if(files[i].indexOf('ncbi_blast_plus') > -1) {
            var blastdb_loc = files[i];

            try {
                var content = fs.readFileSync(blastdb_loc).toString();
            }
            catch(err) {
                console.log(blastdb_loc,"error reading file");
                return;
            }
            content += "\n";
            content += "13apr2014-htgs\thtgs 13-Apr-2014\t"+blastdbpath+"/htgs/13apr2014/htgs\n";
            content += "17apr2014-nt\tnt 17-Apr-2014\t"+blastdbpath+"/nt/17apr2014/nt\n";
            content += "20apr2014-wgs\twgs 20-Apr-2014\t"+blastdbpath+"/wgs/20apr2014/wgs\n";
            content += "phiX174\tphiX\t"+blastdbpath+"/phiX/27aug2010/phiX\n";
            
            console.log(content);
            
            console.log("inserted databases",blastdb_loc);
            fs.writeFileSync(blastdb_loc,content);
            
        }
    }
    
}

/*
 * setup tools
 */
function exec_setuptools() {
    
    // copy tools to /export root
    cmd('cp -R "'+srcpath+'/jblasttools" "'+gdataroot+'"');
    
    var shed_conf = gdatapath+'/config/shed_tool_conf.xml.jblast';
    // copy shed_tool_conf.xml file to shed_tool_conf.xml.jblast
    cmd('cp "'+gdatapath+'/config/shed_tool_conf.xml" "'+shed_conf+'"');
    
    // in shed_tool_conf.xml.jblast replace ../shed_tools with /export/shed_tools 
    try {
        var content = fs.readFileSync(shed_conf).toString();
    }
    catch(err) {
        console.log(shed_conf,"error reading file");
        return;
    }
    var content2 = content.replace("../shed_tools", "/export/shed_tools");
    console.log("modifying",shed_conf);
    fs.writeFileSync(shed_conf,content2);
}
/**
 * execute command synchronously
 * @param {type} cmdstr
 * @returns {undefined}
 */
function cmd(cmdstr) {
    console.log(cmdstr);
    var result = execSync(cmdstr).toString();
    if (result.length)
        console.log(result);    
    
}