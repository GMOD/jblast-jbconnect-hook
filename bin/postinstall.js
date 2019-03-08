var approot = require("app-root-path").path;
//var path = require('path');
//var approot = path.dirname(require.main.filename);
var shell = require("shelljs");
var modPath = ""+shell.pwd();
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
    {src:'workflows',trg:'workflows'}
//    {src:'test/jblast-dev.sh',trg: 'test/jblast-dev.sh'},
//    {src:'test/.nycrc-jblast',trg: 'test/.nycrc-jblast'}
//    {src:'test/jblast',trg:'test/jblast'},
//    {src:'test/jblast-int',trg:'test/jblast-int'}
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
package.scripts['jblast-test'] = "mocha test/unit/**/*.test.js test/integration/**/*.test.js node_modules/jblast-jbconnect-hook/test/jblast-int/**/*.test.js test/bootstrap/bootstrap.test.js";
package.scripts['jblast-coverage'] = "nyc --reporter=lcov --nycrc-path node_modules/jblast-jbconnect-hook/test/.nycrc-jblast mocha test/unit/**/*.test.js test/integration/**/*.test.js node_modules/jblast-jbconnect-hook/test/jblast-int/**/*.test.js test/bootstrap/bootstrap.test.js";
package.scripts['jblast-dev'] = "sh node_modules/jblast-jbconnect-hook/test/jblast-dev.sh";
fs.writeFileSync(approot+'/package.json', JSON.stringify(package,null,2));

/*
let cwd = shell.pwd();
shell.cd(approot);

// install ncbi tools
if (shell.exec('npm install blast-ncbi-tools').code !== 0) {
    shell.echo('Error installing blast-ncbi-tools');
    shell.exit(1);
}
// install faux blast database
if (shell.exec('npm install faux-blastdb').code !== 0) {
    shell.echo('Error install faux-blastdb');
    shell.exit(1);
}

shell.cd(cwd);  // restore working directory
*/
