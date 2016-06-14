#!/usr/bin/env node

var request = require('request'),
    fs = require('fs'),
    path = require('path'),
    getopt = require('node-getopt');

//require('request-debug')(request);


// sails globals    
//var jGbl = require('../server/config/globals');


/*
 * command template: node add-track-json.js -d "/sample_data/json/volvox" -t ./inMemTemplate.json -f ./blast2.gff
 */

var opt = getopt.create([
    ['d' , 'data=PATH'       , 'path to JBrowse data directory'],
    ['t' , 'track=PATH'      , 'path to new track file'],
    ['f' , 'file=PATH'       , 'file; '],
    ['l' , 'label=STRING'       , 'track label (unique)'],
    
    
//    ['j' , 'jbrowse=PATH'    , 'JBrowse application path'],
//    ['o' , 'stdout'          , 'write modified track list to stdout'],
//    ['n' , 'notify=URL'      , 'publish notifications of new tracks'],
//    ['s' , 'secret=STRING'   , 'password for notification server'],
//    ['m' , 'messages'        , 'log notification messages'],
    ['h' , 'help'            , 'display this help']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

//console.dir(opt.options);

/*
read the jbrowse global config file in /etc/jbrowse/globals.dat
*/
var globalPath = "/etc/jbrowse";
var globalFile = globalPath + "/globals.dat";

try {
    fs.accessSync(globalFile, fs.F_OK);
    var str = fs.readFileSync(globalFile);
    var jGbl = JSON.parse(str);
    //console.log('globals.dat',jGbl);
} 
catch (e) {
    // It isn't accessible
    console.error(e);
    process.exit(1);
}


var dataDir = opt.options['data'] || jGbl.dataSet[0].dataPath || '.';

var trackListPath = path.join (dataDir, 'trackList.json');

// this is the track template file
var newTrackPath = opt.options['track'] || opt.argv[0] || '/dev/stdin';
var logging = opt.options['messages'];

var theFile = opt.options['file'];

/*
 * export the gff file to jbrowse
 * the default directory will be the <jbrowse data directory>/data
 * 
 */
//console.log("export file");
var srcFile = theFile;
var targetPath = jGbl.jbrowsePath + jGbl.dataSet[0].dataPath + "/data";

// strip out the source path
var targetFileOnly =  path.basename(theFile);
var trackLabel = targetFileOnly;

// rename .dat to .gff
targetFileOnly.replace(".dat", ".gff");

// todo:  generalize look at the galaxy history data to identify the file type as well as the filename

// prepend the full path
targetFile = targetPath +"/"+ targetFileOnly;

//console.log(targetPath,targetFileOnly);
try {
    // create the directory if necessary
    if (!fs.existsSync(targetPath)){
        fs.mkdir(targetPath, function(err) {
            if (err)    throw err;
        });
    }
}
catch (err) {
    console.error("create dir", err);
    process.exit(1);
}
exportFile(srcFile,targetFile);

// copy the file to the jbrowse directory
function exportFile(srcFile,targetFile) {
    try {
        console.log(srcFile,targetFile);
        //copy the file to exportpath
        fs.createReadStream(srcFile).pipe(fs.createWriteStream(targetFile));
    }
    catch (ex) {
        console.error("copy file", ex);
        process.exit(1);
    }
}

//console.log("track template");

/*
 * open track template file
 */
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
            console.error("Invalid track JSON: missing a label element");
            process.exit (1);
        }
    });
    
    // replace some track info
    newTrackJson[0].urlTemplate = "data/"+targetFileOnly;
    newTrackJson[0].label = trackLabel;
    newTrackJson[0].category= "BLAST Results";
    newTrackJson[0].key = trackLabel;


    
    // todo: eventually we need to grab some info from galaxy history
    
    var payload = {
        "trackListPath": trackListPath,
        "addTracks": newTrackJson
    };
    
    //console.log(payload);

    var strPayload = JSON.stringify(payload);
    //strPayload = 'hello there';
    //console.log("*************strPayload="+strPayload);

    request.post({
        url: jGbl.jbrowseRest+"/jbtrack/addTrack", 
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
            console.error(error);
        } else {
            console.log(response.statusCode, body);
            //JSON.stringify(eval("(" + str + ")"));
            //var result = JSON.parse(body);
            var result = body;
            console.dir(result);
        }
    });    


});
