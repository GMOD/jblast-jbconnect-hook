/* 
    JBrowse Galaxy Blaster - Client Side Plugin

    Created on : Mar 20, 2016, 6:38:33 PM
    Author     : ey
*/

define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/Deferred',
        'dojo/dom-construct',
        'dojo/query',
        'JBrowse/Plugin'
       ],
       function(
        declare,
        lang,
        Deferred,
        domConstruct,
        query,
        JBrowsePlugin
       ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {
        console.log("plugin: GalaxyBlaster");
        //console.dir(args);

        var thisB = this;
        var browser = this.browser;

        /*
        dojo.subscribe("/jbrowse/v1/v/tracks/show", function(data){
            console.log("GalaxyBlaster trapped /jbrowse/v1/v/tracks/show");
            console.dir(data);
        });
        */
        // trap the redraw event for handling resize
        /*
        dojo.subscribe("/jbrowse/v1/n/tracks/redraw", function(data){
            console.dir(browser.view.tracks);
            for (var i in browser.view.tracks) {
                console.log(browser.view.tracks[i].labelHTML);
                console.log(browser.view.tracks[i].config.menuTemplate);
            }
        });
        */
        // create function intercept after view initialization (because the view object doesn't exist before that)
        browser.afterMilestone( 'loadConfig', function() {
            
            require(["dojo/_base/lang", "JBrowse/View/FASTA"], function(lang, FASTA){
                /*
                lang.extend(FASTA, {
                    renderHTML: function( region, seq, parent ) {
                        console.log("intercept renderHTML()");
                        console.dir(this);
                        //return this.old_renderHTML( region, seq, parent );
                    }
                    
                });
                */
            });
        });
        // create function intercept after view initialization (because the view object doesn't exist before that)
        browser.afterMilestone( 'loadConfig', function() {
            if (typeof browser.config.classInterceptList === 'undefined') {
                browser.config.classInterceptList = {};
            }
            
            // override ProcessedTranscripts
            browser.config.classInterceptList["ProcessedTranscript"] = [function(obj) {
	    	console.log("intercepting ProcessedTranscript");
                obj._getFeatureHeight = function() {
                    return 11;
                };
            }];
        });      
    }
});
});
