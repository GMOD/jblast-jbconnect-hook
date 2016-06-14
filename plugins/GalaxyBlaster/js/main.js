/* 
    JBrowse Galaxy Blaster - Client Side Plugin X

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
        
        // setup additional functions (necessary?)
        //browser.subscribeToChannel = ext_subscribeToChannel;
        //browser.initNotifications = ext_initNotifications;


        // subscribe to server track events
        io.socket.on('jbtrack', function (event){
            console.log("msg "+event.data.msg);
            console.dir(event.data);

            var data = event.data.value;

            if (typeof event.data.msg === 'undefined') return;
            
            var newTrackHandler = function (eventType) {
                //return function (message) {
                    
                    console.log("trackhandler "+eventType);
                    var notifyStoreConf = dojo.clone (data);
                    var notifyTrackConf = dojo.clone (data);
                    notifyStoreConf.browser = browser;
                    notifyStoreConf.type = notifyStoreConf.storeClass;
                    notifyTrackConf.store = browser.addStoreConfig(undefined, notifyStoreConf);
                    browser.publish ('/jbrowse/v1/v/tracks/' + eventType, [notifyTrackConf]);
                //}
            }

            switch(event.data.msg) {
                case "track-new":
                    newTrackHandler ('new');
                    break;
                case "track-replace":
                    newTrackHandler ('replace');
                    break;
                case "track-delete":
                    browser.publish ('/jbrowse/v1/v/tracks/delete', browser.trackConfigs);
                    break;
                case "track-test":
                    if (event.data.msg==="track-test") {
                        console.log("event track-test "+event.data.value);
                        alert("event track-test value = "+event.data.value)
                    }
                    break;
                default:
                    break;
            }
            
        });            
        io.socket.get('/jbtrack', function gotResponse(body, response) {
          console.log('Current test: ', body);
        });            


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
        // setup goto button for features
        browser.afterMilestone( 'initView', function() {
            
            browser.blastGoto = function(obj) {
                //alert($(obj).attr('blastkey'));
                $('#blastPanel').openMbExtruder(true);$('#blastPanel').openPanel();
                var i = '#'+$(obj).attr('blastkey');
                console.log(i);
                console.log($(i).html());
                $('#j-blast').animate({
                    scrollTop: $(i).position().top
                }, 500);
            };
        });
        
    }
});
});

/**
 * Initialize notification subscriptions
 */
function ext_subscribeToChannel(channel,listener) {
    var thisB = this;
    var channelPrefix = thisB.config.notifications.channel || "";
    return thisB.fayeClient.subscribe (channelPrefix + channel, listener)
        .then (function() {
            console.log ("Subscribed to " + channelPrefix + channel + " at " + thisB.config.notifications.url);
        })
}

function ext_initNotifications() {
    var thisB = this;
    return thisB._milestoneFunction('initNotifications', function( deferred ) {
        if ("notifications" in thisB.config) {
            thisB.fayeClient = new Faye.Client (thisB.config.notifications.url,
                            thisB.config.notifications.params || {});
            deferred.resolve ({success:true});
            // try subscribing to /log first; wait until this succeeds before subscribing to all the others
            thisB.subscribeToChannel ('/log', function(message) {
                console.log (message);
            }).then (function() {
                var newTrackHandler = function (eventType) {
                    return function (message) {
                        var notifyStoreConf = dojo.clone (message);
                        var notifyTrackConf = dojo.clone (message);
                        notifyStoreConf.browser = thisB;
                        notifyStoreConf.type = notifyStoreConf.storeClass;
                        notifyTrackConf.store = thisB.addStoreConfig(undefined, notifyStoreConf);
                        thisB.publish ('/jbrowse/v1/v/tracks/' + eventType, [notifyTrackConf]);
                    }
                }

                thisB.subscribeToChannel ('/tracks/new', newTrackHandler ('new'))
                thisB.subscribeToChannel ('/tracks/replace', newTrackHandler ('replace'))

                thisB.subscribeToChannel ('/tracks/delete', function (trackConfigs) {
                    thisB.publish ('/jbrowse/v1/v/tracks/delete', trackConfigs);
                })

                thisB.subscribeToChannel ('/alert', alert)

                thisB.passMilestone( 'notificationsConnected', { success: true } );
            });

        } else {
            deferred.resolve ({success:false});
        }
    });
}
