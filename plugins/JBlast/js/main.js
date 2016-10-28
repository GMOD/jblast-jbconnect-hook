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
        Button, Dialog, Memory, ComboBox,has,
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
        
        
        browser.jblast = {
            filterSliders: {
                score: 0,
                evalue: 0,
                identity: 0,
                gaps: 0
            }
        };
        
        // create function intercepts
        browser.afterMilestone( 'loadConfig', function() {
            if (typeof browser.config.classInterceptList === 'undefined') {
                browser.config.classInterceptList = {};
            }
            
            // override HTMLFeatures
            require(["dojo/_base/lang", "JBrowse/View/Track/HTMLFeatures"], function(lang, HTMLFeatures){
                lang.extend(HTMLFeatures, {
                    renderFilter: thisB.HTMLFeatures_renderFilter,
                    extendedInit: thisB.HTMLFeatures_extendedInit,
                    featureHook1: thisB.HTMLFeatures_featureHook1
                });
            });

            // override Hierarchical
            require(["dojo/_base/lang", "JBrowse/View/TrackList/Hierarchical"], function(lang, Hierarchical){
                lang.extend(Hierarchical, {
                    extendCheckbox: thisB.Hierarchical_extendCheckbox,                    
                    replaceTracks: thisB.Hierarchical_replaceTracks
                });
            });

            // override FASTA
            require(["dojo/_base/lang", "JBrowse/View/FASTA"], function(lang, FASTA){
                lang.extend(FASTA, {
                    initData: thisB.FASTA_initData,
                    addButtons: thisB.FASTA_addButtons,
                    blastDialog: thisB.FASTA_blastDialog,
                    destroyBlastDialog:thisB.FASTA_destroyBlastDialog
                });
            });

        });      
        
        // save the reference to the blast plugin in browser
        browser.blastPlugin = this;
        
        var newTrackHandler = function (eventType,data) {
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


        io.socket.on('track-new', function (data){
            console.log('event','track-new',data);
            newTrackHandler ('new',data);
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
        browser.afterMilestone( 'initView', function() {
            console.log('initView milestone');

            setTimeout(function() {
                //thisB.insertBlastPanel();
                thisB.featureDetailMonitor();
            },500);
            
        });
    },
    // initial the blast track, called in HTMLFeatures constructor
    initBlastTrack: function(blastTrackConfig) {
        console.log('initBlastTrack()');
        var thisB = this;
        var config = blastTrackConfig;
        
        if (this.browser.jblast.BlastKey === config.label) return;
        
        console.log("blastKey",config.label);
        
        this.browser.jblast.BlastKey = config.label;
        
        this.blastReadJSON(config,function() {
            //this.gotBlastData();
            console.log("blastReadJSON callback");
            thisB.browser.blastTrackConfig = config;
            thisB.browser.blastKey = config.label;
            thisB.insertBlastPanel();
            thisB.blastRenderData();
        });
    },
    // render data into blast panel (bottom panel)
    blastRenderData: function() {
        var thisB = this;
        var browser = this.browser;
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
                if (typeof hit !== 'undefined') {
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

                }
                else {
                    console.log('undefined blastkey', key, '(this happens for test json file');
                }
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
        txt +=    '<td>'+ parseInt(hit.Hsp['Hsp_bit-score'])+' ('+hit.Hsp.Hsp_score+')</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_evalue+'</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_identity/hit.Hsp['Hsp_align-len']*100+'</td>';
        txt +=    '<td>'+hit.Hsp.Hsp_gaps/hit.Hsp['Hsp_align-len']*100+'</td>';
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
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_identity/hit.Hsp['Hsp_align-len']*100+'</td>';
        txt +=    '<td class="blastSummaryItem" align="center">'+hit.Hsp.Hsp_gaps/hit.Hsp['Hsp_align-len']*100+'</td>';
        txt += '</tr></table>';  
        return txt;
    },
    // this creates the side blast filter panel
    insertBlastPanel: function(postFn) {
        var thisB = this;
        console.log('insertBlastPanel()');
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
        
        if (JSON.stringify(this.lastVal) == JSON.stringify(val)) return;    // deep compare
        this.lastVal = JSON.parse(JSON.stringify(val));     // deep copy

        console.log("val",val);

        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;

        for(var x in blastData) {
            blastData[x].selected = 0;
            if (parseFloat(blastData[x].Hsp['Hsp_bit-score']) > val.score &&
               +blastData[x].Hsp['Hsp_evalue'] < val.evalue &&     
               ((parseFloat(blastData[x].Hsp['Hsp_identity']) / parseFloat(blastData[x].Hsp['Hsp_align-len'])) * 100) > val.identity &&    
               ((parseFloat(blastData[x].Hsp['Hsp_gaps']) / parseFloat(blastData[x].Hsp['Hsp_align-len'])) * 100) < val.gaps   &&  
               
               1 ) blastData[x].selected = 1;
        }

        // toggle blast item
        // todo: toggle specific button based on currently selected
        var key = this.browser.blastKey;
            $(".jblast-item[blastref*='"+key+"']").trigger('click');  "input[name*='man']"
            setTimeout(function(){
                $(".jblast-item[blastref*='"+key+"']").trigger('click');
            },300);
    },
    
    // setup blast filter sliders
    // ref: http://simeydotme.github.io/jQuery-ui-Slider-Pips/#options-pips
    setupFilterSliders: function() {
        console.log("setupFilterSliders()");
        var thisB = this;

        var filterSlider = this.browser.jblast.filterSliders;
        
        // score slider
        
        var hi = Math.ceil(this.getHighest('Hsp_bit-score'));
        var lo = Math.floor(this.getLowest('Hsp_bit-score'));
        var step = Math.round((hi-lo) / 4);
        console.log("score hi/lo",lo,hi);

        var startPos = Math.round((hi - lo) * .8) + lo; // 80%

        // setup sliders
        $("#slider-score").slider({
            min: lo,
            max: hi,
            values: [lo],
            slide: function(event,ui) {
                var v = ui.value;
                $('#slider-score-data').html(v);
                filterSlider.score = parseInt(v);            
            }
        })
        .slider('pips', {
            rest:'label',
            step: step
        });

        filterSlider.score = lo;

        // evalue slider

        var hi = this.getHighest10('Hsp_evalue');
        var lo = this.getLowest10('Hsp_evalue');
        var step = (hi - lo) / 20;

        console.log("evalue hi/lo/step,hival",lo,hi,step,this.getHighest('Hsp_evalue').toExponential(1));

        var pstep = 5;
        var labels = [];
        
        for(var i=lo;i <= hi; i += pstep*step) {
            var v = Math.pow(10,i);
            labels.push(v.toExponential(1));
        }
        labels.push(Math.pow(10,hi).toExponential(1));

        // push values to positive zone because slider pips cannot seem to handle negative numbers with custom labels
        offset = Math.abs(lo);
	lo = lo + offset;
        hi = hi + offset;

        console.log(labels);

        $("#slider-evalue").slider({
            min: lo,
            max: hi,
            step:step,
            values: [hi],
            slide: function(event,ui) {
                var v = Math.pow(10,+ui.value - offset);
                $('#slider-evalue-data').html(v.toExponential(1));
                filterSlider.evalue = v;
            }
        }).slider("pips",{
            rest:'label',
            first:'label',
            last:'label',
            labels: labels,
            step: pstep
        });
        filterSlider.evalue = Math.pow(10,hi - offset);

        // identity slider

        var hi = Math.ceil(this.getHighestPct('Hsp_identity'));
        var lo = Math.floor(this.getLowestPct('Hsp_identity'));
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
            values: [lo],
            slide: function(event,ui) {
                var v = ui.value + '%';
                $('#slider-identity-data').html(v);
                filterSlider.identity = parseInt(v);
            }
        }).slider("pips",{
            rest:'label',
            first:'label',
            last:'label',
            step: pstep,
            //labels: labels,
            suffix: '%'
        });
        filterSlider.identity = lo;

        // gap slider

        var hi = Math.ceil(this.getHighestPct('Hsp_gaps'));
        var lo = Math.floor(this.getLowestPct('Hsp_gaps'));
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
            values: [hi],
            slide: function(event,ui) {
                var v = ui.value + '%';
                $('#slider-gap-data').html(v);
                filterSlider.gaps = parseFloat(ui.value);
            }
        }).slider("pips",{
            rest: 'label',
            first: 'label',
            last: 'label',
            step: pstep,
            //labels: labels,
            suffix: '%'
        });
        filterSlider.gaps = hi;

        // do stuff once after sliders are initialized
        setTimeout(function() {
            var val = filterSlider.score;
            $('#slider-score-data').html(val);
            
            var val = filterSlider.evalue;
            //val = Math.pow(10,val);
            $('#slider-evalue-data').html(val.toExponential(1));

            var v = filterSlider.identity + '%';
            $('#slider-identity-data').html(v);

            var v = filterSlider.gaps + '%';
            $('#slider-gap-data').html(v);
            
        },100);

        // periodically scan slider value and rerender blast feature track
        setInterval(function() {
            //var val = $('#slider-score').slider("option", "value");
            //var val = $('#slider-score').value;
            //console.log('val',val);
            
            thisB.scoreFilter(filterSlider);
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
            if (+blastData[x].Hsp[variable] > val)
                val = +blastData[x].Hsp[variable];
        }
        return val;
    },
    // get the lowest value of the blast data variable.
    getLowest: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            if (val === -1) val = +blastData[x].Hsp[variable];
            if (+blastData[x].Hsp[variable] < val)
                val = +blastData[x].Hsp[variable];
        }
        return val;
    },
    // get the hightest value of the blast data variable
    getHighest10: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = Math.log10(Number.MIN_VALUE);
        //console.log("smallest",val);
        for(var x in blastData) {
            var v = Math.log10(+blastData[x].Hsp[variable]);
            //console.log('v',v,blastData[x].Hsp[variable]);
            if (v > val) val = v;
        }
        return val;
    },
    // get the lowest value of the blast data variable.
    getLowest10: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            var v = Math.log10(+blastData[x].Hsp[variable]);
            if (val === -1) val = v;
            if (v < val)  val = v;
        }
        return val;
    },
    // get the hightest value of the blast data variable as a percent of align-len
    getHighestPct: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = 0;
        for(var x in blastData) {
            //console.log(variable,blastData[x].Hsp[variable]);
            var cval = parseFloat(blastData[x].Hsp[variable]) / parseFloat(blastData[x].Hsp['Hsp_align-len']) * 100;
            if (cval > val) val = cval
        }
        return val;
    },
    // get the lowest value of the blast data variable as a percent of align-len
    getLowestPct: function(variable) {
        var blastData = this.browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;
        var val = -1;
        for(var x in blastData) {
            var cval = parseFloat(blastData[x].Hsp[variable]) / parseFloat(blastData[x].Hsp['Hsp_align-len']) * 100;
            if (val === -1) val = cval;
            if (cval < val) val = cval;
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
        console.log("blastReadJSON()",config,config.baseUrl+config.blastData);
        var thisB = this;
        var browser = this.browser;

        browser.blastDataJSON = 0;

        //var blastDataFile = config.blastData;
        if (typeof config.blastData !== "undefined") {
            var success = 0;
            var deferred = dojo.xhrGet({
                url: config.baseUrl+config.blastData,
                handleAs: "json",
                preventCache: true,
                load: function(obj) {
                    browser.blastDataJSON = obj;
                    success = 1;
                    console.log("read success",obj,success);
                },
                error: function(err) {
                    console.log(err);
                }
            });
            // need to decouple the postFn() callback because errors in postFn cause xhrGet error trap to trigger.
            var timeout = 0;
            var timy = setInterval(function() {
                if (success){
                    console.log("blastReadJSON done", browser.blastDataJSON);
                    clearInterval(timy);
                    postFn();
                }
                if (timeout++ > 300) {
                    clearInterval(timy);
                    console.log("blastReadJSON did not call postFn()");
                }
            },10);
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
    },
    HTMLFeatures_extendedInit: function() {
        // if jblast plugin available
        if (typeof this.browser.blastPlugin !== 'undefined') {
           
            // only if it a blastData track
            if (typeof this.config.blastData !== 'undefined') {
                this.browser.blastPlugin.initBlastTrack(this.config);
            }
        }
        
    },
    HTMLFeatures_renderFilter: function(feature) {
            var browser = this.browser;
            var render = 0;

            // if this is not a jblast track, then pass then render all features.
            if (typeof this.config.blastData === 'undefined') return 1;

            if ( (typeof browser.blastDataJSON==='undefined') || browser.blastDataJSON === 0) {
                return 0;   /// not initialized yet
            }

            // jblast filter
            var blastData = browser.blastDataJSON.BlastOutput.BlastOutput_iterations.Iteration.Hit;

            var blasthit = feature.get('blasthit');
            //console.log("featurefilter",blasthit);
            if ((typeof blastData !== 'undefined') && (typeof blasthit !== 'undefined'))
                if (typeof blastData[blasthit] !== 'undefined')
                    render = blastData[blasthit].selected;

            return render;
    },
    HTMLFeatures_featureHook1: function(feature,featDiv) {
        /*
        blast attributes
        */
        var blastHit = feature.get('blasthit');
        if (typeof blastHit !== 'undefined') {
            var blastKey = blastHit;
            dojo.attr(featDiv,'blastkey',blastKey);
            dojo.addClass(featDiv,'blast-feature');
        }
    },
    Hierarchical_extendCheckbox: function(props,trackConf) {
        //console.log("extendCheckbox",trackConf);
        if (typeof trackConf.blastData !== 'undefined') {
            console.log("extendCheckbox prop",props)
            props.blastRef = trackConf.label;
            props.className += " jblast-item";
        }
        return props;
    },
    Hierarchical_replaceTracks: function( trackConfigs ) {   // notification
        var isChecked = {}
        array.forEach( trackConfigs, function(conf) {
            this._findTrack( conf.label, function( trackRecord, category ) {
                isChecked[conf.label] = trackRecord.checkbox.checked;
            });
        },this);

        this.deleteTracks (trackConfigs);
        this.addTracks (trackConfigs);

        array.forEach( trackConfigs, function(conf) {
            this._findTrack( conf.label, function( trackRecord, category ) {
                trackRecord.checkbox.checked = isChecked[conf.label];
            });
        },this);
    },
    FASTA_initData: function(args) {
        var thisB = this;
        this.workflows = [];
        this.dialog = null;
        
        var xhrArgs = {
          url: jbServer + "/jbapi/getworkflows",
          handleAs: "json",
          preventCache: true,
          load: function(data){
                console.log("get workflows result", data);
                thisB.workflows = data;
                
          },
          error: function(error){
          }
        }

        // Call the asynchronous xhrGet
        var deferred = dojo.xhrGet(xhrArgs);
        
    },
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
                thisB.blastDialog(text);
            }
        }));
    },
    // display blast dialog
    FASTA_blastDialog: function (region) {
        var regionB = region;
        var thisB = this;
        var comboData = [];
        
        if (!this.dialog) {

            this.dialog = new Dialog({ title: 'Process BLAST' });

            console.log("building dialog");

            dojo.create('span', {
                innerHTML: 'Workflow '
            }, this.dialog.containerNode);
            dojo.create('button', {
                id: 'blast-workflow-select'
            }, this.dialog.containerNode);

                var workflows = thisB.workflows;

                for(var i in this.workflows) {
                    console.log("workflow",workflows[i]);
                    if (!workflows[i].deleted) {
                        comboData.push({'name': workflows[i].name, 'id':workflows[i].id});
                    }
                }
                console.log("comboData",comboData);

                var stateStore = new Memory({
                    data: comboData
                });

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
            }, this.dialog.containerNode /* the content portion of the dialog you're creating */);
            //var div = dojo.create('div', {}, this.dialog.containerNode);
            this.confirmBtn = null;
            

            
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
                      url: jbServer + '/jbapi/workflowsubmit',
                      postData: {
                          region: regionB,
                          //workflow: 'f2db41e1fa331b3e'
                          workflow: selWorkflow
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
                    var deferred = dojo.xhrPost(xhrArgs);


                    // show confirm submit box
                    var confirmBox = new Dialog({ title: 'Confirmation' });
                    dojo.create('div', {
                        id: 'confirm-btn',
                        innerHTML: 'BLAST submitted...'
                    }, confirmBox.containerNode /* the content portion of the dialog you're creating */);
                    confirmBox.show();

                    setTimeout(function(){
                        confirmBox.destroyRecursive();
                    }, 2000);

                    thisB.destroyBlastDialog();
                }
            }, "submit-btn").startup();
            var cancelBtn = new Button({
                label: "Cancel",
                onClick: function(){
                    thisB.destroyBlastDialog();
                }
            }, "cancel-btn").startup();

        }
        if (this.dialog) this.dialog.show();
    },
    FASTA_destroyBlastDialog: function () {
        this.dialog.destroyRecursive();
        delete this.dialog;
        this.dialog = null;
    } 
    
});
});

