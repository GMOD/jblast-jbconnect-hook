define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/aspect',
    'dijit/focus',
    'dijit/Dialog',
    'dijit/form/Button',
    'dijit/form/RadioButton',
    'dijit/form/CheckBox',
    'dijit/form/TextBox',
    'dijit/form/Textarea',
    "dojo/store/Memory",
    "dijit/form/ComboBox",
    'JBrowse/View/Dialog/WithActionBar'
],
function(
    declare,
    dom,
    aspect,
    focus,
    Dialog,
    dButton,
    dRButton,
    dCheckBox,
    dTextBox,
    dTextArea,
    Memory,
    ComboBox,
    ActionBarDialog
) {

return declare( ActionBarDialog, {

constructor: function(args) {
    this.plugin = args.plugin;
    this.browser = args.browser;
    this.workflows = args.workflows;
    var thisB = this;

    aspect.after( this, 'hide', function() {
          focus.curNode && focus.curNode.blur();
          setTimeout( function() { thisB.destroyRecursive(); }, 500 );
    });
},

_dialogContent: function () {
    
    let workflows =this.workflows;
    let wfStr = "";
    for(var i in workflows) {
        if (!workflows[i].deleted) {
            wfStr += "<option value='"+workflows[i].id+"'>"+workflows[i].name+"</option>";
        }
    }
    let container = dom.create('div', { className: 'search-dialog' } );

    let workflowCombo = dom.create('div', {
        id: 'workflow-div',
        className: 'section',
        innerHTML:
            '<span classs="header">Select Workflow</span><br />'+ 
            '<select id="workflow-combo" name="workflow">'+wfStr+'</select>'

    },container);

    let cfg = this.browser.config;
    
    console.log("demo",cfg);
    if (cfg.demo && cfg.demo.blastButtons && cfg.demo.blastButtons[0]) {
        let blastButtons = dom.create('div', {
            id: 'blastButtons',
            style: {border: "1px solid lightgrey",padding: "5px"}
        },container);

        let btn = cfg.demo.blastButtons;

        for(let i = 0;i < btn.length;i++) {
            new dButton({
                label: btn[i].button,
                title: btn[i].description,
                onClick: function() {
                    console.log("click demo",btn[i].sequence.join(""));
                    $('#sequence-text').val(btn[i].sequence.join(""));
                }
            })
            .placeAt( blastButtons );
        }
    }


    // Render textarea box
    var searchBoxDiv = dom.create('div', {
        className: "section",
        innerHTML:
            '<span classs="header">Input sequence to BLAST</span><br />'+ 
            '<textarea id="sequence-text" class="seq-text" />'
    }, container );

    /*
    function makeRadio( args, parent ) {
        var label = dom.create('label', {}, parent );
        var radio = new dRButton( args ).placeAt( label );
        dom.create('span', { innerHTML: args.label }, label );
        return radio;
    }
    
    makeRadio( { name: 'translate', value: 'no', label: 'DNA', checked: true }, translateDiv );
    content.translate = makeRadio( { name: 'translate', value: 'yes', label: 'AA' }, translateDiv );
    */


    return container;
},

_getSearchParams: function() {
    var content = this.content;
    //console.log("dialog result",$('.search-dialog #workflow-combo').find('option:selected').val(),$('.search-dialog #sequence-text').val());
    return {
        workflow: $('.search-dialog #workflow-combo').find('option:selected').val(),
        sequence: $('.search-dialog #sequence-text').val()
    };
},

_fillActionBar: function ( actionBar ) {
    let thisB = this;
    let browser = this.browser;

    new dButton({
            label: 'Submit',
            //iconClass: 'dijitIconBookmark',
            onClick: function() {
                var searchParams = thisB._getSearchParams();
                thisB.callback( searchParams );
                thisB.hide();

                // check if query size too big
                let bpSize = thisB.countSequence(searchParams.sequence);
                if (browser.jblast.isOversized(bpSize)) return;

                var postData = {
                    service: "jblast",
                    dataset: browser.config.dataRoot,
                    region: searchParams.sequence,
                    workflow: searchParams.workflow,
                    refseq:Object.keys(browser.allRefs)[0],
                    unmappedSeq: true
                };
                console.log("post data",postData);
                $.post( "/job/submit", postData , function( result ) {

                    // open job queue panel
                    $('#extruderRight').openMbExtruder(true);$('#extruderRight').openPanel();

                    // show confirm submit box
                    var confirmBox = new Dialog({ title: 'Confirmation' });
                    dojo.create('div', {
                        id: 'confirm-btn',
                        innerHTML: 'BLAST submitted...'
                    }, confirmBox.containerNode );
                    confirmBox.show();

                    // close confirm box
                    setTimeout(function(){ confirmBox.destroyRecursive(); }, 2000);

                }, "json")
                .fail(function(jqxhr, textStatus, errorThrown) {
                    alert( "Job submit failed: "+jqxhr.responseText+" ("+jqxhr.status+"-"+jqxhr.statusText+")" );
                });
            }
        })
        .placeAt( actionBar );
    new dButton({
            label: 'Cancel',
            //iconClass: 'dijitIconDelete',
            onClick: function() {
                thisB.callback( false );
                thisB.hide();
            }
        })
        .placeAt( actionBar );
},

show: function ( callback ) {
    this.callback = callback || function() {};
    this.set( 'title', "BLAST a DNA sequence");
    this.set( 'content', this._dialogContent() );
    this.inherited( arguments );
    focus.focus( this.closeButtonNode );
},

countSequence(seq) {
    let lines = seq.split("\n");
    let count = 0;

    for(let i=0;i<lines.length;i++) {
        console.log(i,lines[i]);
        if (lines[i].charAt(0) !== ">") {
            count += lines[i].length;
        }
    }
   
    return count;
}


});
});
