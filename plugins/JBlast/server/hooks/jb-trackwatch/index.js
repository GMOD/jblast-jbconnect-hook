/* 
 */

var fs = require('fs'),
    path = require('path'),
    deferred = require('deferred')


module.exports = function trackWatchHook(sails) {
    return {

        initialize: function(cb) {
            console.log("Sails Hook: jb-trackwatch initialized");
            
            return cb();
        },
        routes: {
            before: {
                // given a reference to the trackList.json, it begins tracking the file
                'get /jbtrack/watch': function (req, res, next) {
                    console.log("jb-trackwatch /jbtrack/watch called");
                    tracklist = req.param("trackList");
                    console.log("tracklist = "+tracklist);
                    //JbTrack.message(1, {msg:"track-test",value:"JBrowse test"});

                    res.send({result:"success"});
                    //return next();
                },
                'post /jbtrack/addTrack': function (req, res, next) {
                    console.log("jb-trackwatch /jbtrack/addTrack called");
                    var result = addTrackJson(req,res,next);
                    res.send(result);
                    //return next();
                },
                'get /jbtrack/removeTrack': function (req, res, next) {
                    console.log("jb-trackwatch /jbtrack/removeTrack called");
                    tracklist = req.param("trackList");
                    console.log("tracklist = "+tracklist);
                    //JbTrack.message(1, {msg:"track-test",value:"JBrowse test"});

                    res.send({result:"success"});
                    //return next();
                },
                'get /jbtrack/test/:value': function (req, res, next) {
                    console.log("jb-trackwatch /jbtrack/test/[value] called");
                    //console.dir(req.params);
                    console.log("received value = "+req.params.value);
                    
                    JbTrack.message(1, {msg:"track-test",value:req.params.value});
                    //JbTrack.publishCreate({msg:"track-test",value:req.params.value});
                    res.send({result:"success"});
                    //return next();
                },
                'get /jbtrack/test': function (req, res, next) {
                    console.log("jb-trackwatch /jbtrack/test called");
                    JbTrack.message(1, {msg:"track-test",value:"JBrowse test"});

                    res.send({result:"success"});
                    //return next();
                }
            }
        }
    };
}

function startTracking(tracklist) {
    
    
}

