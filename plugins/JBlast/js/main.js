/* 
    JBlast - Client Side Plugin X

    Created on : Mar 20, 2016, 6:38:33 PM
    Author     : ey
*/

define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/Deferred',
        'dojo/dom-construct',
        'dojo/query',
        'JBrowse/Plugin',
           'dijit/form/Button',
           'dijit/Dialog',
           "dojo/store/Memory",
           "dijit/form/ComboBox",
            'dijit/Menu',
            'dijit/MenuItem',
           'JBrowse/has',
        './slidersMixin'
       ],
       function(
        declare,
        lang,
        Deferred,
        domConstruct,
        query,
        JBrowsePlugin,
        Button, Dialog, Memory, ComboBox,Menu,MenuItem,has,
        slidersMixin
       ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {
        console.log("plugin: JBlast");
        //console.dir(args);
        
        var thisB = this;
        var browser = this.browser;

        var sliders = new slidersMixin(this,browser);
        
        $.get("plugins/JBlast/BlastPanel.html", function(data){
            console.log("loaded BlastPanel.html");
            $('body').append(data);

            $("#extruderRight").buildMbExtruder({
                position:"right",
                width:300,
                extruderOpacity:.8,
                hidePanelsOnClose:true,
                accordionPanels:true,
                onExtOpen:function(){},
                onExtContentLoad:function(){
                    jobPanelInit();
                },
                onExtClose:function(){}
            });
        });            
        
        browser.jblast = {
            asset: null,
            focusQueue: [],
            focusQueueProc: 0,
            panelDelayTimer: null,
            filterSliders: {
                score: 0,
                evalue: 0,
                identity: 0,
                gaps: 0
            }
        };
        
        /*
         * class override function intercepts
         */
        browser.afterMilestone( 'loadConfig', function() {
            if (typeof browser.config.classInterceptList === 'undefined') {
                browser.config.classInterceptList = {};
            }
            // override _FeatureDetailMixin
            require(["dojo/_base/lang", "JBrowse/View/Track/_FeatureDetailMixin"], function(lang, _FeatureDetailMixin){
                lang.extend(_FeatureDetailMixin, {
                    extendedRender: function(track, f, featDiv, container) {
                        setTimeout(function() {
                            thisB.insertFeatureDetail(track);
                        },1000);
                    }
                });
            });
            
            // override FASTA
            require(["dojo/_base/lang", "JBrowse/View/FASTA"], function(lang, FASTA){
                lang.extend(FASTA, {
                    addButtons: thisB.FASTA_addButtons
                });
            });
            browser.jblastDialog = thisB.Browser_jblastDialog;
            
            
        }); 
        browser.afterMilestone( 'initView', function() {

            // setup right click menu for highlight region - for arbitrary region selection
            thisB.jblastRightClickMenuInit();
            
            // start filter panel hide/show queue, filter panel management
            thisB.startFocusQueue();

        });
        
        // save the reference to the blast plugin in browser
        browser.jblastPlugin = this;
        
        
        // event handlers for server events
        var newTrackHandler = function (eventType,data) {
            console.log("trackhandler "+eventType);
            var notifyStoreConf = dojo.clone (data);
            var notifyTrackConf = dojo.clone (data);
            notifyStoreConf.browser = browser;
            notifyStoreConf.type = notifyStoreConf.storeClass;
            notifyTrackConf.store = browser.addStoreConfig(undefined, notifyStoreConf);
            browser.publish ('/jbrowse/v1/v/tracks/' + eventType, [notifyTrackConf]);
        };

        
        dojo.subscribe("/jbrowse/jbclient_ready", function(io){
            console.log("ready to receive events");
            
            io.socket.on('track-new', function (data){
                console.log('event','track-new',data);
                newTrackHandler ('new',data);
            });		
            io.socket.on('track-update', function (data){
                console.log('event','track-update',data);
                var track = thisB.findTrackConfig(data);
                if (track)
                    thisB.browser.view.replaceTracks([track]);
                else
                    console.log("track not found");
            });

            io.socket.on('job-active', function (data){
                console.log('event','job-active',data);
                if (data.count===0) $("img.cogwheel").addClass("hidden");
                else $("img.cogwheel").removeClass("hidden");
            });		
            io.socket.on('job-remove', function (data){
                console.log('event','job-remove',data);
                $("#j-hist-grid tr#"+data.job_id).remove();
            });		
            io.socket.on('job-add', function (data){
                console.log('event','job-add',data);
                var jdata = data.job;
                $('#j-hist-grid #head').after("<tr id='"+jdata.id+"'><td class='state'>"+getJobState(jdata.data.galaxy_data.state)+"</td><td>"+jdata.data.galaxy_data.hid+"</td><td>"+jdata.data.galaxy_data.name+"</td></tr>");                
            });		
            io.socket.on('job-change', function (data){
                console.log('event','job-change',data);
                var jdata = data.job;
                var id = jdata.id;
                var newState = jdata.data.galaxy_data.state;
                $('#j-hist-grid #'+id+" .state").html(getJobState(newState));
            });		

            io.socket.on('track-replace', function (data){
                console.log('event','track-replace',data);
                newTrackHandler ('replace',data);
            });		
            io.socket.on('job-remove', function (data){
                console.log('event','job-remove',data);
                browser.publish ('/jbrowse/v1/v/tracks/delete', browser.trackConfigs);
            });		
            io.socket.on('track-test', function (data){
                console.log('event','track-test',data);
                console.log("event track-test "+data.value);
                alert("event track-test value = "+data.value)
            });
                
        });
        
        /*
         * JBrowse event handlers
         */
        dojo.subscribe("/jbrowse/v1/n/tracks/focus", function(track){
            console.log("jblast plugin event: /jbrowse/v1/n/tracks/focus",track);
            if (typeof track.config.jblast !== 'undefined') {
                // for jblast tracks, the label is the asset and also the reference to the filterSettings of the asset
                thisB.browser.jblast.asset = track.config.label;
                thisB.insertBlastPanel(track.config);
            }
        });        
        dojo.subscribe("/jbrowse/v1/n/tracks/unfocus", function(track){
            console.log("jblast plugin event: /jbrowse/v1/n/tracks/unfocus",track);
            if (typeof track.config.jblast !== 'undefined') {
                thisB.removeBlastPanel(track.config);
                thisB.browser.jblast.asset = null;
            }
        });        
        dojo.subscribe("/jbrowse/v1/v/tracks/show", function(trackConfigs){
            console.log("jblast plugin event: /jbrowse/v1/v/tracks/show",trackConfigs);
            if (typeof trackConfigs[0].jblast !== 'undefined') {
                if (browser.jblast.panelDelayTimer === null){
                    browser.jblast.panelDelayTimer = setTimeout(function(){
                        console.log("timeout");
                        var track = thisB.findTrack(trackConfigs[0].label);
                        browser.view.setTrackFocus(track,1);
                        browser.jblast.panelDelayTimer = null;
                    },1000);
                }
            }
        });        
        dojo.subscribe("/jbrowse/v1/v/tracks/hide", function(trackConfigs){
            console.log("jblast plugin event: /jbrowse/v1/v/tracks/hide",trackConfigs);
            if (typeof trackConfigs[0].jblast !== 'undefined')
                thisB.removeBlastPanel(trackConfigs[0]);
        });        
        
    },
    // look in the browser's track configuration for the track with the given label
    findTrackConfig: function( trackLabel ) {
        if( ! trackLabel )
            return null;

        var tracks = this.browser.config.tracks;
        
        for(var i in tracks) {
            if (tracks[i].label === trackLabel)
                return tracks[i];
        }
        return null;
    },
    // find track given label
    findTrack: function( trackLabel ) {
        if( ! trackLabel )
            return null;

        var tracks = this.browser.view.tracks;
        
        for(var i in tracks) {
            if (tracks[i].config.label === trackLabel)
                return tracks[i];
        }
        return null;
    },
    
    setupFeatureToolTips: function() {
        var thisB = this;
        var browser = this.browser;
        setTimeout(function() {
            // setup tooltip
            $('.blast-feature').each(function() {
                var key = $(this).attr('blastkey');
                var hit = browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit[key];
                //console.log('key-hit ',key,hit);
                if (typeof hit !== 'undefined') {
                    var text = '<div>'+browser.jblastPlugin.blastRenderHit(hit); //+'<button class="btn btn-primary" blastkey="'+key+'"onclick="JBrowse.blastGoto(this)">Goto</button></div>';

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

                }
                else {
                    console.log('undefined blastkey', key, '(this happens for test json file');
                }
            });            
        },1000);
    },
    /**
     * inserts blast feature details if appropriate blast track
     * @param {type} track
     * @returns {undefined}
     */
    insertFeatureDetail: function(track) {
        console.log("insertFeatureDetail track", track);
        var thisB = this;
        var blastPlugin = this.browser.jblastPlugin;
        var lastBlastKey = "";
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
                if ($('#blastDialogDetail').length===0) {
                    console.log('blastDialogDetail created');
                    $('<div id="blastDialogDetail"><h2 class="blastDetailTitle sectiontitle">BLAST Results</h2><div id="blastHspBlock">Rendering...</div></div>').insertBefore(rObjP);

                    var asset = track.config.label;
                    var dataset = encodeURIComponent(track.browser.config.dataRoot);
                    var hitkey = blastKey;
                    var url = '/jbapi/gethitdetails/'+asset+'/'+dataset+'/'+hitkey;
                    $.get( url, function(hitData) {
                        console.log("gethitdetails data",hitData);
                        
                        var blastContent = "";
                        var count = 0;
                        for(i in hitData) {
                            var hit = hitData[i];
                            
                            // do only on first iteration because other iteratons have same data
                            if (count===0) {
                                blastContent += thisB.blastRenderHitCommon(hit);
                                $.get('/jbapi/lookupaccession/'+hit.Hit_accession,function(data) {
                                    
                                    var count = 0;
                                    for(var i in data.result) {
                                        if (count++ === 0) {
                                            var link = data.result[i].link;
                                            $('#details_accession').attr('href',link);
                                            $('#details_accession').html(data.result[i].caption);
                                        }
                                    }
                                });
                            }
                            
//                            blastContent += "<div><h2 class='field'>Hsp Num</h2><span class='value'>"+hit.Hsp.Hsp_num+"</span></div>";
                            blastContent += blastPlugin.blastRenderHit(hit);
                            blastContent += blastPlugin.blastRenderHitBp(hit);
                            blastContent += "<hr>";
                            count++;
                        }
                        $('#blastHspBlock').html(blastContent);
                    })
                        .fail(function() {
                            console.log("error",url);
                        });                    
                }
            }
        }
            
    },
    blastRenderHitCommon: function(hit) {
        var txt = '';
        
        //txt += '<div class="CSSTableGenerator">';
        txt += '<div class="blast-table-view">';
        txt += '<table class="hsp-table" style="width:100px"><tr id="head">';  //class="CSSTableGenerator "
        txt +=    '<td class="field blast-field">Accession</td>';
        txt +=    '<td class="field blast-field">Sequence ID</td>';
        txt +=    '<td class="field blast-field">Length</td>';
        txt += '</tr><tr>';
        txt +=    '<td class="blast-value"><a class="value" id="details_accession" target="_blank"></a></td>';
        txt +=    '<td class="blast-value">'+ hit.Hit_id+'</td>';
        txt +=    '<td class="blast-value">'+hit.Hit_len+'</td>';
        txt += '</tr></table>';
        txt += '</div>';
        txt += '<hr>';
        
        return txt;
        
    },
    // this renders the summary information for the hit
    blastRenderHit: function(hit){
        //console.log("blastRenderHit",hit);
        var txt = '';

        var hstart = parseInt(hit.Hsp["Hsp_hit-from"]);
        var hend = parseInt(hit.Hsp["Hsp_hit-to"]);
        var strand = hend - hstart > 0 ? "+" : "-";
        
        txt += '<div class="blast-table-view">';
        txt += '<table class="hsp-table" style="width:100px"><tr id="head">';  //class="CSSTableGenerator "
        txt +=    '<td class="field blast-field">HSP Num</td>';
        txt +=    '<td class="field blast-field">Score</td>';
        txt +=    '<td class="field blast-field">Expect</td>';
        txt +=    '<td class="field blast-field">Identities</td>';
        txt +=    '<td class="field blast-field">Gaps</td>';
        txt +=    '<td class="field blast-field">Strand</td>';
        txt +=    '<td class="field blast-field">Align Len</td>';
        txt += '</tr><tr>';
        txt +=    '<td class="blast-value">'+hit.Hsp.Hsp_num+'</td>';
        txt +=    '<td class="blast-value">'+ parseInt(hit.Hsp['Hsp_bit-score'])+' ('+hit.Hsp.Hsp_score+')</td>';
        txt +=    '<td class="blast-value">'+Number(hit.Hsp.Hsp_evalue).toExponential(2)+'</td>';
        txt +=    '<td class="blast-value">'+(hit.Hsp.Hsp_identity/hit.Hsp['Hsp_align-len']*100).toFixed(2)+'</td>';
        txt +=    '<td class="blast-value">'+(hit.Hsp.Hsp_gaps/hit.Hsp['Hsp_align-len']*100).toFixed(2)+'</td>';
        txt +=    '<td class="blast-value">'+strand+'</td>';
        txt +=    '<td class="blast-value">'+hit.Hsp['Hsp_align-len']+'</td>';
        txt += '</tr></table>';
        txt += '</div>'
        
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
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_identity/hit.Hsp['Hsp_align-len']*100+'</td>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_gaps/hit.Hsp['Hsp_align-len']*100+'</td>';
        txt += '</tr></table>';  
        return txt;
    },
