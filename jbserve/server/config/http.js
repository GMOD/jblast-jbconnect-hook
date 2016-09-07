/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */

module.exports.http = {

    // custom middleware (body-parser) for jbrowse for handling CORS
    // reference: http://sailsjs.org/documentation/concepts/middleware
    
    customMiddleware: function (app) {
        console.log("config of Middleware config/http.js for jbrowse");
        
        var express = require('express');
	
        // setup jbrowse route
        // todo: make this configurable in globals.js 
	app.use(express.logger());
	app.use(express.compress());
	app.use('/jbrowse', express.static('/var/www/html/jb-galaxy-blaster/'));

        
        // setup kue and kue-ui
        var g = sails.config.globals;

        g.kue = require('kue');
        g.kue_ui = require('kue-ui');
        g.kue_queue = g.kue.createQueue();
        
        g.kue_ui.setup({
            apiURL: '/api', // IMPORTANT: specify the api url
            baseURL: '/kue', // IMPORTANT: specify the base url
            //updateInterval: 5000 // Optional: Fetches new data every 5000 ms
        });
/*  
        // handle cross-origin - CORS
        app.all('/', function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "X-Requested-With");
          next();
         });    
*/ 
        // for handling POST requests - JSON bodies
        var bodyParser = require('body-parser')
        app.use( bodyParser.json() );       // to support JSON-encoded bodies
        app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
          extended: true
        }));
        
        var cors = require('cors');
        app.use(cors());        
        
        // These are used for kue testing and diagnostics - disable for production
        app.use('/api', g.kue.app);
        app.use('/kue', g.kue_ui.app);
        
        
        
        /* for debugging
        app.use(function (req, res, next) {
          console.log("installed customMiddleware is used");
          next();
        })
        */
    }
  /****************************************************************************
  *                                                                           *
  * Express middleware to use for every Sails request. To add custom          *
  * middleware to the mix, add a function to the middleware config object and *
  * add its key to the "order" array. The $custom key is reserved for         *
  * backwards-compatibility with Sails v0.9.x apps that use the               *
  * `customMiddleware` config option.                                         *
  *                                                                           *
  ****************************************************************************/

   //middleware: {

  /***************************************************************************
  *                                                                          *
  * The order in which middleware should be run for HTTP request. (the Sails *
  * router is invoked by the "router" middleware below.)                     *
  *                                                                          *
  ***************************************************************************/

    // order: [
    //   'startRequestTimer',
    //   'cookieParser',
    //   'session',
    //   'myRequestLogger',
    //   'bodyParser',
    //   'handleBodyParserError',
    //   'compress',
    //   'methodOverride',
    //   'poweredBy',
    //   '$custom',
    //   'router',
    //   'www',
    //   'favicon',
    //   '404',
    //   '500'
    // ],

  /****************************************************************************
  *                                                                           *
  * Example custom middleware; logs each request to the console.              *
  *                                                                           *
  ****************************************************************************/

    // myRequestLogger: function (req, res, next) {
    //     console.log("Requested :: ", req.method, req.url);
    //     return next();
    // }


  /***************************************************************************
  *                                                                          *
  * The body parser that will handle incoming multipart HTTP requests. By    *
  * default as of v0.10, Sails uses                                          *
  * [skipper](http://github.com/balderdashy/skipper). See                    *
  * http://www.senchalabs.org/connect/multipart.html for other options.      *
  *                                                                          *
  ***************************************************************************/

    // bodyParser: require('skipper')

  // },

  /***************************************************************************
  *                                                                          *
  * The number of seconds to cache flat files on disk being served by        *
  * Express static middleware (by default, these files are in `.tmp/public`) *
  *                                                                          *
  * The HTTP static cache is only active in a 'production' environment,      *
  * since that's the only time Express will cache flat-files.                *
  *                                                                          *
  ***************************************************************************/

  // cache: 31557600000
};
