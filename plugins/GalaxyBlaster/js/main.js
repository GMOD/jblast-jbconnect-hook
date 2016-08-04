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
        console.log("plugin: JBlast");
        //console.dir(args);

        var thisB = this;
        var browser = this.browser;
        
        // save the reference to the blast plugin in browser
        browser.blastPlugin = this;
        
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
            console.log('initView milestone');
            
            // setup goto button for features (depricated)
            browser.blastGoto = function(obj) {
                //alert($(obj).attr('blastkey'));
                $('#blastPanel').openMbExtruder(true);$('#blastPanel').openPanel();
                var i = '#'+$(obj).attr('blastkey');
                var item = $(i).parent();
                console.log("blast goto", i, item.position().top);
                $('#j-blast').animate({
                    scrollTop: item.position().top
                }, 500);
                setTimeout(function() {
                    $(i).collapse('show');
                },1000);
            };
            
            // process blast filter button "GO" in blast panel (obsolete)
            $('#blast-filter-go').click(function() {
                obj = thisB.findObjNested(browser.config,"blastData");
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
                    //setTimeout(function(){
                    //    $('.blast-item').trigger('click');
                    //},300);
                    
                }
            });
            
            setTimeout(function() {
                //thisB.insertBlastPanel();
                thisB.featureDetailMonitor();
            },500);
            
        });

        browser.afterMilestone( 'loadConfig', function() {
            
            //  todo: need to fix. we should load data in HTMLFeatures constructor
            // load blast data from blast track config
            obj = thisB.findObjNested(browser.config,"blastData");
            
            if (Array.isArray(obj)) {
                
                // todo: handle more than one blast dataset
                //console.log("blastData obj",obj[0]);
                thisB.blastReadJSON(obj[0],function() {
                    console.log("blastData",browser.blastData);
                    //createTestFilter("Hsp_bit-score",20);
                    thisB.gotBlastData();
                });
                
            }
            
        });
        dojo.subscribe("/jbrowse/v1/v/tracks/hide", function(data){

            // detect unselected track and remove blast panel stuff
            if (typeof data[0].blastData !== 'undefined') {
                //$('#blast-filter-group').remove();
                //$('#blast-filter-open-btn').remove();
            }
        });        
        
    },
    // initial the blast track, called in HTMLFeatures constructor
    initBlastTrack: function(blastData,blastTrackConfig) {
        //this.blastReadJSON(blastData,function() {
            //this.gotBlastData();
            //console.log('blastData', blastData,'blastTrackConfig',blastTrackConfig);
            this.browser.blastTrackConfig = blastTrackConfig;
            this.browser.blastKey = blastTrackConfig.label;
            this.insertBlastPanel();
            this.blastRenderData();
        //});
    },
        // retrieve blast data json into this.blastData  (this is obsolete)
    blastReadXML: function(args) {
        console.log("BLAST READ XML");
        //console.log(this,args);
        var thisB = this;
        
        this.blastData = 0;
        
        var blastDataFile = this.config.blastData;
        if (typeof blastDataFile !== "undefined") {
            dojo.xhrGet({
                url: this.config.baseUrl+blastDataFile,
                handleAs: "json",
                load: function(obj) {
                    thisB.blastData = obj;
                    console.log(blastDataFile,thisB.blastData);
                    thisB.blastRenderData();
                },
                error: function(err) {
                    console.log(err);
                }
            });            
        }
    },
    // render data into blast panel (bottom panel)
    blastRenderData: function() {
        var thisB = this;
        var browser = this.browser;
        var obj = browser.blastData;
        //console.log("blastRenderData");
        
        //var blastDataFile = this.config.blastData;
        
        // save blast track - temporary solution
        //if (typeof blastDataFile !== "undefined") {
        //    browser.blastTrack = this;
        //}
        
        //var hits = obj.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        
        //var hits = browser.blastData;
        var hits = browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;

        // clearout the blast panel accordion
        
        $('#blast-accordion').html('');

        //var txt = "";
        //console.log("hits",hits);
        setTimeout(function() {
            console.log("rendering blast accordion");
            for (var x in hits) {
                //console.log("accordion item", hit)
                var key = hits[x].key;

                // display only filtered results.
                if (hits[x].selected==1) {
                    //console.log("add to panel",hits[x]);
                    var summary = thisB.blastRenderSummary(hits[x]);
                    blast_addPanel(key,hits[x].Hit_def,summary);
                }
            }
        },200);
        $('#blast-accordion').on('show.bs.collapse', function(e) {
            var key = $(e.target).attr('id');
            item = e.target;
            
            if (typeof key === 'undefined') {
                item = $('.panel-collapse',e.target);
                key = item.attr('id');
            }
            //console.log(e.target);
            var hit = browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit[key];
            console.log("expand hit",key,item);
            var txt = browser.blastPlugin.blastRenderHit(hit);
            txt += browser.blastPlugin.blastRenderHitBp(hit);
            
            $('.panel-body',item).html(txt);
        });
        
        // setup the feature tooltip
        // todo: this action should be triggered by the approrpiate event
        setTimeout(function() {
            // setup tooltip
            $('.blast-feature').each(function() {
                var key = $(this).attr('blastkey');
                var hit = browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit[key];
                //console.log('key-hit ',key,hit);
                
                var text = '<div>'+browser.blastPlugin.blastRenderHit(hit); //+'<button class="btn btn-primary" blastkey="'+key+'"onclick="JBrowse.blastGoto(this)">Goto</button></div>';
                
                $(this).qtip({
                    content: {
                        text: text,
                        title: hit.Hit_def
                    },
                    style: {
                        classes: 'blastQtip qtip-tipped', //'qtip-tipped' 'ui-tooltip-blue
                        width: "400px"
                    },
                    position: { // tooltip shows up near mouse
                        //target: 'mouse'
                        // language: 'my' tooltip positioned 'at' position of target 
                        my: 'top left',
                        at: 'bottom left'
                    },
                    hide: {     // allow mouse to move into tip
                        //event:'unfocus'
                        delay: 500,
                        fixed: true
                    }
                });
                
                //$(this).mouseover(function() {
                //    var key = $(this).attr('blastkey');
                    //$('#test-test').html(key);
                //});
            });            
        },1000);
        
    },
    // monitor feature detail popup and insert blast data when necessary
    // todo: should trigger on the appropriate event
    featureDetailMonitor: function() {
        var thisB = this;
        var blastPlugin = this.browser.blastPlugin;
        var lastBlastKey = "";
        setInterval(function(){
            var blastShow = 0;
            var blastField = $('div.popup-dialog div.feature-detail h2.blasthit')[0];
            
            if (typeof blastField !== 'undefined') blastShow = $(blastField).attr('blastshown');
            
            //console.log("monitor",blastField,blastShow,typeof blastShow);
            
            if (typeof blastField !== 'undefined') {// && blastShow !== '1') {
                //$(blastField).attr('blastshown',1);
                var blastKey = $('div.popup-dialog div.feature-detail div.value_container div.blasthit').html();
                if (blastKey !== lastBlastKey) {
                    console.log("new blast dialog key = "+blastKey);
                    var regionObj = $('div.popup-dialog div.feature-detail div.field_container h2.feature_sequence');
                    var rObjP = $(regionObj).parent();
                    //console.log(regionObj,rObjP);
                    var hasBlastDetail = $('#blastDialogDetail');
                    //console.log('blastDialogDetail',$('#blastDialogDetail').length);
                    if ($('#blastDialogDetail').length==0) {
                        console.log('blastDialogDetail created');
                        $('<div id="blastDialogDetail">BLAST</div>').insertBefore(rObjP);
                        
                        var blastContent = "";
                        var blastData = thisB.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
                        var hit = blastData[blastKey];
                        console.log('hit',hit);
                        setTimeout(function() {
                            blastContent += '<h2 class="blastDetailTitle sectiontitle">BLAST Results</h2>';
                            blastContent += '<div class="blastDialogContent">';
                            blastContent += '<span class="blast-desc-view">'+hit.Hit_def+'</span><br/>';
                            blastContent += blastPlugin.blastRenderHit(hit);
                            blastContent += blastPlugin.blastRenderHitBp(hit);
                            blastContent += '</div>';
                            $('#blastDialogDetail').html(blastContent);
                        },100);
                    }
                }
            }
            
        },1000);
    },
    // this renders the summary information for the hit
    blastRenderHit: function(hit){
        //console.log("blastRenderHit",hit);
        var txt = '';
        
        txt += '<span class="blast-data-view">Sequence ID: '+hit.Hit_id+' Length: '+hit.Hit_len+' Matches: '+hit.Hit_count+'</span>';
        //txt += '<div class="CSSTableGenerator">';
        txt += '<div class="blast-table-view">'
        txt += '<table class="CSSTableGenerator " style="width:100px"><tr id="head">';
        txt +=    '<td>Score</td>';
        txt +=    '<td>Expect</td>';
        txt +=    '<td>Identities</td>';
        txt +=    '<td>Gaps</td>';
        //txt +=    '<td>Strand</td>';
        txt += '</tr><tr>';
        txt +=    '<td>'+hit.Hsp['Hsp_bit-score']+'('+hit.Hsp.Hsp_score+')</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_evalue+'</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_identity+'/'+hit.Hsp['Hsp_align-len']+'</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_gaps+'/'+hit.Hsp['Hsp_align-len']+'</td>';
        //txt +=    '<td>'+hit.Hsp['Hsp_query-strand']+'/'+hit.Hsp['Hsp_hit-strand-len']+'</td>';
        txt += '</tr></table>';
        txt += '</div>'
        //txt += '</div>'
        
        return txt;
    },
    // this renders the query/subject table of the details
    // it also draws the coordinate 
    blastRenderHitBp: function(hit){
        
        var coordHstr = repeatChar(hit.Hsp.Hsp_hseq.length," ");    //"┬"
        var coordQstr = repeatChar(hit.Hsp.Hsp_hseq.length," ");    //"┴"
        var len = hit.Hsp['Hsp_align-len'];
        //console.log("hitlen",len,hit);
        
        var coordHbase = 0;
        var coordH = parseInt(hit.Hsp['Hsp_hit-from']);
        var coordQbase = 0;
        var coordQ = parseInt(hit.Hsp['Hsp_query-from']);
        
        var inc = 20;       // draw coord every (inc) base pairs.
        for(var i = 0; i < len;i += inc) {
            coordHstr = overwriteStr(coordHstr,coordHbase+i,"├"+(coordH+i));
            coordQstr = overwriteStr(coordQstr,coordQbase+i,"├"+(coordQ+i));
        }
    
        // use a monospace font
        // todo: move styles out to the CSS file
        var txt = '';
        txt += '<div class="blast-bp-view" style="font-family: monospace;white-space:pre; width:100%;overflow:auto">';
        txt += '<span style="background-color:#eee">'+coordHstr+'</span><br/>';
        txt += hit.Hsp.Hsp_hseq + '<br/>';
        txt += hit.Hsp.Hsp_midline + '<br/>';
        txt += hit.Hsp.Hsp_qseq + '<br/>';
        txt += '<span style="background-color:#eee">'+coordQstr+'</span>';
        txt += '</div>';
        return txt;
    },
    // render blast summary (used in bottom blast panel)
    blastRenderSummary: function(hit) {
        var txt = '';
        txt +=  '<table  cellspacing="1" style="width:100%"><tr>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp['Hsp_bit-score']+'</td>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_evalue+'</td>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_identity+'</td>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_gaps+'</td>';
        txt += '</tr></table>';  
        return txt;
    },
    // this creates the side blast filter panel
    insertBlastPanel: function(postFn) {
        var thisB = this;
        console.log('reloc blast-filter-group');
        //relocate blast filter panel; put it in sidebar (this is from a template in BlastPanel.html)
        $('#blast-filter-group').prependTo('.jbrowseHierarchicalTrackSelector');
        thisB.setupFilterSliders();

        // setup button open button in the Available Tracks title
        $('.jbrowseHierarchicalTrackSelector > .header').prepend('<button id="blast-filter-open-btn" class="btn btn-primary">BLAST Filter</button>');

        setTimeout(function() {
            $('#blast-filter-group').show(500);
            $('#blast-filter-open-btn').click(function(){
                $('#blast-filter-group').slideDown(500);
                $('#blast-filter-open-btn').hide();
            });
        },500);
    },
    // filter hits based on scores
    lastVal: 0,
    scoreFilter: function(val){

        if (this.lastVal == val) return;
        this.lastVal = val;

        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;

        for(var x in blastData) {
            blastData[x].selected = 0;
            if (parseFloat(blastData[x].Hsp['Hsp_bit-score']) > val) blastData[x].selected = 1;
        }

        // toggle blast item
        // todo: toggle specific button based on currently selected
        var key = this.browser.blastKey;
        //var blastRef = $('.blast-item').attr('blastref');
        //console.log('compare',key,blastRef)
        //if (key == blastRef) {
            $(".blast-item[blastref*='"+key+"']").trigger('click');  "input[name*='man']"
            setTimeout(function(){
                $(".blast-item[blastref*='"+key+"']").trigger('click');
            },300);
        //}
    },
    //setup blast filter sliders
    setupFilterSliders: function() {
        var thisB = this;
        
        var hi = Math.ceil(this.getHighest('Hsp_bit-score'));
        var lo = Math.floor(this.getLowest('Hsp_bit-score'));
        console.log("score hi/lo",lo,hi);

        var startPos = Math.round((hi - lo) * .8) + lo; // 80%

        // setup sliders
        $("#slider-score").slider({
            min: lo,
            max: hi,
            change: function(event,ui) {
                var v = ui.value;
                $('#slider-score-data').html(v);
            }
        }).slider("pips").slider("float");
        /*
        setTimeout(function(){
            $('#slider-score .ui-slider-handle').on('mousemove',function(){
                var v = $('#slider-score').value;
                $('#slider-score-data').html(v);
            });
        },100);
        */
        var hi = this.getHighest('Hsp_evalue');
        var lo = this.getLowest('Hsp_evalue');
        var stp = (hi - lo) / 20;

        var labels1 = [];
        for(var i=lo;i <= hi; i += stp) {
            var v = i;
            v = v.toExponential(2);
            //var v1 = v.split('e');
            //v = v1[0]+' e'+v1[1];
            labels1.push(v);
        }

        var step = (hi - lo) / 5;
        var labels = [];
        for(var i=lo;i <= hi; i += step) {
            var v = i;
            v = v.toExponential(2);
            var v1 = v.split('e');
            v = v1[0]+' e'+v1[1];
            labels.push(v);
        }
        console.log(labels);

        $("#slider-evalue").slider({
            min: lo,
            max: hi,
            step:stp,
            change: function(event,ui) {
                var v = ui.value.toExponential(2);
                $('#slider-evalue-data').html(v);
            }
        }).slider("pips",{
            rest:'label',
            first:'label',
            last:'label',
            step: 4,
            labels: labels
        }).slider("float",{
            labels: labels1
        });

        var hi = Math.ceil(this.getHighest('Hsp_identity'));
        var lo = Math.floor(this.getLowest('Hsp_identity'));

        var step = (hi - lo) / 5;
        var labels = [];
        for(var i=lo;i <= hi; i += step) {
            labels.push(""+Math.round(i));
        }
        
        $("#slider-identity").slider({
            min: lo,
            max: hi,
            change: function(event,ui) {
                var v = ui.value;
                $('#slider-identity-data').html(v);
            }
        }).slider("pips",{
            rest:'label',
            first:'label',
            last:'label',
            step: step,
            labels: labels
        }).slider("float");

        var hi = Math.ceil(this.getHighest('Hsp_gaps'));
        var lo = Math.floor(this.getLowest('Hsp_gaps'));

        var step = (hi - lo) / 5;
        var labels = [];
        for(var i=lo;i <= hi; i += step) {
            labels.push(""+i);
        }

        $("#slider-gap").slider({
            min: lo,
            max: hi,
            change: function(event,ui) {
                var v = ui.value;
                $('#slider-gap-data').html(v);
            }
        }).slider("pips",{
            rest: 'label',
            first: 'label',
            last: 'label',
            step: step,
            labels: labels
        }).slider("float");

        // periodically scan slider value and rerender blast feature track
        setInterval(function() {
            var val = $('#slider-score').slider("option", "value");
            //console.log('textbox',val);
            thisB.scoreFilter(val);
        },3000);


        // process blast Filter button (toggle)
        $( "#blast-filter-close-btn" ).click(function() {
            $('#blast-filter-group').slideUp(500); 
            $('#blast-filter-open-btn').show();
        });    

    },
    // get the hightest value of the blast data variable
    getHighest: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = 0;
        for(var x in blastData) {
            //console.log(variable,blastData[x].Hsp[variable]);
            if (parseFloat(blastData[x].Hsp[variable]) > val)
                val = parseFloat(blastData[x].Hsp[variable]);
        }
        return val;
    },
    // get the lowest value of the blast data variable.
    getLowest: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            if (val = -1) val = parseFloat(blastData[x].Hsp[variable]);
            if (parseFloat(blastData[x].Hsp[variable]) < val)
                val = parseFloat(blastData[x].Hsp[variable]);
        }
        return val;
    },
    // blast data has been acquired, setup default filter.  (depricated)
    gotBlastData: function() {

        var browser = this.browser;
        // initial score filter (top 20)
        this.createTestFilter("Hsp_bit-score",20);


    },
    // a test filter to sorted (should be obsoleted)
    createTestFilter:function(value,num) {
        //console.log("createTestFilter",JBrowse.blastData);
        var blastData = JBrowse.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;

        var sorted = [];

        for(var x in blastData) {
            //var newItem = new Object();
            //newItem.key = x;
            //newItem.hit = blastData[x];
            if (num == 0)
                blastData[x].selected = 1;  // clear all selected
            else
                blastData[x].selected = 0;  // clear all selected
            sorted.push(blastData[x]);
        }

        // sort the list based on desired sort (value)
        function compare(a,b) {
            if (a.Hsp[value] < b.Hsp[value])
                return -1;
            if (a.Hsp[value] > b.Hsp[value])
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
    },
    // retrieve blast data json into this.blastData
    blastReadJSON: function(config,postFn) {
        var thisB = this;
        var browser = this.browser;
        console.log("BLAST READ XML in main");
        //console.log(this,args);
        //var thisB = JBrowse;

        browser.blastDataJSON = 0;
        browser.blastData = 0;

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
                    browser.blastDataJSON = obj;

                    //console.log("blastDataJSON "+blastDataFile,flist);
                    browser.blastData = flist;

                    postFn();
                },
                error: function(err) {
                    console.log(err);
                }
            });            
        }
    },
    // recursively find id in a node tree
    // find key in a complex object, recursive.  Returns the object list containing such key
    findObjNested: function(obj, key, memo) {
      var thisB = this;
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
            thisB.findObjNested(obj[i], key, memo);
          }
        }
      }

      return memo;
    }
});
});