function addTrackJson(req,res,next) {

    var g = sails.config.globals.jbrowse;
    
    var newTrackJson = req.body.addTracks;
    //var trackListPath = req.body.trackListPath;

    console.log('globals',g);
    
    //todo: make this configurable later
    var trackListPath = g.jbrowsePath + g.dataSet[0].dataPath + 'trackList.json';
    
    
    //console.log(req.body);
    console.log("trackListPath = "+trackListPath);
    console.log("newTrackJson = ",newTrackJson);
    //var trackListPath = req.body.trackListPath;
    
    var filePath = trackListPath;
    
    console.log("reading ...");
    fs.readFile (filePath, function (err, trackListData) {
        if (err) {
            console.log ("Warning: could not open '" + trackListPath + "': " + err);
            return;
        }
        
        var trackListJson = err ? {} : JSON.parse(trackListData);
        //trackListJson.tracks = trackListJson.tracks || [];
        
        console.log("read "+trackListJson.tracks.length + " tracks");

        //var timeout = setTimeout (function() {
        //    if (args.newTrackPath == '/dev/stdin')
        //        console.log ("[waiting for new track on stdin]")
        //}, 500)
        //fs.readFile (newTrackPath, function (err, newTrackData) {
            //clearTimeout (timeout)
            //if (err) throw err;

            //var newTrackJson = JSON.parse(newTrackData);

            // if it's a single definition, coerce to an array
            if (Object.prototype.toString.call(newTrackJson) !== '[object Array]') {
                newTrackJson = [ newTrackJson ];
            }
            else {
                console.log("is array");
            }

            // validate the new track JSON structures
            console.log("validating...");
            newTrackJson.forEach (function (track) {
                if (!track.label) {
                    console.log ("Invalid track JSON: missing a label element");
                    //process.exit (1)
                    //return {"result":"fail", "reason":"Invalid track JSON: missing a label element"};
                }
            });

            // insert/replace the tracks
            console.log("insert/replace...");
            var addedTracks = [], replacedTracks = [];
            
            console.log("start track count "+trackListJson.tracks.length);
            
            newTrackJson.forEach (function (newTrack) {
                var newTracks = [];
                trackListJson.tracks.forEach (function (oldTrack) {
                    if (oldTrack.label === newTrack.label) {
                        newTracks.push (newTrack);
                        replacedTracks.push (newTrack);
                        newTrack = {};
                    } else {
                        newTracks.push (oldTrack);
                    }
                });
                if (newTrack.label) {
                    newTracks.push (newTrack);
                    addedTracks.push (newTrack);
                    console.log("** newtrack **");
                }
                trackListJson.tracks = newTracks;
            });

            // write the new track list
            console.log("start track count "+trackListJson.tracks.length);
            console.log("writing new tracklist...");

            var trackListOutputData = JSON.stringify (trackListJson, null, 2);
            fs.writeFileSync (filePath, trackListOutputData);
 
            // publish notifications
            deferred.map (addedTracks, function (track) {
                JbTrack.message(1, {msg:"track-new","value":track});
                console.log ("Announced new track " + track.label);
            });
            deferred.map (replacedTracks, function (track) {
                JbTrack.message(1, {msg:"track-replace","value":track});
                console.log ("Announced replacement track " + track.label);
            });
        //});
    });
    
    return {result:"success"};
}
/*
function removeTrack(args) {
    fs.readFile (trackListPath, function (err, trackListData) {
        if (err) {
            console.log ("Warning: could not open '" + trackListPath + "': " + err)
        }
        var trackListJson = err ? {} : JSON.parse(trackListData)
        trackListJson.tracks = trackListJson.tracks || []

        // delete the track
        function deleteFilter (oldTrack) {
            return trackLabels.some (function (trackLabel) { return oldTrack.label == trackLabel })
        }
        function negate (pred) { return function() { return !pred.apply(this,arguments) } }
        var deletedTracks = trackListJson.tracks.filter (deleteFilter)
        trackListJson.tracks = trackListJson.tracks.filter (negate (deleteFilter))

        function notFoundFilter (trackLabel) {
            return !deletedTracks.some (function (track) { return track.label == trackLabel })
        }
        if (trackLabels.some (notFoundFilter)) {
            console.log ("Warning: the following track labels were not found: " + trackLabels.filter(notFoundFilter).join())
        }

        // write the new track list
        var trackListOutputData = JSON.stringify (trackListJson, null, 2)
        if (opt.options.stdout) {
            process.stdout.write (trackListOutputData + "\n")
        } else {
            fs.writeFileSync (trackListPath, trackListOutputData)
        }

        // delete the track data
        if (deleteData)
            deletedTracks.forEach (function (track) {
                var trackDataDir = path.join (dataDir, 'tracks', track.label)
                if (fs.existsSync (trackDataDir)) {
                    console.log ("Removing " + trackDataDir)
                    exec ('rm -r ' + trackDataDir)
                }
            })

        // publish notification
        var publishUrl = opt.options['notify']
        if (publishUrl) {
            var client = new faye.Client (publishUrl)
            var secret = opt.options['secret']
            if (secret)
                client.addExtension({
                    outgoing: function(message, callback) {
                        message.ext = message.ext || {};
                        message.ext.password = secret;
                        callback(message);
                    }
                });
            if (logging)
                client.addExtension({
                    outgoing: function(message, callback) {
                        console.log ('client outgoing', message);
                        callback(message);
                    }
                });
            client.publish ("/tracks/delete", trackLabels.map (function (trackLabel) {
                return { label : trackLabel }
            })).then (function() {
                console.log ("Announced deleted tracks: " + trackLabels.join())
                process.exit()
            }, function() {
                console.log ("Failed to announce deleted track " + trackLabels.join())
                process.exit()
            })

        } else {
            process.exit()
        }

    });
}
*/
