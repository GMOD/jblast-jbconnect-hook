/**
 * This is part of the seqSearchService framework
 * PhantomJS script to spawn the SearchProcess.html script
 */
var page = require('webpage').create();

console.log('Starting ServerSearch.workflow');

var fs = require('fs');
var system = require('system');

var prefix          = system.args[1];
var url             = system.args[2];
var outfile         = system.args[3];
var searchParams    = system.args[4];
var jobid           = system.args[5];

console.log("args",prefix,url,outfile,searchParams);

var thePage = url;
thePage += '?prefix='+prefix;
thePage += '&jobid='+jobid;
thePage += '&searchParams='+searchParams;

console.log("Search URL",thePage);
var dataReady = false;


// write the the file when we have a buffer
var gmsg = null;
var intv = setInterval(function(){
    if (gmsg) {
        clearInterval(intv);
        console.log("Got Data! writing...",outfile);
        fs.write(outfile,gmsg,'w');
        console.log("done writing")
        phantom.exit();
    }
},1000);


page.open(thePage, function(status) {
    console.log("Status: " + status);
    if(status === "success") {
        window.setTimeout(function () {
            //page.render('example.png');
            phantom.exit();
        }, 10000); // Change timeout as required to allow sufficient time 
    }
});
page.onConsoleMessage = function(msg, lineNum, sourceId) {
    
    if (dataReady){
        gmsg = msg;
        //console.log(msg);
        //fs.writeFileSync('test.dat',msg,'w');  write does not work in here?? why??
        return;
    }
    if (msg==='>>>>>BEGIN') dataReady = true;

    console.log('CONSOLE ('+msg.length+'): ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};	  
