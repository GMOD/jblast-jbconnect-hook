/*
 * JBrowse Server Plugin - Galaxy Kue Sync module
 * note g.kue, g.kue_queue are defined in config/http.js
 */

var request = require('request');
var requestp = require('request-promise');
//var prettyjson = require('prettyjson');

var $ = 0;

var galaxyWorkflows = [];

require("jsdom").env("", function(err, window) {
	if (err) {
		console.error(err);
		return;
	}
 
	$ = require("jquery")(window);
});


// prettyjson options
var pOptions = {
  keysColor: 'yellow',
  dashColor: 'magenta',
  stringColor: 'white'
};


module.exports = function galaxyKueSyncHook(sails) {
   return {

        initialize: function(cb) {
            console.log("jb-galaxy-kue-sync initialize"); 
            // todo: check that galaxy is running
            
            //console.log(sails.models);
            
            setInterval(function(){
                //console.log("intervalCount "+intervalCount++);
                //syncGalaxyJobs();
                syncGalaxyHistories();
                //read_workflows();
            },2500);
            
            return cb();
        },
        routes: {
           before: {
              'get /jbapi/cleanquemodel': function (req, res, next) {
                  console.log("jb-galaxy-kue-sync /jbJob/cleanquemodel called");
                  cleanupQueueModel (req, res);
                  res.send({result:"jb-galaxy-kue-sync cleanquemodel"});
                  //return next();
              },
              'get /test/testmsg': function (req, res, next) {
                    console.log("jb-galaxy-kue-sync /test/testmsg called");
                    console.dir(req.params);
                    return res.send("Hi there!");
              }
           }
        }
   };
};
/**
 * 
 * @returns {undefined}
 */
function syncGalaxyHistories() {
    var g = sails.config.globals;
    /*
    */
    var historyId = sails.hooks['jb-galaxy-blast'].getHistoryId();
   
    syncGalaxyJobs(historyId);
};

/*
 * Synchronizes kue queue with galaxy job queue.
 * @returns {undefined}
 * 
 * kJobs are kue jobs and gJobs are galaxy history entries.
 */
var jobCount = 0;
var lastJobCount = 0;

function syncGalaxyJobs(hist) {
    //console.log('loadGalaxyJobs()');
    n = 1000000;
    var thisB = this;
    var g = sails.config.globals;
    
    //request(g.jbrowse.galaxy.galaxyUrl +"/api/jobs"+"?key="+g.jbrowse.galaxy.galaxyAPIKey, function (error, response, body) {
    request(g.jbrowse.galaxy.galaxyUrl +"/api/histories/"+hist+"/contents"+"?key="+g.jbrowse.galaxy.galaxyAPIKey, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //console.log(body);
            //console.log(prettyjson.render(jobs,pOptions)); // Print the body of response.
            try {
                var jobs = JSON.parse(body);

                // filter deleted history entries
                var gJobs = [];
                jobCount = 0;
                for(var x in jobs) {
                    if (jobs[x].deleted==false) {
                        gJobs.push(jobs[x]);
                        jobCount++;
                    }
                }
                // send job count change event
                if (jobCount != lastJobCount) {
                    console.log("job event job count "+jobCount);
                    sails.hooks['jbcore'].sendEvent("job-count",{count:jobCount});
                    lastJobCount = jobCount;
                }
                
                // mark all gJobs as unprocessed, for bookkeeping
                var done = [];
                for(var x in gJobs) done[x] = false;
                
                // get kue queue
                //console.log("job count "+jobCount);
                // compare gjobs to kjobs; if they don't exist, delete
                forEachKueJob('galaxy-job', function(kJob) {
                    
                    var found = false;
                    for(var x in gJobs) {
                        var gJob = gJobs[x];
                        if (gJob.id === kJob.data.galaxy_data.id) {
                            done[x] = true;
                            found = true;
                            jobCount--;

                            //console.log(prettyjson.render(gJob,pOptions));
                            
                            // make a copy of kJob to for sending
                            //var kJob1 = jData(kJob);
                            var kJob1 = JSON.parse(JSON.stringify(jData(kJob)));    // deep copy
                            kJob1.data.galaxy_data = gJob;
                            kJob1.state = convertGalaxyState(gJob.state);
                            
                            //console.log(gJob.hid+" "+kJob.data.galaxy_data.state+" "+gJob.state);
                            
                            if (kJob.data.galaxy_data.state !== gJob.state) {   // todo: handle more than state change
                                console.log(gJob.hid+" event job-change "+kJob.id);
                                sails.hooks['jbcore'].sendEvent("job-change",{job:kJob1});
                            }
                            kJob.state(convertGalaxyState(gJob.state));
                            kJob.data.galaxy_data = gJob;
                            kJob.save();
                            //console.log("existing id "+kJob.data.galaxy_data.id);
                            break;
                        }
                    }
                    if (!found) {
                        // delete
                        var id = kJob.id;
                        sails.hooks['jbcore'].sendEvent("job-remove",{job_id:id});
                        //console.dir(kJob);
                        kJob.remove( function(){
                          console.log(kJob.data.galaxy_data.hid+' event removed job '+id);
                        });
                      }
                });
                
                // creates new kJobs if there are any
                // we call recursively because multiple kue_queue.create does not yield the correct job id.
                // so we must create the next after the first one completes, in .save
                function jobCreateAny() {
                    for(var x in gJobs) {
                        if (!done[x]) {
                            var kJob = g.kue_queue.create('galaxy-job', {
                                galaxy_data: gJobs[x]
                            })
                            .state(convertGalaxyState(gJobs[x].state))
                            .save(function(err){
                                if (!err) {
                                    done[x] = true;
                                    console.log(kJob.data.galaxy_data.hid+" adding job id = "+kJob.id);
                                    
                                    sails.hooks['jbcore'].sendEvent("job-add",{job:jData(kJob)});
                                    jobCreateAny();     // call again when we are done, to look for the next thingy
                                }
                                // todo: handle errors
                            });
                            return;
                        }
                    }
                }
                function jData (kJob) {
                    return {
                        id: kJob.id,
                        type: kJob.type,
                        data: kJob.data,
                        priority: kJob.priority,
                        progress: kJob.progress,
                        state: kJob.state,
                        created_at: kJob.created_at,
                        promote_at: kJob.promote_at,
                        updated_at: kJob.updated_at,
                        attempts: kJob.attempts
                    };
                }
                // add new gJobs to kue when all the other jobs are done
                
                var t1 = setInterval(function() {
                    if (jobCount === 0 && typeCount === 0) {
                        clearInterval(t1);
                        jobCreateAny();
                    }
                },1000);
                
            }
            catch (ex) {
                    console.error(ex);
            }
        }
    });
}


