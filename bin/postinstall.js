//var shelljs = require('shelljs');

// gets the blast util - (module blastjs)
//shelljs.exec('node blast_getBlast.js');


var appPath = require("app-root-path").path;
var shelljs = require("shelljs");
var modPath = ""+shelljs.pwd();
var fs = require("fs-extra");
var async = require("async");


console.log(">>> jblast postinstall");
console.log("appPath",appPath,"modPath",modPath);

//exit if modPath == appPath, don't need to copy anything.
if (modPath === appPath)
    process.exit(0);
    

// list of directories to copy
var dirList = [
    {src:'workflows',trg:'workflows'}
];

async.each(dirList,
    function(item, cb){
        var trg = appPath+"/"+item.src;
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

