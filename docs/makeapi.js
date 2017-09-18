/**
 * generate api.rst 
 * concats the files in genapi-rst dir.
 */

console.log("running makeapi...");

var fs = require('fs-extra');
var replaceall = require('replaceall');

var dirpath = './genapi-rst/';
var outfile = './api.rst';

var ignore = ['conf.py','index.rst','readme.md'];

// remove file
if (fs.existsSync(outfile))
    fs.unlinkSync(outfile);

console.log('generating api.rst');

// main title
fs.appendFileSync(outfile,'***\nAPI\n***\n\n');


fs.readdirSync(dirpath).forEach(file => {

    if (ignore.indexOf(file) == -1) {  // if file is not in ignore list
        
        console.log("appending --",file);

        var array = fs.readFileSync(dirpath+file).toString().split("\n");
        
        processFile(array);
        //process.exit(1);
    }
});
/**
 * 
 * @param {type} array
 * @returns {undefined}
 */
function processFile(lines) {
    // remove the first line - above title
    lines.splice(0,1);
    
    // change the title level of the first line 
    lines[1] = replaceall('=','*',lines[1]);
    
    for(i in lines) {
        // remove "Children" section
        if (lines[i].indexOf("Children") > -1) {
            lines.splice(i,6);
        }
        //console.log(lines[i]);
        
        fs.appendFileSync(outfile,lines[i]+'\n');
    }
}
