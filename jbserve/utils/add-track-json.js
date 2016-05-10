#!/usr/bin/env node

var request = require('request'),
    fs = require('fs'),
    path = require('path'),
    getopt = require('node-getopt');

require('request-debug')(request);

// sails globals    
var jGbl = require('../server/config/globals');

var opt = getopt.create([
    ['d' , 'data=PATH'       , 'path to JBrowse data directory'],
    ['t' , 'track=PATH'      , 'path to new track file'],
    ['o' , 'stdout'          , 'write modified track list to stdout'],
    ['n' , 'notify=URL'      , 'publish notifications of new tracks'],
//    ['s' , 'secret=STRING'   , 'password for notification server'],
    ['m' , 'messages'        , 'log notification messages'],
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

console.dir(opt.options);

var dataDir = opt.options['data'] || '.';
var trackListPath = path.join (dataDir, 'trackList.json');
var newTrackPath = opt.options['track'] || opt.argv[0] || '/dev/stdin';
var logging = opt.options['messages'];

fs.readFile (newTrackPath, function (err, newTrackData) {
    console.log("reading file..."+newTrackPath);
    if (err) throw err;


    var newTrackJson = JSON.parse(newTrackData);

    //console.log("file content");
    //console.info(newTrackJson);

    //if it's a single definition, coerce to an array
    if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
        newTrackJson = [ newTrackJson ];
    }
   
    // validate the new track JSON structures
    newTrackJson.forEach (function (track) {
        if (!track.label) {
            console.log ("Invalid track JSON: missing a label element");
            process.exit (1);
        }
    });
    
    var payload = {
        "trackListPath": trackListPath,
        "addTracks": newTrackJson
    };
    
    //console.log(payload);

    var strPayload = JSON.stringify(payload);
    //strPayload = 'hello there';
    //console.log("*************strPayload="+strPayload);

    request.post({
        url: jGbl.globals.jbrowseRest+"/jbtrack/addTrack", 
        method: 'POST',
        //qs: params,
        headers: {
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : strPayload.length
        },
        body: strPayload
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
            //JSON.stringify(eval("(" + str + ")"));
            //var result = JSON.parse(body);
            var result = body;
            console.dir(result);
        }
    });    


});
