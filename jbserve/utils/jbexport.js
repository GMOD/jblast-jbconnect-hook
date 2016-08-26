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
    ['t' , 'track=PATH'      , 'path to new track template'],
    ['g' , 'gff=PATH'       , 'GFF file input; '],
    ['b' , 'blastjson=PATH'       , 'blastJSON file input; '],
    ['l' , 'label=STRING'       , 'track label (unique)'],
    ['o' , 'out=PATH'       , 'output jbrowse config JSON'],
    
    
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
var g = getGlobals();
console.log("globals",g);

// export will copy result files into <dataset dir>/data (i.e. "/sample_data/json/volvox/data"
var blastResultDir = "data";
/*
 * export the gff file to jbrowse
 * the default directory will be the <jbrowse data directory>/data
 * 
 */
var theGffSrc = opt.options['gff'];
var theGffTarget = getTargetFile(theGffSrc,'gff');

var theJsonSrc = opt.options['blastjson'];
var theJsonTarget = getTargetFile(theJsonSrc,'json');

console.log("gff",theGffSrc,theGffTarget);
console.log("json",theJsonSrc,theJsonTarget);

exportFile(theGffSrc,theGffTarget);
exportFile(theJsonSrc,theJsonTarget);

var fileGffOnly = path.basename(theGffTarget);
var fileJsonOnly = path.basename(theJsonTarget);

notifyListeners();

// write a file, just because the galaxy tool wants one.
// todo: later we can perhaps output some info in this file.
var outFile = opt.options['out'];
fs.writeFileSync(outFile, 'Success');

//process.exit(0);

// copies the specified file into the data directory data directory of the jbrowse dataset, whatever that is.
function getTargetFile(srcFile,ext) {

    // get the garget path the the data directory
    // todo: there needs to be a way to get a working path from the jbrowse GUI.
    var targetPath = g.jbrowsePath + g.dataSet[0].dataPath + blastResultDir;

    // create the directory if necessary
    try {
        if (!fs.existsSync(targetPath)){
            fs.mkdir(targetPath, function(err) {
                if (err) throw err;
            });
        }
    }
    catch (err) {
        console.error("create dir", err);
        process.exit(1);
    }
    
    // rename .dat to .gff
    var ts = (new Date).getTime();
    var filename = "";
    if (ext==='gff') filename = "jblast-track-"+ts+".gff";
    if (ext==='json')filename = "jblast-data-"+ts+".json";

    // prepend the full path
    targetFile = targetPath +"/"+ filename;

    return targetFile;

}

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
function notifyListeners () {
    // this is the track template file
    //var newTrackPath = opt.options['track'];
    var trackListPath = g.jbrowsePath+g.dataSet[0].dataPath + blastResultDir;
    var newTrackPath = trackListPath+'/'+"inMemTemplate.json";
    console.log("notifyListeners()",newTrackPath,newTrackPath.length);
    
    fs.readFile (newTrackPath, function (err, newTrackData) {
        console.log("reading file..."+newTrackPath);
        if (err) { 
            throw err;
            console.log(err);
            process.exit(1);
        }

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
        
        var dateFormat = require('dateformat');
        var ts = new Date();  
        var trackLabel = g.jblast.name+' '+dateFormat(ts,"isoDateTime");

        // replace some track info
        newTrackJson[0].urlTemplate = blastResultDir+"/"+fileGffOnly;
        newTrackJson[0].blastData = blastResultDir+"/"+fileJsonOnly;
        newTrackJson[0].label = trackLabel;
        newTrackJson[0].category= "BLAST Results";
        newTrackJson[0].key = trackLabel;



        var payload = {
            "trackListPath": trackListPath,
            "addTracks": newTrackJson,
            "blastGff":blastResultDir+"/"+fileGffOnly,
            "blastJson":blastResultDir+"/"+fileJsonOnly
        };

        //console.log(payload);

        var strPayload = JSON.stringify(payload);
        //strPayload = 'hello there';
        var url = g.jbrowseRest+"/jbtrack/addTrack";
        console.log("posting strPayload="+strPayload, url);

        request.post({
            url: url, 
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
                process.exit(1);
            } else {
                console.log(response.statusCode, body);
                //JSON.stringify(eval("(" + str + ")"));
                //var result = JSON.parse(body);
                var result = body;
                console.dir(result);
            }
        });    


    });
}
function getGlobals() {
    var globalPath = "/etc/jbrowse";
    var globalFile = globalPath + "/globals.dat";
    var jGbl = {};
    
    try {
        fs.accessSync(globalFile, fs.F_OK);
        var str = fs.readFileSync(globalFile,"utf-8");
        //console.log("global data len",str.length,str);
        jGbl = JSON.parse(str);
        //console.log('globals.dat',jGbl);
    } 
    catch (e) {
        // It isn't accessible
        console.error(e);
        process.exit(1);
    }
    return jGbl;
}
