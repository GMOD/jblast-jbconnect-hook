#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var getopt = require('node-getopt');
var util = require('./util.js');
var Finder = require('fs-finder');
var config = require('../config.js');

var getopt = new getopt([
    ['a' , 'setupall'         , 'equivelant to -w -t -d combined'],
    [''  , 'globals[=ARG]'    , 'show globals'],
    ['p' , 'blastdbpath=PATH' , 'existing database path'],
    ['w' , 'setupworkflows', '[install|<path>] "install" project wf, or specify .ga file '],
    ['t' , 'setuptools'       , 'setup jblast tools for galaxy'],
    ['d' , 'setupdata'        , 'setup data and samples'],
    ['h' , 'setuphistory'     , 'setup history'],
    ['v' , 'view'             , 'view status of config'],
    ['t' , 'setuptrack'       , 'setup track sample and jblast plugin'],
    
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
    "Jblast-config --setuptools\n"+
    "\n" +
    "Setup data and samples\n" +
    "Jblast-config --setudata\n"
);

/* Display help if no arguments are passed */
if (!process.argv.slice(2).length) {
	getopt.showHelp();
	process.exit(1);
}

/*
 * process --globals
 * 
 */
var globals = opt.options['globals'];
if (typeof globals !== 'undefined') {
    util.getGlobals(function(g) {
        if (g===null)
            process.exit(1);
        
        console.log('jbserver globals:');
        console.log(g);
        process.exit(0);
    })
}

/*
 * get values for --gpath, apikey and gurl; grab from saved globals if necessary
 */

var gurl = config.galaxy.galaxyUrl;
var gpath = config.galaxy.galaxyPath;
var apikey = config.galaxy.galaxyAPIKey;



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
 * process --setupall
 */
var setupall = opt.options['setupall'];
if (typeof setupall !== 'undefined') {
    exec_setuptools();
    exec_setupworkflows();
    exec_setupdata();
    process.exit(0);
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
    exec_setuptrack();
}
var setuphistory = opt.options['setuphistory'];
if (typeof setuphistory !== 'undefined') {
    exec_setuphistory();
}

/*
 * setup sample track
 */
function exec_setuptrack() {

    var g = config;
    var trackListPath = g.jbrowsePath + g.dataSet[0].dataPath + 'trackList.json';
    var sampleTrackFile = config.jbrowsePath+config.dataSet[0].dataPath;
    sampleTrackFile += config.jblast.blastResultPath+'/sampleTrack.json';
    var dataSet = g.dataSet[0].dataPath;
    
    // read sampleTrack.json file
    var error = 0;
    try {
      var sampleTrackData = fs.readFileSync (sampleTrackFile);
    }
    catch(err){
        console.log("failed read",trackListPath,err);
        error = 1;
    }
    if (error) return;
    
    var sampleTrack = JSON.parse(sampleTrackData);
    
    // read trackList.json
    try {
      var trackListData = fs.readFileSync (trackListPath);
    }
    catch(err) {
        console.log("failed read",trackListPath,err);
        error = 1;
    }
    if (error) return;
    
    var config = JSON.parse(trackListData);

    // add the JBlast plugin  
    config.plugins.push("JBlast");

    // check if sample track exists in trackList.json (by checking for the label)
    var hasLabel = 0;
    for(var i in config.tracks) {
        if (config.tracks[i].label===sampleTrack.label) hasLabel=1;
    }

    if (hasLabel) {
        console.log('Sample track already exists');
        return;
    }
    // add the sample track
    config.tracks.push(sampleTrack);
    
    // write trackList.json
    try {
      fs.writeFileSync(trackListPath,JSON.stringify(config,null,4));
    }
    catch(err) {
      console.log("failed write",trackListPath,err);
    }
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
        util.galaxyPostJSON('/api/workflows/upload',jsonparam,function(ret){
            if (ret.status==='fail') {
                //console.log("response.statusCode",response.statusCode);
                console.log("Error:",ret);
                return;
            }
            var data = ret.data;
            console.log('Workflow imported:',data.name);
            console.log(data.url);
        });
    }
}
/*
 * setup galaxy history given historyName in config.js
 */
function exec_setuphistory() {
    util.galaxyGetJSON('/api/histories',function(data) {
       if (data.status==='error') {
           return;
       } 
       //console.log(data.data); 
       var data = data.data;
       var found = 0;
       var histName = config.galaxy.historyName;
       for(var i in data) {
           if (data[i].name==histName) {
               console.log('History already exists: ', data[i].name);
               console.log(data[i].url);
               found=1;
           }
       }
       if (found===1) {
           console.log('History already exists: ', histName);
           return;
       }
       util.galaxyPostJSON('/api/histories',{name: histName}, function(data) {
           if (data.status==='error') {
               return;
           }
           var result = data.data;
           console.log("Created History:",result.name);
           console.log(result.url);
       });
       
    });
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