/*********************************************************
 * Track Focus - Blast Panel 
 *********************************************************/    
    
    startFocusQueue: function() {
        var thisB = this;
        setInterval(function() {
            if (thisB.browser.jblast.focusQueueProc == 0  && thisB.browser.jblast.focusQueue.length > 0)
                thisB.processAction();
        },300);
    },
    processAction: function() {
        
        var queue = this.browser.jblast.focusQueue;

        var thisB = this;
        var task = queue.shift();
        this.browser.jblast.focusQueueProc++;

        
        if (task.action === 'show') {
            $('#blast-filter-group').clone().prependTo('.jbrowseHierarchicalTrackSelector');
            thisB.setupFilterSliders(task.trackConfig);
            $('#blast-filter-group').show(500,function() {
                thisB.browser.jblast.focusQueueProc--;
            });
        }
        else if (task.action === 'hide') {
            $(".jbrowseHierarchicalTrackSelector > #blast-filter-group").hide(500,function complete() {
                $(".jbrowseHierarchicalTrackSelector > #blast-filter-group").remove();
            });
            if ($('#blast-filter-group').length) {
                $('#blast-filter-group').hide(500);
                setTimeout(function() { // hide complete event is broke in jquery, so we use a timer.
                    thisB.browser.jblast.focusQueueProc--;
                },700);
            }
        }
    },
    
    insertBlastPanel: function(trackConfig) {
        //console.log("insertBlastPanel2",this.browser.jblast.focusQueue);
        var queue = this.browser.jblast.focusQueue;
        queue.push({action:'show',trackConfig:trackConfig});
    },
    removeBlastPanel: function() {
        //console.log("removeBlastPanel2",this.browser.jblast.focusQueue);
        var queue = this.browser.jblast.focusQueue;
        queue.push({action:'hide'});
    },
    setupFilterSliders: function(trackConfig) {
        console.log("setupFilterSliders1");
        var thisB = this;
        var config = this.browser.config;
        var url = config.dataRoot + '/' + trackConfig.filterSettings;
        var filterSlider = this.browser.jblast.filterSliders;
        
        console.log('url',url);
        var jqxhr = $.getJSON( url, function(data) {
            console.log( "success", data);

            // score ****************************
            
            var lo = data.score.min;
            var hi = data.score.max;
            var step = Math.round((hi-lo) / 4);

            // setup sliders
            $("#slider-score").slider({
                min: lo,
                max: hi,
                values: [data.score.val],
                slide: function(event,ui) {
                    var v = ui.value;
                    $('#slider-score-data').html(v);
                    filterSlider.score = parseInt(v);            
                },
                change: function(event,ui) {
                    var data = {score:{val:filterSlider.score}};
                    thisB.sendChange(data,trackConfig);
                }
            })
            .slider('pips', {
                rest:'label',
                step: step
            });

            filterSlider.score = data.score.val;

            // evalue slider *******************************

            //var offset = Math.abs(data.evalue.max)*2 + Math.abs(data.evalue.min-data.evalue.max);
            var hi = data.evalue.max;
            var lo = data.evalue.min;
            var nstep = 100;
            var step = (hi - lo) / nstep;
            console.log("lo,hi,val,step",lo,hi,data.evalue.val,step);

            var pstep = 5;
            var labels = [];

            for(var i=lo;i <= hi; i += step) {
                var v = Math.pow(10,i);
                labels.push(v.toExponential(1));
            }
            labels.push(Math.pow(10,hi).toExponential(1));
            console.log("labels",labels);
            
            $("#slider-evalue").slider({
                min: lo,
                max: hi,
                step:step,
                values: [data.evalue.val],
                slide: function(event,ui) {
                    //console.log('evalue',ui.value,ui.value);
                    var ev = +ui.value;
                    $('#slider-evalue-data').html(Math.pow(10,ev).toExponential(1));
                    filterSlider.evalue = ev;
                },
                change: function(event,ui) {
                    var data = {evalue:{val:filterSlider.evalue}};
                    thisB.sendChange(data,trackConfig);
                }
            }).slider("pips",{
                rest:'label',
                //first:'label',
                //last:'label',
                labels: labels,
                step: 25
            });
            filterSlider.evalue = data.evalue.val;

            // identity slider

            var hi = data.identity.max;
            var lo = data.identity.min;
            var step = (hi - lo) / 20;

            // pip setup
            var pstep = 5;
            var labels = [];
            for(var i=lo;i <= hi; i += pstep*step) {
                labels.push(""+Math.round(i));
            }

            $("#slider-identity").slider({
                min: lo,
                max: hi,
                step: step,
                values: [data.identity.val],
                slide: function(event,ui) {
                    var v = ui.value + '%';
                    $('#slider-identity-data').html(v);
                    filterSlider.identity = parseInt(v);
                },
                change: function(event,ui) {
                    var data = {identity:{val:filterSlider.identity}};
                    thisB.sendChange(data,trackConfig);
                }
            }).slider("pips",{
                rest:'label',
                first:'label',
                last:'label',
                step: pstep,
                //labels: labels,
                suffix: '%'
            });
            filterSlider.identity = data.identity.val;

            // gap slider

            var hi = data.gaps.max;
            var lo = data.gaps.min;
            var step = (hi - lo) / 20;
            //step = parseFloat(step.toFixed(2));

            var pstep = 5;
            //pstep = parseFloat(pstep.toFixed(2));
            var labels = [];
            for(var i=lo;i <= hi; i += pstep*step) {
                labels.push(i);
            }
            $("#slider-gap").slider({
                min: lo,
                max: hi,
                step: step,
                values: [data.gaps.val],
                slide: function(event,ui) {
                    var v = ui.value + '%';
                    $('#slider-gap-data').html(v);
                    filterSlider.gaps = parseFloat(ui.value);
                },
                change: function(event,ui) {
                    var data = {gaps:{val:filterSlider.gaps}};
                    thisB.sendChange(data,trackConfig);
                }
                
            }).slider("pips",{
                rest: 'label',
                first: 'label',
                last: 'label',
                step: pstep,
                //labels: labels,
                suffix: '%'
            });
            filterSlider.gaps = data.gaps.val;
            
            // do stuff once after sliders are initialized
            setTimeout(function() {
                var val = filterSlider.score;
                $('#slider-score-data').html(val);

                var val = filterSlider.evalue;
                //val = Math.pow(10,val);
                $('#slider-evalue-data').html(Math.pow(10,val).toExponential(1));

                var v = filterSlider.identity + '%';
                $('#slider-identity-data').html(v);

                var v = filterSlider.gaps + '%';
                $('#slider-gap-data').html(v);

            },100);

        });
        
    },
    sendChange: function(data,trackConfig) {
        // do http post
        var postData = {
              filterParams: data,
              asset: this.browser.jblast.asset,
              dataSet: this.browser.config.dataRoot
        }
        //console.log("postData",postData);
        $.post( "/jbapi/setfilter", postData , function( result ) {
            console.log( result );
        }, "json");
    },

