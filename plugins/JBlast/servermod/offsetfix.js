var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');

module.exports = {
    process: function(kWorkflowJob,newTrackJson,cb) {
        var g = sails.config.globals.jbrowse;
        
        sails.log.debug("offsetfix.process()");
        
        var blastfile = g.jbrowsePath + g.dataSet[0].dataPath + g.jblast.blastResultPath +"/"+ newTrackJson[0].label + ".json";
        // attempt to read the file
        try {
            var content = fs.readFileSync(blastfile, 'utf8');
        } catch(e) {
            sails.log.error("failed to read blast file",blastfile);
            return;
        }
        var data = JSON.parse(content);

        var hits = data.BlastOutput.BlastOutput_iterations.Iteration.Hit;

        
        var offset = parseInt(kWorkflowJob.data.blastData.offset);
        
        // add offset to HSP query from/to
        var fixHsp = function(hsp) {

            var start = parseInt(hsp['Hsp_query-from']) + offset;
            var end = parseInt(hsp['Hsp_query-to']) + offset;

            hsp['Hsp_query-from'] = "" + start;
            hsp['Hsp_query-to'] = "" + end;

            return hsp;
        };
        
        // fix offsets
        for(var x in hits) {
            fixHsp(hits[x].Hsp);
            sails.log.debug(hits[x]);
        }
        
        // write file
        try {
            fs.writeFileSync(blastfile,JSON.stringify(data,null,2));
        } catch (err) {
            sails.log.error('failed to write',blastfile);
            return;
        }
        cb();
    }
};

