/**
 * generate api.rst 
 * concats the files in genapi-rst dir.
 */
var fs = require('fs-extra');
var replaceall = require('replaceall');

var dirpath = './genapi-rst/';
var outfile = './api.rst';

var ignore = ['conf.py','index.rst','readme.md'];

// remove api.rst file
if (fs.existsSync(outfile))
    fs.unlinkSync(outfile);

console.log('generating api.rst...');

// main title
fs.appendFileSync(outfile,'***\nAPI\n***\n\n');

// scan through each file in directory
fs.readdirSync(dirpath).forEach(file => {

    //console.log("file",file);
    if (ignore.indexOf(file) === -1) {  // if file is not in ignore list

        var array = fs.readFileSync(dirpath+file).toString().split("\n");
        
        processFile(array,file);
        //process.exit(1);
    }
});
/**
 * 
 * @param {type} array
 * @returns {undefined}
 */
function processFile(lines,file) {
    // remove the first line - above title
    lines.splice(0,1);
    
    // change the title level of the first line 
    lines[1] = replaceall('=','*',lines[1]);
    
    // skip file if "##excludedoc" is found
    for (var i in lines) {
        if (lines[i].indexOf("##excludedoc") > -1) {
            //console.log(i,lines[i]);
            console.log("..ignoring --",file);
            return;
        }
    }
    
    console.log("appending --",file);

    // Sphinx horiz line between modules
    fs.appendFileSync(outfile,'\n.. raw:: html\n\n   <hr style="border-color: black; border-width: 2px;">\n\n');
    
    var savelo = 0;
    var savehi = 0;
    
    for(var i in lines) {
        // remove "Children" section
        if (lines[i].indexOf("Children") > -1) {
            lines.splice(i,6);      // remove from position, 6 lines
            i = i - 6;
        }
        // remove "Member: ``" section
        if (lines[i].indexOf("Member: ``") > -1) {
            if (savelo === 0) savelo = i;
            if (i > savehi) savehi = i;
        }
    }
    // splice out members
    if (savelo)
       lines.splice(savelo-2,savehi-savelo + 4);    // remove position-2, 4 lines
    
    // output
    for(var i in lines)
        fs.appendFileSync(outfile,lines[i]+'\n');
}
