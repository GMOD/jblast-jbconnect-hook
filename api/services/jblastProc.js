/**
 * @module
 * @description
 * This module implements the various Galaxy REST APIs for JBlast.
 * It supports galaxyService job service.  
 * 
 * todo: remove obsolete functions.
 * 
 */
var request = require('request');
var requestp = require('request-promise');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var deferred = require('deferred');
var filter = require("./filter");   // filter processing
var galaxy = require("./galaxyUtils");
var util = require("./utils");
var sh = require("shelljs");

module.exports = {

    /**
     * Initialize the service
     * 
     * @param {type} cb - callback function
     * 
     */
    initialize: function(cb) {
        sails.log('>>> jblastProc.initialize');
        
        // TODO: check that galaxy is running

        sails.on('hook:orm:loaded', function() {
        //sails.on('lifted', function() {

            sails.log(">>> jblastProc.initialize.lifted");

            // copy sample data
            //console.log(">>>> cwd",process.cwd());
            sh.exec('./jbutil --setupdata');

            // do something after hooks are loaded
            return cb();
        });
    },
    /**
     * Submit a workflow
     * 
     * ``POST /jbapi/workflowsubmit``
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
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
     * ``GET /jbapi/getworkflows``
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
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
    /**
     * Return hits data given hit key
     * 
     * ``GET /jbapi/gethitdetails called``
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
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
     * ``GET /jbapi/lookupaccession``
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
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

