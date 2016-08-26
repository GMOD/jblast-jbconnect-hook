#!/usr/bin/env node

/*
 * add blast globals to global file 
 */
var fs = require("fs");

var globalPath = "/etc/jbrowse";
var globalFile = globalPath + "/globals.dat";

var blastData = {
            "name": "JBlast Test", 
            "blastSeq": "/var/www/html/jb-galaxy-blaster/tmp/44705works.fasta",
            "originalSeq": "/var/www/html/jb-galaxy-blaster/tmp/volvox.fa",
            "offset": 44705
    };

storeInGlobals(blastData,"jblast");
// add a new section to global data
function storeInGlobals (sectionData,sectionName) {
    
    fs.readFile(globalFile, function read(err, data) {
        if (err) {
            throw err;
        }
        var g = JSON.parse(data);
        g[sectionName] = sectionData;

        var gStr = JSON.stringify(g,null,4);

        fs.writeFile(globalFile,gStr, function (err) {
            if (err) throw err;
            console.log("Global file: "+ globalFile);
        });
    });    
        
}



