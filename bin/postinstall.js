//var shelljs = require('shelljs');

// gets the blast util - (module blastjs)
//shelljs.exec('node blast_getBlast.js');


var approot = require("app-root-path").path;
var shelljs = require("shelljs");
var modPath = ""+shelljs.pwd();
var fs = require("fs-extra");
var async = require("async");


console.log(">>> jblast postinstall");
console.log("appPath",approot,"modPath",modPath);

// install jblast-simtools globally (access by galaxy simulation tool
//process.chdir('node_modules/jbh-jblast/jblast-simtool');
//shelljs.exec("sudo npm install -g");
//process.chdir('../../..');


//exit if modPath == approot, don't need to copy anything.
if (modPath === approot)
    process.exit(0);
    

// list of directories to copy
var dirList = [
    {src:'workflows',trg:'workflows'},
    {src:'test/jblast',trg:'test/jblast'},
    {src:'test/jblast-int',trg:'test/jblast-int'}
];

async.each(dirList,
    function(item, cb){
        var trg = approot+"/"+item.src;
        var src = modPath+"/"+item.trg;

        console.log('copying ',src,trg);
        // delete the old dir from src dir and make a current copy
        fs.copy(src, trg,{overwrite:true})
        .then(function() {
            //console.log("copied",trg);
            cb();
        })
        .catch(function(err) {
            console.log("error",err);
            cb(err);
        });

    },
    // done copying all directories
    function(err){
        if (err) {
            console.log("error",err);
            return;
        }
        console.log("postinstall done");
    }
);

// copy workflows/SearchProcess.html to jbrowse directory
// currently, we assume jbrowse has already been installed as a module in the 
// TODO: needs better handling (ie. in case JBrowse is installed elsewhere).
//console.log("copying SearchProcessing file...");
//shelljs.cp(modPath+'/workflows/SearchProcess.html',approot+'/node_modules/jbrowse');

// copy plugin dependencies to assets/jblib
console.log("Copying plugin dependencies to assets/jblib...");
let targDir = approot+'/assets/jblib';
fs.ensureDirSync(targDir);

// slider-pips
fs.copySync(approot+'/node_modules/jQuery-ui-Slider-Pips/dist',targDir,{overwrite:true});



// add jblast tests to jbconnect/package.json
console.log("Modifying package.json in approot...");
let package = require(approot+'/package.json');
package.scripts['jblast-test'] = "mocha test/jblast-int/**/*.test.js test/bootstrap/bootstrap.test.js";
fs.writeFileSync(approot+'/package.json', JSON.stringify(package,null,2));


shelljs.exec('npm install enuggetry/blast-ncbi-tools');
shelljs.exec('npm install enuggetry/faux-blastdb');