/** galaxy job states / kue job state mapping
    ‘new’               inactive
    ‘upload’            active
    ‘waiting’           inactive
    ‘queued’            inactive
    ‘running’           running
    ‘ok’                complete
    ‘error’             failed
    ‘paused’            delayed
    ‘deleted’           ??
    ‘deleted_new’       ??
*/
function convertGalaxyState(gState) {
    var kState = 'inactive';
    
    switch(gState) {
        case 'upload':
            kState = 'active';
            break;
        case 'running':
            kState = 'active';
            break;
        case 'ok':
            kState = 'complete';
            break;
        case 'error':
            kState = 'failed';
            break;
        case 'paused':
            kState = 'delayed';
            break;
    }
    return kState;
}
var typeCount = 0;
var lastActiveCount = 0;
function forEachKueJob(jobType,callback) {
    var g = sails.config.globals;
    var n = 100000;
    jobCount = 0;
    typeCount = 5;

    g.kue.Job.rangeByType(jobType, 'inactive', 0 , n, 'asc', function(err, kJobs) {
        jobCount += kJobs.length;
        typeCount--;
        //console.log("inactive "+kJobs.length);
        kJobs.forEach(function(kJob) {
            callback(kJob);
        });
    });
    g.kue.Job.rangeByType(jobType, 'active', 0 , n, 'asc', function(err, kJobs) {
        
        // report changes in active count
        if (kJobs.length !== lastActiveCount) {
            console.log("job event active count "+kJobs.length);
            sails.hooks['jbcore'].sendEvent("job-active",{count:kJobs.length});
            lastActiveCount = kJobs.length;
        }
        
        jobCount += kJobs.length;
        typeCount--;
        //console.log("active "+kJobs.length);
        kJobs.forEach(function(kJob) {
            callback(kJob);
        });
    });
    g.kue.Job.rangeByType(jobType, 'complete', 0 , n, 'asc', function(err, kJobs) {
        jobCount += kJobs.length;
        typeCount--;
        //console.log("complete "+kJobs.length);
        kJobs.forEach(function(kJob) {
            callback(kJob);
        });
    });
    g.kue.Job.rangeByType(jobType, 'delayed', 0 , n, 'asc', function(err, kJobs) {
        jobCount += kJobs.length;
        typeCount--;
        //console.log("delayed "+kJobs.length);
        kJobs.forEach(function(kJob) {
            callback(kJob);
        });
    });
    g.kue.Job.rangeByType(jobType, 'failed', 0 , n, 'asc', function(err, kJobs) {
        jobCount += kJobs.length;
        typeCount--;
        //console.log("failed "+kJobs.length);
        kJobs.forEach(function(kJob) {
            callback(kJob);
        });
    });
    
}

function cleanupQueue (req, res) {
    var g = sails.config.globals;
    var n = 100000; // some large number
    
    console.log("cleaning Kue");

    g.kue.Job.rangeByType( 'galaxy-job', '*', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });    
    
/*    
    g.kue.Job.rangeByState( 'inactive', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });
    g.kue.Job.rangeByState( 'active', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });
    g.kue.Job.rangeByState( 'failed', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });
    g.kue.Job.rangeByState( 'delayed', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });
    g.kue.Job.rangeByState( 'complete', 0, n, 'asc', function( err, jobs ) {
      jobs.forEach( function( job ) {
        job.remove( function(){
          console.log( 'removed ', job.id );
        });
      });
    });
*/
}

// destroy all jbjob model records
function cleanupQueueModel (req, res) {

    sails.models.jbjob.destroy({}).exec(function (err){
      if (err) {
          sails.error("err="+err);
        //return res.negotiate(err);
      }
      sails.log('All jbjobs records destroyed.');
      //return res.ok();
    });
}