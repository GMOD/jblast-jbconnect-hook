var request = require('request');
//var requestp = require('request-promise');
//var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var util = require('./utils');

module.exports = {
    init: function(cb,cberr) {
        var g = sails.config.globals.jbrowse;
        this.historyName = g.galaxy.historyName;
        
        this.initHistory(
            function(data) {
                cb(data);
            },
            function(error) {
                cberr(error);
            });
    },
    /* promise-ized galaxyGetJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyGetPromise: function(api) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyGET(api, resolve, reject);
        });
    },
    /* promise-ized galaxyPostJSON function
     * 
     * @param {type} api
     * @returns {Promise}
     */
    galaxyPostPromise: function(api,params) {
        var thisB = this;
        return new Promise(function(resolve, reject) {
            thisB.galaxyPOST(api,params, resolve, reject);
        });
    },
    /**
     * send JSON GET request to galaxy server
     * @param {type} api - i.e. '/api/histories'
     * @param {type} cb  callback i.e. function(retval)
     * @returns {undefined}
     * 
     */
    galaxyGET: function(api,cb) {
        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        //sails.log.debug("GET", options);
        var url = gurl+api+"?key="+apikey
        
        sails.log.debug("galaxyGET",url);
        
        request(url, function (err, response, body) {
            //sails.log('error',err, 'response',typeof body, response && response.statusCode,url);

            if (err !== null) {
                cb(body,err);
                return;
            }
            cb(JSON.parse(body),err);
        });
    },
    /* send JSON POST request to galaxy server
     * 
     * @param {type} api - e.g. "/api/workflows"
     * @param {type} params - json parameter i.e. {a:1,b:2}
     * @param {type} cb - callback function cb(retval)
     * 
     * retval return {status: x, data:y}
     */
    galaxyPOST: function(api,params,cb) {

        var g = sails.config.globals.jbrowse;
        var gurl = g.galaxy.galaxyUrl;
        var apikey = g.galaxy.galaxyAPIKey;

        var pstr = JSON.stringify(params);

        var url = gurl+api+"?key="+apikey; 
        var headers = {
              'Content-Type': 'application/json'
//            'Connection': 'keep-alive'
//            'Accept-Encoding' : 'gzip, deflate',
//            'Accept': '*/*',
//            'Accept-Language' : 'en-US,en;q=0.5',
//            'Content-Length' : pstr.length
        };

        sails.log.debug("galaxyPOST",url,params,headers);

        //var request = require('request');
        request({
            //headers: headers,
            url:     url,
            method: 'POST',
            json: true,
            body:    params
        }, function(err, response, body){
              cb(body,err);
        });
    },
    getHistoryId: function() {
        return this.historyId;
    },
    getHistoryName: function() {
        return this.historyName;
    },
    /**
     * acquire history id from galaxy
     * @returns {undefined}
     */
    initHistory: function (cb) {
        sails.log("init_history");
        var thisb = this;
        
        var g = sails.config.globals.jbrowse;
        this.historyName = g.galaxy.historyName;
        
        this.galaxyGET('/api/histories',function(histlist,err) {
            //sails.log.debug('histlist',histlist);
            if (err !== null) {
                var errmsg = 'init_history failed - is galaxy running?';
                sails.log.error(errmsg);
                cb(histlist,{status:'error',msg:errmsg,err:err});
                return;
            }
            for(var i in histlist) {
                //sails.log.debug("historylist[i].name",histlist[i].name,thisb.historyName);
                if (histlist[i].name === thisb.historyName) {
                    thisb.historyId = histlist[i].id;
                    sails.log.info('Galaxy History: "'+thisb.historyName+'"',thisb.historyId);
                    cb({
                        historyName:thisb.historyName,
                        historyId:thisb.historyId
                    },null);
                    return;
                }
            }
            var errmsg = "id not found for "+thisb.historyName;
            sails.log.error(errmsg);
            cb(histlist,{status:'error',msg:errmsg});
        });
    },
    getWorkflows: function(cb) {
        
        this.galaxyGET("/api/workflows",function(workflows,err) {
            if (err !== null) {
                sails.log.error('GET /api/workflows failed');
            }
            cb(workflows,err);
        });
    },
    /**
     * 
     * @param {type} theFile
     * @param {type} hId
     * @param {type} cb
     * @param {type} cberr
     * @returns {undefined}
     */
    sendFile: function(theFile,hId,cb) {
        sails.log.debug("sendFile",theFile,hId);
        var params = 
        {
            "tool_id": "upload1",
            "history_id": hId,   // must reference a history
            "inputs": {

                "dbkey":"?",
                "file_type":"auto",
                "files_0|type":"upload_dataset",
                "files_0|space_to_tab":null,
                "files_0|to_posix_lines":"Yes",
                "files_0|url_paste":theFile
            }
        };
        sails.log.debug("params",params);
        //var strParams = JSON.stringify(params)
        this.galaxyPOST('/api/tools',params,function(data,err) {
            if (err !== null) {
                sails.log.error('POST /api/tools failed');
            }
            cb(data,err);
        });

    },
    workflowSubmit: function(params,cb) {
        var thisb = this;
        var g = sails.config.globals;
        var region = params.region;
        var workflow = params.workflow;
        var dataSetPath = params.dataSetPath;
        var monitorFn = params.monitorFn;

        sails.log.debug("1 workflow",workflow);

        // get starting coord of region
        var startCoord = util.getRegionStart(region);
        var seq = util.parseSeqData(region);

        var d = new Date();

        //sails.log.debug('g.jbrowse',g.jbrowse);

        // write the BLAST region file
        var theBlastFile = "blast_region"+d.getTime()+".fa";
        var blastPath = g.jbrowse.jbrowsePath + dataSetPath +'/'+ g.jbrowse.jblast.blastResultPath;
        var theFullBlastFilePath = blastPath+'/'+theBlastFile; 

        // if direcgtory doesn't exist, create it
        if (!fs.existsSync(blastPath)){
            fs.mkdirSync(blastPath);
        }  

        try {
            ws = fs.createWriteStream(theFullBlastFilePath);
            ws.write(region);
            ws.end();
        }
        catch (e) {
            sails.log.error(e,theFullBlastFilePath);
            cb(null,{status: 'error', msg: "failed to write",err:e});
            return;
        }

        var blastData = {
                "name": "JBlast", 
                "blastSeq": theFullBlastFilePath,
                "offset": startCoord
        };

        var theFile = g.jbrowse.jbrowseURL + dataSetPath+'/' + g.jbrowse.jblast.blastResultPath+'/'+theBlastFile;

        // create the kue job entry
        var jobdata = {
            name: "Galaxy workflow",
            requestParams: params, 
            jbrowseDataPath: dataSetPath,
            sequence: seq,
            blastData: blastData,
            dataset: {
                workflow: workflow,
                file: theFile
            }
        };
        var job = g.kue_queue.create('galaxy-workflow-watch', jobdata)
        .save(function(err){
            if (err) {
                cb(null,{status:'error',msg: "error create kue galaxy-workflow-watch",err:err});
                return;
            }
            cb({status:'success',jobId: job.id},null);

            // process job
            g.kue_queue.process('galaxy-workflow-watch', function(kJob, kDone){
                kJob.kDoneFn = kDone;
                sails.log.info("galaxy-workflow-watch job id = "+kJob.id);

                kJob.progress(0,10,{file_upload:0});

                // send the file
                sails.log.info("uploading file to galaxy",theFile)

                thisb.sendFile(theFile,thisb.historyId, function(data,err) {

                    if (err !== null) {
                        var msg = "Error sendFile";
                        sails.log.error(msg,err);
                        return kDone(new Error(msg));;
                    }

                    //sails.log.debug("sendFile complete data,err",data,err);
                    kJob.data.dataset = data;
                    kJob.save();

                    kJob.progress(1,10,{file_upload:'done'});


                    var fileId = data.outputs[0].id;

                    var params = {
                        workflow_id: kJob.data.requestParams.workflow,
                        history: 'hist_id='+thisb.historyId,
                        ds_map: {
                            "0": {
                                src: 'hda',
                                id: fileId
                            }
                        }
                    };
                    // submit the workflow
                    thisb.galaxyPOST('/api/workflows',params,function(data,err) {

                        if (err !== null) {
                            var msg = "Error run workflow";
                            sails.log.error(msg,err);
                            return kDone(new Error(msg));
                        }

                        //sails.log.debug('POST /api/workflows completed',data,err);

                        kJob.data.workflow = data;
                        kJob.save();

                        thisb.galaxyGET('/api/workflows',function(data,err){
                            //sails.log.debug('GET /api/workflows',data,err);

                            for(var i in data) {
                                var wf = data[i];
                                if (wf.id === kJob.data.requestParams.workflow) {
                                    sails.log.info("Workflow starting: "+wf.name+' - '+wf.id);
                                    kJob.data.workflow.name = wf.name;
                                    kJob.data.name = "Galaxy workflow: "+wf.name;
                                    kJob.save();

                                    kJob.progress(2,10,{start_workflow:'done'});

                                    // start monitoring the workflow, kDone is called within.
                                    monitorFn(kJob);
                                    return;
                                }
                            }
                            // if we get here, somethings wrong
                            var errmsg = 'failed to match workflow id '+kJob.data.requestParams.workflow;
                            sails.log.error(errmsg);
                            return kDone(new Error(msg));
                        });
                    });
                });
            });
        });
    }
};
