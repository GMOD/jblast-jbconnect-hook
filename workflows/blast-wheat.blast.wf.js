const nodegetopt = require('node-getopt');
const fs = require("fs-extra");
//const shelljs = require("shelljs");

const blast = require('blast-ncbi-tools');
const appPath = require("app-root-path").path;
const _ = require('lodash');
const jblib = require(appPath+'/api/services/jbutillib');

//const thisPath = process.cwd();
//var jbrowsePath = "./";
//var appPath = require('app-root-path');

let g = jblib.getMergedConfig();

console.log('Starting blast-wheat.workflow');


// check if jbrowse is a module
if (fs.pathExistsSync(appPath+"/node_modules/jbrowse/utils")) {
    jbrowsePath = "./node_modules/jbrowse";
}

// command line options
const getopt = new nodegetopt([
    ['i' , 'in=NUMBER'          , 'input .fasta file'],
//    ['d' , 'db=BLASTDB'         , 'reference blast database path or db installed in approot/blastdb']
    ['p' , 'profile=FILE'       , 'blast profile (JSON file)'],
    ['e' , 'ext=<extension>'    , 'output extension'],
    ['o' , 'out=<path>'         , 'output path'],
    ['h' , 'help'               , 'display this help']
]);              // create Getopt instance
getopt.bindHelp();     // bind option 'help' to default action
const opt = getopt.parseSystem(); // parse command line

var  inFile     = opt.options['in'];
var outFileExt  = opt.options['ext'];
var outPath     = opt.options['out']

var blastProfileFile = opt.options['profile'];

if (!blastProfileFile) {
    console.log("profile= option undefined");
    process.exit(1);
}
let rawdata = "";
let blastProfile = "";


try {
    rawdata = fs.readFileSync(blastProfileFile,'utf-8');  
    blastProfile = JSON.parse(rawdata); 
}
catch (err) {
    console.log(err);
    process.exit(1);
}
console.log("blastProfile",blastProfile,blastProfileFile);

if (!inFile) {
    console.log("in= option undefined");
    process.exit(1);
}
if (!outFileExt) {
    console.log("ext= option undefined");
    process.exit(1);
}
if (!outPath) {
    console.log("out= option undefined");
    process.exit(1);
}

blast.outputString(true); //optional, provides string output instead of JSON

//var dbPath = '/var/www/html/blastdb/htgs/13apr2014/htgs';
//var dbPath = appPath+'/blastdb/htgs/htgs';



var options = {
//        db: dbPath,
        outfmt: 5,
        outputDirectory: outPath,   //appPath+'/tmp',
        queryFile: inFile,
        outFileExt: outFileExt,     // "blastxml" extension
        returnParams: true          // workflow script should include this blast option
};

options = _.extend( blastProfile,options);

//options.db = appPath+'/blastdb/'+g.jblast.blastProfiles['wheat'].db+'/'+g.jblast.blastProfiles['wheat'].db;
options.db = appPath+'/blastdb/'+blastProfile.db+'/'+blastProfile.db;

//console.log(">>> cwd",process.cwd());
console.log(">>> blast options",options);

fs.ensureDir(options.outputDirectory);

//read the file that the result will be compared against.
//var buffer = fs.readFileSync('./test/blastresult.xml');


/*
 * Script should display workflowResults: <return value of blast>.
 * This will make the results accessible to the parent app.
 */
blast.blast(options, function(err, results) {
    if (err) {
        var ret = results || {};
        ret.err = err;
        console.log('workflowResults:',ret);
        process.exit(1);
        //return err;
    }
    console.log('workflowResults:',JSON.stringify(results,null,4));
    return;
});
