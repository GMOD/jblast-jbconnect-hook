/*
 * JBrowse Server Plugin - Galaxy Kue Sync module
 * note g.kue, g.kue_queue are defined in config/http.js
 */

//var request = require('request');
//var requestp = require('request-promise');

module.exports = {
    start: function() {
        sails.log.info('kue job monitor starting');
        var thisB = this;
        setTimeout(function() {
            thisB.monitor();
            //thisB.test();
        },1000);
    },
    monitor: function() {
        var g = sails.config.globals;
        var thisB = this;
        
        g.kue_queue.on('job enqueue', function(id, data){
          thisB.processEvent('enqueued',id,data);
        });        
        g.kue_queue.on('job start', function(id, data){
          thisB.processEvent('start',id,data);
        });        
        g.kue_queue.on('job failed', function(id, data){
          thisB.processEvent('failed',id,data);
        });        
        g.kue_queue.on('job failed attempt', function(id, data){
          thisB.processEvent('failed attempt',id,data);
        });        
        g.kue_queue.on('job progress', function(id, data){
          thisB.processEvent('process',id,data);
        });        
        g.kue_queue.on('job complete', function(id, data){
          thisB.processEvent('process',id,data);
        });        
        g.kue_queue.on('job remove', function(id, data){
          thisB.processEvent('remove',id,data);
        });        
        g.kue_queue.on('job promotion', function(id, data){
          thisB.processEvent('promotion',id,data);
        });        
    },
    processEvent: function(event,id,data) {
        var g = sails.config.globals;
        
        g.kue.Job.get(id, function(err, job){
            if (err) return;
            if (job.type==='galaxy-job') return;    // ignore galaxy-job
            
            sails.log.info( '[kueJobMon] %s, %s id=%s, data %s',job.type,event, id, data );
            
        });
        
    },
    test: function() {
        sails.log("kueJobMon starting test");
        
        var g = sails.config.globals;

        var job = g.kue_queue.create('test-email', {
            title: 'welcome email for tj'
          , to: 'tj@learnboost.com'
          , template: 'welcome-email'
        }).save( function(err){
           if( !err ) console.log( 'kueJobMon test error',job.id );
        });

        setTimeout(function() {
            g.kue_queue.process('test-email', function(job, done){
              //emailx(job.data.to, done);
              var count = 0;
              var max = 7;
              var j = setInterval(function() {
                  //done();
                  job.progress(count, max, {nextSlide : count+1});
                  if (count++ === max){
                    clearInterval(j);
                    done(new Error('whoa error dude'));
                  }  
              },1000);
            });
        },2000);
        
    }
}