/*************************************************
 * Class overrides
 *************************************************/               
               
    // adds Blast button
    FASTA_addButtons: function (region,seq, toolbar) {
        var text = this.renderText( region, seq );
        thisB = this;
        toolbar.addChild( new Button({ 
            iconClass: 'dijitIconFunction',
            label: 'BLAST',
            title: 'BLAST this feature',
            disabled: ! has('save-generated-files'),
            onClick: function() {
                //thisB.blastDialog(text);
                JBrowse.jblastDialog(text);
            }
        }));
    },
    jblastRightClickMenuInit: function(highlight) {
        console.log("jblastRightClickMenuInit");
        var thisB = this;
        var browser = this.browser;
        var handlers = {
            // handler for clicks on task context menu items
            onTaskItemClick: function(event) {
                //browser.jblastDialog();
                // get sequence store and ac
                browser.getStore('refseqs', dojo.hitch(this,function( refSeqStore ) {
                    if( refSeqStore ) {
                        var hilite = browser._highlight;
                        refSeqStore.getReferenceSequence(
                            hilite,
                            dojo.hitch( this, function( seq ) {
                                //console.log('found sequence',hilite,seq);
                                require(["JBrowse/View/FASTA"], function(FASTA){
                                    var fasta = new FASTA();
                                    var fastaData = fasta.renderText(hilite,seq);
                                    console.log('FASTA',fastaData);
                                    delete fasta;
                                    browser.jblastDialog(fastaData);
                                });                                
                                
                            })
                        );
                    }
                }));             
            }
        };
        // create task menu as context menu for task nodes.
        
        var menu = new Menu({
                id: "jblastRCMenu"
        });
        menu.addChild(new MenuItem({
                id: "jblast-region",
                label: "BLAST highlighted region...",
                onClick: lang.hitch(handlers, "onTaskItemClick")
        }) );
        menu.startup();
        menu.note = "right-click hilite menu";

        browser.jblastHiliteMenu = menu;
    },
    /**
     * called when highlight region is created
     * @param {type} node - DOM Node of highlight region (yellow region)
     * @returns nothing significant
     */
    BlockBased_postRenderHighlight: function(node) {
        console.log('postRenderHighlight');
        
        // add hilight menu to node
        if (typeof JBrowse.jblastHiliteMenu !== 'undefined')
            JBrowse.jblastHiliteMenu.bindDomNode(node);
    },
    // display blast dialog
    Browser_jblastDialog: function (region) {
        var regionB = region;
        var thisB = this;
        var comboData = [];


        getWorkflows(function(workflows){

            if (workflows.length==0) {
                alert("no workflows found");
                return;
            }
            
            var stateStore = new Memory({
                data: comboData
            });
            
            function destroyBlastDialog() {
                dialog.destroyRecursive();
                delete stateStore;
                delete cancelBtn;
                delete submitBtn;

            };
            var dialog = new Dialog({ 
                title: 'Process BLAST',
                onHide: function() {
                    destroyBlastDialog();
                }
            });
            
            dojo.create('span', {
                innerHTML: 'Workflow '
            }, dialog.containerNode);
            
            dojo.create('button', {
                id: 'blast-workflow-select'
            }, dialog.containerNode);
            
            for(var i in workflows) {
                console.log("workflow",workflows[i]);
                if (!workflows[i].deleted) {
                    comboData.push({'name': workflows[i].name, 'id':workflows[i].id});
                }
            }

            var comboBox = new ComboBox({
                id: "workflow-combo",
                name: "workflow",
                value: comboData[0].name,
                store: stateStore,
                searchAttr: "name"
            }, "blast-workflow-select").startup();            
            
            dojo.create('div', {
                id: 'blast-box',
                style: {'margin-top': '20px'},
                innerHTML: 'This will process a BLAST search against the selected database.<br/><button id="submit-btn" type="button">Submit</button> <button id="cancel-btn" type="button">Cancel</button>'
                //innerHTML: 'This will process a BLAST search against the selected database.<br/>'
            }, dialog.containerNode);

            var submitBtn = new Button({
                label: "Submit",
                onClick: function(){
                    
                    // get selected workflow
                    var selStr = dijit.byId('workflow-combo').get('value');
                    for(var x in comboData) {
                        if (comboData[x].name == selStr) {
                            var selWorkflow = comboData[x].id;
                            console.log('Selected workflow',selWorkflow,comboData[x].name);
                        }
                    }
                    console.log('Selected workflow',selWorkflow);
                    
                    // do http post
                    var xhrArgs = {
                      //url: jbServer + '/jbapi/blastregion',
                      url: '/jbapi/workflowsubmit',
                      postData: {
                          region: regionB,
                          //workflow: 'f2db41e1fa331b3e'
                          workflow: selWorkflow,
                          dataSetPath: thisB.config.dataRoot
                      },
                      handleAs: "json",
                      load: function(data){
                        console.log("POST result");
                        console.dir(data);
                      },
                      error: function(error){
                          alert(error);
                      }
                    };
                    var postData = {
                          region: regionB,
                          workflow: selWorkflow,
                          dataSetPath: thisB.config.dataRoot
                      };
                    //var deferred = dojo.xhrPost(xhrArgs);
                    $.post( "/jbapi/workflowsubmit", postData , function( result ) {
                        console.log( result );
                    }, "json");


                    // show confirm submit box
                    var confirmBox = new Dialog({ title: 'Confirmation' });
                    dojo.create('div', {
                        id: 'confirm-btn',
                        innerHTML: 'BLAST submitted...'
                    }, confirmBox.containerNode );
                    confirmBox.show();

                    setTimeout(function(){
                        confirmBox.destroyRecursive();
                    }, 2000);

                    destroyBlastDialog();
                }
            }, "submit-btn").startup();
            var cancelBtn = new Button({
                label: "Cancel",
                onClick: function(){
                    destroyBlastDialog();
                }
            }, "cancel-btn").startup();
            
            if (dialog) dialog.show();

        });
        
    }
    
});
});

