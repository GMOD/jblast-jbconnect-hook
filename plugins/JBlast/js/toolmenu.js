define(function(){
    return {

        init(browser,plugin) {
            let thisb = this;
            this.browser = browser;
            this.plugin = plugin; 
            console.log("JBlast toolmenu init");
            require([
                'dijit/MenuItem',
                'plugins/JBlast/js/queryDialog'
            ], function(dijitMenuItem,queryDialog){
                
                browser.addGlobalMenuItem( 'jblast', new dijitMenuItem({
                    id: 'menubar_blast_seq',
                    label: 'BLAST DNA sequence',
                    //iconClass: 'dijitIconFilter',
                    onClick: function() {
                        console.log(thisb,thisb.plugin);
                        thisb.plugin.getWorkflows(function(workflows){

                            if (workflows.length==0) {
                                alert("no workflows found");
                                return;
                            }
                                           
                            var dialog = new queryDialog({
                                browser:thisb.browser,
                                plugin:thisb.plugin,
                                workflows:workflows
                            }); 
                            dialog.show(function(x) {
                            });
                        });                       
                    }
                }));
                
                browser.addGlobalMenuItem( 'jblast', new dijitMenuItem({
                    id: 'menubar_blast_hilite',
                    label: 'BLAST highlighted region',
                    //iconClass: 'dijitIconFilter',
                    onClick: function() {
                        alert("BLAST highlight region");
                    }
                }));
                
                browser.renderGlobalMenu( 'jblast','JBlast', browser.menuBar );
    
                $("[widgetid*='dropdownbutton_jblast']").insertBefore("[widgetid*='dropdownbutton_help']");
            });

        }
    }
});