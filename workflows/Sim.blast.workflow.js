var getopt = require('node-getopt');
var fs = require("fs-extra");
var shelljs = require("shelljs");
var blast = require('blast-ncbi-tools');

var appPath = require("app-root-path").path;
var jbrowsePath = appPath;

console.log('Starting Sim_Blast.workflow');

// check if jbrowse is a module
if (fs.pathExistsSync(appPath+"/node_modules/jbrowse/utils")) {
    jbrowsePath = appPath+"/node_modules/jbrowse";
}

// command line options
var getopt = new getopt([
    ['i' , 'in=NUMBER'          , 'input .fasta file'],
    ['p' , 'profile'            , 'value for compatibility; ignored'],
    ['e' , 'ext=<extension>'    , 'output extension'],
    ['o' , 'out=<path>'         , 'output path'],
    ['h' , 'help'               , 'display this help']
]);              // create Getopt instance
getopt.bindHelp();     // bind option 'help' to default action
opt = getopt.parseSystem(); // parse command line

var  inFile     = opt.options['in'];
var outFileExt  = opt.options['ext'];
var outPath     = opt.options['out']


blast.outputString(true); //optional, provides string output instead of JSON

//var dbPath = '/var/www/html/blastdb/htgs/13apr2014/htgs';
var dbPath = 'nnn';

var options = {
        db: dbPath,
        outfmt: 5,
        outputDirectory: outPath,   //appPath+'/tmp',
        queryFile: inFile,
        outFileExt: outFileExt,     // "blastxml" extension
        returnParams: true          // workflow script should include this blast option
};

//console.log("blast options",options);

fs.ensureDir(options.outputDirectory);

//read the file that the result will be compared against.
//var buffer = fs.readFileSync('./test/blastresult.xml');

//var outDir = '/var/www/html/jbconnect/node_modules/jbrowse/sample_data/json/volvox/jblastdata';
//var outDir = jbrowsePath

var fakeParams = { 
    type: 'blastn',
    outputDirectory: outPath,
    rawOutput: false,
    db: '/var/www/html/blastdb/htgs/13apr2014/htgs',
    outfmt: 5,
    outFileExt: 'blastxml',
    returnParams: true,
    out: outPath +'/'+ Date.now() + '.blastxml'
};

// copy the example file
var cmd = 'cp ./workflows/blastn-sample-with-hits.blastxml ' + fakeParams.out;
shelljs.exec(cmd);

var output = "Blast Command: "+cmd+" \n";
output += "workflowResults: " + JSON.stringify(fakeParams,null,4);

console.log(output);

process.exit(0);
