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
        browser.afterMilestone( 'initView', function() {
            
            // setup goto button for features
            browser.blastGoto = function(obj) {
                //alert($(obj).attr('blastkey'));
                $('#blastPanel').openMbExtruder(true);$('#blastPanel').openPanel();
                var i = '#'+$(obj).attr('blastkey');
                console.log("blast goto", i, $(i));
                $('#j-blast').animate({
                    scrollTop: $(i).position().top
                }, 500);
            };
            
            // process blast filter button "GO" in blast panel
            $('#blast-filter-go').click(function() {
                obj = findObjNested(browser.config,"blastData");
                if (Array.isArray(obj)) {
                    console.log("blast go btn",obj[0]);
                    //JBrowse.publish( '/jbrowse/v1/v/tracks/hide', [obj[0]] );
                    //browser.publish( '/jbrowse/v1/v/tracks/show', [obj[0]] );
                    
                    browser.blastFilter = $('#blast-filter-input').val();
                    
                    var filter = browser.blastFilter.split("/");
                    
                    switch(filter[0]) {
                        case "evalue":
                        case "bit-score":
                        case "gap":
                        case "identity":
                            break;
                        default:
                            filter[0] = "bit-score";
                    }
                    if (filter.length==1) filter[1] = 0;
                    else {
                        filter[1] = parseInt(filter[1]);
                        if (filter[1]=="NaN") filter[1] = 0;
                    }
                    console.log("filter",filter);
                    
                    // can contain bit-score,evalue,gap,identity
                    var filterText = "Hsp_" + filter[0];
                    var filterNum = filter[1];
                    createTestFilter(filterText,filterNum);
                    
                    $('#blast-accordion').html("");     // clearout the blast accordion
                    $('.blast-item').trigger('click');
                    setTimeout(function(){
                        $('.blast-item').trigger('click');
                    },300);
                }
            });
        });

        browser.afterMilestone( 'loadConfig', function() {
            
            // load blast data from blast track config
            obj = findObjNested(browser.config,"blastData");
            if (Array.isArray(obj)) {
                
                // todo: handle more than one blast dataset
                //console.log("blastData obj",obj[0]);
                blastReadJSON(obj[0],function() {
                    createTestFilter("Hsp_bit-score",20);
                    console.log("blastData",browser.blastData);
                });
            }
        });
        
    }
});
});

// a test filter to sorted
function createTestFilter(value,num) {
    //console.log("createTestFilter",JBrowse.blastData);
    var blastData = JBrowse.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
    
    var sorted = [];
    
    for(var x in blastData) {
        //var newItem = new Object();
        //newItem.key = x;
        //newItem.hit = blastData[x];
        if (num > 0)
            blastData[x].selected = 0;  // clear all selected
        sorted.push(blastData[x]);
    }
    
    // sort the list based on desired sort (value)
    function compare(a,b) {
        if (a.Hsp[value] > b.Hsp[value])
            return -1;
        if (a.Hsp[value] < b.Hsp[value])
            return 1;
        return 0;
    }

    sorted.sort(compare);
    
    
    // chop the list based on (num)
    if (num > 0) {
        var filtered = [];
        var count = num;

        for(var i in sorted) {
            if (count-- <= 0) continue; 
            //filtered[sorted[i].key] = sorted[i].hit;
            sorted[i].selected = 1; // mark selected
            filtered.push(sorted[i]);
        }
        // debug show results
        /*
        for(var i in filtered) {
            console.log(filtered[i].Hsp[value],filtered[i]);
        }
        */
        //console.log("filtered list",filtered);
        JBrowse.blastData = filtered;
    }
    return;
}

// retrieve blast data json into this.blastData
function blastReadJSON(config,postFn) {
    console.log("BLAST READ XML in main");
    //console.log(this,args);
    //var thisB = JBrowse;

    JBrowse.blastDataJSON = 0;
    JBrowse.blastData = 0;

    var blastDataFile = config.blastData;
    if (typeof blastDataFile !== "undefined") {
        dojo.xhrGet({
            url: config.baseUrl+blastDataFile,
            handleAs: "json",
            load: function(obj) {
                //blastRenderData();
                
                var hits = obj.BlastOutput.BlastOutput_iterations.Iteration.Hit;

                var flist = [];
                for(var i in hits) {
                    hits[i].key = i;
                    hits[i].selected = 1;
                    flist.push(hits[i]);
                }
                //console.log("blastDataJSON "+blastDataFile,obj);
                JBrowse.blastDataJSON = obj;
                
                //console.log("blastDataJSON "+blastDataFile,flist);
                JBrowse.blastData = flist;
                
                postFn();
            },
            error: function(err) {
                console.log(err);
            }
        });            
    }
}

// recursively find id in a node tree
// find key in a complex object, recursive.  Returns the object list containing such key
function findObjNested(obj, key, memo) {
  var i,
      proto = Object.prototype,
      ts = proto.toString,
      hasOwn = proto.hasOwnProperty.bind(obj);

  if ('[object Array]' !== ts.call(memo)) memo = [];

  for (i in obj) {
    if (hasOwn(i)) {
      if (i === key) {
        memo.push(obj);
      } else if ('[object Array]' === ts.call(obj[i]) || '[object Object]' === ts.call(obj[i])) {
        findObjNested(obj[i], key, memo);
      }
    }
  }

  return memo;
}
/**
 * Initialize notification subscriptions (keep for reference, for now)
 */
/*
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
*/