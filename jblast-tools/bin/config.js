#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var getopt = require('node-getopt');
var util = require('./global-rest.js');
var Finder = require('fs-finder');
var config = require('../config.js');

var getopt = new getopt([
    ['a' , 'all'              , 'setup all'],
//    ['g' , 'gpath=PATH'       , 'set and save Galaxy install path'],
//    ['u' , 'gurl=PATH'        , 'set and save Galaxy URL'],
//    ['k' , 'apikey=STRING'    , 'set and save Galaxy API key'],
    ['p' , 'blastdbpath=PATH' , 'existing database path'],
    ['w' , 'setupworkflows', '[install|<path>] "install" project wf, or specify .ga file '],
    ['t' , 'setuptools'       , 'setup jblast tools for galaxy'],
    ['d' , 'setupdata'        , 'setup data and samples'],
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
    "Install an existing blast database\n" +
    "Jblast-config --blastdbpath [local path]\n" +
    "\n" +
    "Install jblast package workflows to galaxy\n" +
    "Jblast-config --gurl <galaxy url> --setupworkflows\n" +
    "\n" +
    "Install jblast package tools to galaxy\n" +
    "Jblast-config --setuptools\n"
);

/* Display help if no arguments are passed */
if (!process.argv.slice(2).length) {
	getopt.showHelp();
	process.exit(1);
}

/*
 * get values for --gpath, apikey and gurl; grab from saved globals if necessary
 */

var gurl = config.galaxy.galaxyUrl;
var gpath = config.galaxy.galaxyPath;
var apikey = config.galaxy.galaxyAPIKey;

/*
var gpath = opt.options['gpath'];
var apikey = opt.options['apikey'];
var gurl = opt.options['gurl'];

// save gpath or get it if it exists
if (typeof gpath !== 'undefined') util.setConfig('gpath',gpath);
else gpath = util.getConfig('gpath');

// save gurl (galaxy url) or get it if it exists
if (typeof gurl !== 'undefined') util.setConfig('gurl',gurl);
else gurl = util.getConfig('gurl');

// save apikey or get it if it exists
if (typeof apikey !== 'undefined') util.setConfig('apikey',apikey);
else apikey = util.getConfig('apikey');
*/
/*
 * defaults fo gpath and gurl
 */
/*
if (gurl === 'undefined') {
    gurl = "http://localhost:8080";
    util.setConfig('gurl',gurl);
    console.log("undefined --gurl; defaulting to", gurl);
}
if (gpath === 'undefined') {
    gpath = "/var/www/galaxy_jblast";
    util.setConfig('gpath',gpath)
    console.log("undefined --gpath; defaulting to", gpath);
}
*/

/*
 * figure target paths
 * gdataroot is the root of the where galaxy is installed (default: /var/www/galaxy)
 *     if docker this is the docker export directory.
 * gdatapath is galaxy data dir.  For regular installations, this is the same as gdataroot.
 *     if docker, this is /galaxy-central under gdataroot
 */
var gdataroot = gpath;                      // root of local path of galaxy
var gdatapath = gpath+"/galaxy-central";    // galaxy data files, if docker
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

/*
 * figure source path of jblast-galaxy-tools 
 *   (installed with -g option on RHEL: /usr/lib/node_modules/jblast-tools)
 */
var srcpath = __dirname+"/..";
//console.log("srcpath",srcpath);
try {
    fs.accessSync(srcpath, fs.F_OK);
}
catch(err) {
    console.log(srcpath,'does not exist');
}

/*
 * process commands arguments
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
var setupdata = opt.options['setupdata'];
if (typeof setupdata !== 'undefined') {
    exec_setupdata();
}

/*
 * setup data directory and sample
 */
function exec_setupdata() {
    var targetdir = config.jbrowsePath+config.dataSet[0].dataPath;
    
    util.checkDir(targetdir+config.jblast.blastResultPath);
    
    util.cmd('cp -R -v "'+srcpath+'/jblastdata" "'+targetdir+'"');

}
/*
 * import the package workflows
 */
function exec_setupworkflows() {
    
    var srcdir = srcpath+'/workflows';

    //console.log("gurl, gpath", gurl,gpath);
    
    // find workflow files
    var files = Finder.from(srcdir).exclude('*.sample').findFiles('*.ga');
    //console.log('files',files);
    for(var i in files) {
        var content = fs.readFileSync(files[i]).toString();
        var jsonparam = {'workflow':JSON.parse(content)};
        //console.log('jsonparam',jsonparam);
        util.galaxyPostJSON('/api/workflows/upload',jsonparam,function(err,response,body){
            if (err || response.statusCode != 200) {
                console.log("response.statusCode",response.statusCode);
                console.log("Error:",err);
                return;
            }
            console.log('Workflow imported:',body.name);
            console.log(body.url);
        });
    }
}
/*
 * register blast nucleotide databases
 */
function exec_blastdbpath() {


    // target directory
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
 * setup tools - 
 */
function exec_setuptools() {
    
    // copy tools to export root.
    util.cmd('cp -R -v "'+srcpath+'/jblasttools" "'+gdataroot+'"');
    
    var shed_conf = gdatapath+'/config/shed_tool_conf.xml.jblast';
    // copy shed_tool_conf.xml file to shed_tool_conf.xml.jblast
    util.cmd('cp -v "'+gdatapath+'/config/shed_tool_conf.xml" "'+shed_conf+'"');
    
    // copy jblast_tool_conf.xml to /config
    util.cmd('cp -v "'+srcpath+'/config/jblast_tool_conf.xml" "'+gdatapath+'/config"');
    
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
