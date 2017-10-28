/**
 * @module
 * @description
 * This module implements the various REST APIs for JBlast.  
 */
var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var postAction = require('./postAction');
var filter = require("./filter");   // filter processing
var galaxy = require("./galaxyUtils");
var util = require("./utils");
//var prettyjson = require('prettyjson');   // for debugging

// test

module.exports = {

    /**
     * Initialize the service
     * @param {type} cb
     * @returns {undefined}
     */
    initialize: function(cb) {
        sails.log('>>> jblastProc.initialize');
        
        // TODO: check that galaxy is running

        /*
        galaxy.init(function(history) {

            historyId = history.historyId;

        }, function(err) {
            sails.log.error("failed galaxy.init",err);
        });
        */
        sails.on('hook:orm:loaded', function() {
        //sails.on('lifted', function() {
            sails.log(">>> jblastProc.initialize.lifted");
            // do something after hooks are loaded
            
            // test workflow add service
            var service = {
                name:   'entrez_service',
                type:   'service',
                module: 'jblast',
                handler: entrezService                    
            };
            
            Service.addService(service,function(result){

                return cb();
            });
            // test workflow add service
            /*
            var service = {
                name:   'galaxy_blast',
                type:   'workflow',
                module: 'jblast',
                handler: galaxyService                    
            }
            
            Service.addService(service,function(result){

                return cb();
            });
            */
           
            // test workflow add service
            var service = {
                name:   'ncbi_blast',
                type:   'workflow',
                module: 'jblast',
                handler: basicWorkflowService                    
            };
            
            Service.addService(service,function(result){

                return cb();
            });
            
            
            //return cb();
        });
    },
    /**
     * Submit a workflow
     * 
     * REST: ``POST /jbapi/workflowsubmit``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    workflowSubmit: function (req, res, next) {
        sails.log.info("JBlast POST /jbapi/workflowsubmit",req.body);
        var params = {
          region:           req.body.region,
          workflow:         req.body.workflow,
          dataSetPath:      req.body.dataSetPath,
          monitorFn:        postAction.monitorWorkflow
        };
        galaxy.workflowSubmit(params,
          function(data,err) {
              if (err !== null) {
                  sails.hooks['jbcore'].resSend(res,err);
              }
              sails.hooks['jbcore'].resSend(res,data);
          });
    },
    /**
     * Get Workflows
     * 
     * REST: ``GET /jbapi/getworkflows``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    getWorkflows: function (req, res, next) {
          sails.log("JBlast GET /jbapi/getworkflows");

          galaxy.galaxyGET("/api/workflows",function(workflows,err) {
              if (err !== null) {
                  return res.send({status:'error',msg:"galaxy GET /api/workflows failed",err:err});
              }
              return res.send(workflows);
          });
    },
    /** post /jbapi/setfilter - send filter parameters
     * 
     * @param {type} req
     *    * data = req.body
     *    * data.filterParams = {score:{val: 50}, evalue:{val:-2}...
     *    * data.dataSet = (i.e. "sample_data/json/volvox" generally from config.dataRoot)
     *    * data.asset = 
     * @param {type} res
     * @param {type} next
     */

    setFilter: function (req, res, next) {
        sails.log.info("JBlast","POST /jbapi/setfilter",req.body);
        rest_applyFilter(req,res);
    },
    /**
     * Get info about the given track
     * 
     * REST: ``GET /jbapi/getblastdata``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    getBlastData: function (req, res, next) {
        sails.log.info("JBlast","/jbapi/getblastdata");
        rest_applyFilter(req,res);
    },
    /**
     * Get Track Data
     * 
     * REST: ``GET /jbapi/gettrackdata``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    getTrackData: function (req, res, next) {
          sails.log("JBlast /jbapi/gettrackdata called");
          var params = req.allParams();
          sails.log('asset',req.param('asset'));
          sails.log('dataset',req.param('dataset'));
          //sails.log('req.allParams()',req.allParams());

          var asset = req.param('asset');
          var dataset = req.param('dataset');

          var g = sails.config.globals.jbrowse;

          //var gfffile = g.jbrowsePath + dataset +'/'+ g.jblast.blastResultPath + '/' + 'sampleResult.gff3';
          var gfffile = g.jbrowsePath + dataset + '/'+ g.jblast.blastResultPath + '/' + asset +'.gff3';

          try {
              var content = fs.readFileSync(gfffile);
          }
          catch (err) {
              var str = JSON.stringify(err);
              //var str = str.split("\n");
              sails.log.error("failed to retrieve gff3 file",str);
              return sails.hooks['jbcore'].resSend(res,{status: 'error', msg: str, err:err});
          };

          return res.send(content);
    },
    /**
     * Return hits data given hit key
     * 
     * REST: ``GET /jbapi/gethitdetails called``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    getHitDetails: function (req, res, next) {
          sails.log("JBlast /jbapi/gethitdetails called");
          // TODO: handle errors
          rest_getHitDetails(req,res,function(hitData,err) {
              return res.send(hitData);
          });
    },
    /**
     * returns accession data given accesion number.
     * Utilizes Entrez service
     * 
     * REST: ``GET /jbapi/lookupaccession``
     * 
     * @param {type} req
     * @param {type} res
     * @param {type} next
     */
    lookupAccession: function (req, res, next) {
        sails.log("JBlast /jbapi/lookupaccession called");

        function accessionLookup(req,res) {
            this.accession.lookup(req,res,function(data,err) {
                res.send(data);
            });
            
        }
        // load accession module only on first time call
        if (typeof this.accession === 'undefined') {
            
            var g = sails.config.globals.jbrowse;
            var accModule = g.accessionModule;

            if (typeof accModule === 'undefined') accModule = "./accessionEntrez";

            this.accession = require(accModule);
            
            this.accession.init(req,res,function() {
                accessionLookup(req,res);
            });
        }
        else {
            accessionLookup(req,res);
        }
    }

};

/*
 * Process REST /jbapi/gethitdetails
 */

function rest_getHitDetails(req,res, cb) {
    var asset = req.param('asset');
    var hitkey = req.param('hitkey');
    var dataset = req.param('dataset');
    filter.getHitDetails(hitkey, dataset, asset, function(hitData) {
       cb(hitData); 
    });
};

/*
 * 
 */
function rest_applyFilter(req,res) {
    sails.log.debug("rest_applyFilter()");
    var g = sails.config.globals;
    var requestData = req.body;

    // get /jbapi/getdata is used then the asset and dataset will be in th params, so extract them.
    var asset = req.param('asset');
    var dataSet = req.param('dataset');

    if (typeof asset !== 'undefined') requestData.asset = asset;
    if (typeof dataSet !== 'undefined') requestData.dataSet = dataSet;
    
    sails.log.debug("requestData",requestData);

    var err = filter.writeFilterSettings(requestData,function(filterData) {
        filter.applyFilter(filterData,requestData,function(data) {
    
            return res.send(data);
        });
    });
    if (err) {
        return res.send({status:'error',err:err});
    }
};
    