/**
 * get galaxy workflows (using jbrowse api)
 * @param {type} cb - cb(workflows]]
 * @returns {getWorkflows}
 */
function getWorkflows(cb) {
    var thisB = this;

    var xhrArgs = {
      url: "/jbapi/getworkflows",
      handleAs: "json",
      preventCache: true,
      load: function(data){
            console.log("get workflows result", data);
            cb(data);
      },
      error: function(error){
      }
    }

    // Call the asynchronous xhrGet
    //var deferred = dojo.xhrGet(xhrArgs);
    $.get( "/jbapi/getworkflows", function( data ) {
        console.log("get workflows result", data);
        cb(data);
    });
}
// overwrite a string with another string at the given location
function overwriteStr(subjStr, at, withStr) {
      var partL = subjStr;
      var withLen = withStr.length;
      if (at >= subjStr.length) return subjStr;
      var partL = subjStr.substring(0, at);
            if ((at + withLen) > subjStr.length) {
        var cut = (at + withLen) - subjStr.length;
        return partL + withStr.substring(0,withLen-cut);
      }
      if ((withLen+partL.length) == subjStr.length) return partL + withStr;
      var lenR = subjStr.length - withLen - partL.length;
      var partR = subjStr.substring(subjStr.length - lenR, subjStr.length);
      return partL + withStr + partR;
}

// return a string of characters (ch) length (count)
// "33333" = repearChar(5,"3");
function repeatChar(count, ch) {
      if (count == 0) return "";
      var count2 = count / 2,
        result = ch;

      while (result.length <= count2) {
        result += result;
      }
      return result + result.substring(0, count - result.length);
}
function jobPanelInit() {              
    console.log("jobPanelInit()");
    
    // fix position of flap
    $("#extruderRight div.flap").addClass("flapEx");

    // add gear icon (activity indicator)
    $("#extruderRight div.flap").prepend("<img class='cogwheel hidden' src='img/st_processing.gif' />");

    $("#extruderRight .extruder-content").css('height','300px');
    $("#extruderRight .extruder-content").css('border-bottom-left-radius','5px');



    //adjust grid height
    setInterval(function() {
        var h = $("#extruderRight div.extruder-content").height();
        $("#j-hist-grid").height(h-3);
    },1000);
}

