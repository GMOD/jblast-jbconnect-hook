define([
           'dojo/_base/declare',
           'dojo/dom-construct',

           'dijit/Toolbar',
           'dijit/form/Button',
           'JBrowse/Util',
           'JBrowse/has',
           'JBrowse/InHookMixin',
           'dojo/request/xhr',
           'dijit/Dialog'
       ],
       function( declare, dom, Toolbar, Button, Util, has, InHook, xhr,Dialog) {

return declare([InHook],
{

    constructor: function( args ) {
        
        //this.inceptInit();
        
        this.width       = args.width || 78;
        this.htmlMaxRows = args.htmlMaxRows || 15;
        this.track = args.track;
        this.canSaveFiles = args.track &&  args.track._canSaveFiles && args.track._canSaveFiles();
        this.dialog = null;
    },
    renderHTML: function( region, seq, parent ) {
        var thisB = this;
        var text = this.renderText( region, seq );
        var lineCount = text.match( /\n/g ).length + 1;
        var container = dom.create('div', { className: 'fastaView' }, parent );

        if( this.canSaveFiles ) {
            var toolbar = new Toolbar().placeAt( container );
            var thisB = this;
            toolbar.addChild( new Button({ 
                iconClass: 'dijitIconFunction',
                label: 'BLAST',
                title: 'BLAST this feature',
                disabled: ! has('save-generated-files'),
                onClick: function() {
                    thisB.blastDialog(text);
                }
            }));
                              
            toolbar.addChild( new Button(
                                  { iconClass: 'dijitIconSave',
                                    label: 'FASTA',
                                    title: 'save as FASTA',
                                    disabled: ! has('save-generated-files'),
                                    onClick: function() {
                                        thisB.track._fileDownload(
                                            { format: 'FASTA',
                                              filename: Util.assembleLocString(region)+'.fasta',
                                              data: text
                                            });
                                    }
                                  }));
        }

        var textArea = dom.create('textarea', {
                        className: 'fasta',
                        cols: this.width,
                        rows: Math.min( lineCount, this.htmlMaxRows ),
                        readonly: true
                    }, container );
        var c = 0;
        textArea.innerHTML = text.replace(/\n/g, function() { return c++ ? '' : "\n"; });
        return container;
    },
    blastDialog: function (region) {
        var regionB = region;
        var thisB = this;
        if (!this.dialog) {

            this.dialog = new Dialog({ title: 'Process BLAST' });
            dojo.create('div', {
                id: 'blast-box',
                innerHTML: 'This will process a BLAST search against the selected database.<br/><button id="submit-btn" type="button">Submit</button> <button id="cancel-btn" type="button">Cancel</button>'
            }, this.dialog.containerNode /* the content portion of the dialog you're creating */);
            //var div = dojo.create('div', {}, this.dialog.containerNode);
            this.confirmBtn = null;
            
            var submitBtn = new Button({
                label: "Submit",
                onClick: function(){
                    // do http post
                    var xhrArgs = {
                      url: 'http://192.168.56.102:1337/jbapi/blastregion',
                      postData: {region: regionB},
                      handleAs: "json",
                      load: function(data){
                        console.log("POST result");
                        console.dir(data);
                      },
                      error: function(error){
                          alert(error);
                      }
                    }
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
    destroyBlastDialog: function () {
        this.dialog.destroyRecursive();
        delete this.dialog;
        this.dialog = null;
    }, 
    renderText: function( region, seq ) {
        return '>' + region.ref
            + ' '+Util.assembleLocString(region)
            + ( region.type ? ' class='+region.type : '' )
            + ' length='+(region.end - region.start)
            + "\n"
            + this._wrap( seq, this.width );
    },
    _wrap: function( string, length ) {
        length = length || this.width;
        return string.replace( new RegExp('(.{'+length+'})','g'), "$1\n" );
    }
});
});


