define([
    "dojo/_base/declare",
    "dojo/dom"
], function(declare, dom){
    return declare(null, {
        constructor: function(plugin,browser) {
            console.log("sliderMixin constructor");
            browser.afterMilestone( 'initView', function() {
            });
        },
        /*
        initSliders: function() {
            console.log("******************** initSliders");
            
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

            // evalue slider

            var hi = this.getHighest('Hsp_evalue');
            var lo = this.getLowest('Hsp_evalue');
            var step = (hi - lo) / 20;

            var labels1 = [];
            for(var i=lo;i <= hi; i += step) {
                var v = i;
                v = v.toExponential(2);
                //var v1 = v.split('e');
                //v = v1[0]+' e'+v1[1];
                labels1.push(v);
            }

            var pstep = 5;
            var labels = [];
            for(var i=lo;i <= hi; i += pstep*step) {
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
                step:step,
                change: function(event,ui) {
                    var v = ui.value.toExponential(2);
                    $('#slider-evalue-data').html(v);
                }
            }).slider("pips",{
                rest:'label',
                first:'label',
                last:'label',
                step: pstep,
                labels: labels
            }).slider("float",{
                labels: labels1
            });

            // identity slider

            var hi = Math.ceil(this.getHighestPct('Hsp_identity'));
            var lo = Math.floor(this.getLowestPct('Hsp_identity'));
            var step = (hi - lo) / 20;

            // pip setup
            var pstep = 5;
            var labels = [];
            for(var i=lo;i <= hi; i += step) {
                labels.push(""+Math.round(i));
            }

            $("#slider-identity").slider({
                min: lo,
                max: hi,
                step: step,
                change: function(event,ui) {
                    var v = ui.value + '%';
                    $('#slider-identity-data').html(v);
                }
            }).slider("pips",{
                rest:'label',
                first:'label',
                last:'label',
                step: pstep,
                //labels: labels,
                suffix: '%'
            }).slider("float");

            // gap slider

            var hi = Math.ceil(this.getHighestPct('Hsp_gaps'));
            var lo = Math.floor(this.getLowestPct('Hsp_gaps'));
            var step = (hi - lo) / 20;
            console.log("gap step",step);
            step = parseFloat(step.toFixed(2));
            console.log("gap step",step);

            var pstep = 5;
            pstep = parseFloat(pstep.toFixed(2));
            var labels = [];
            for(var i=lo;i <= hi; i += pstep*step) {
                labels.push(parseFloat(i.toFixed(2)));
            }
            console.log("gap labels",labels);
            $("#slider-gap").slider({
                min: lo,
                max: hi,
                step: step,
                change: function(event,ui) {
                    var v = ui.value + '%';
                    $('#slider-gap-data').html(v);
                }
            }).slider("pips",{
                rest: 'label',
                first: 'label',
                last: 'label',
                step: pstep,
                labels: labels,
                suffix: '%'
            }).slider("float");
            
            
        }
        */
    });
});
