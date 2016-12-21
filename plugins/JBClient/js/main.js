define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/Deferred',
        'dojo/dom-construct',
        'dojo/query',
        'JBrowse/Plugin',
// sails.io.js from node_modules/sails.io.js
// socket.io.js from node_modules/socket.io-client
        '/socket.io.js',
        '/sails.io.js'
    ],
       function(
        declare,
        lang,
        Deferred,
        domConstruct,
        query,
        JBrowsePlugin,
        socketIOClient,
        sailsIOClient
       ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {
        var browser = this.browser;
        console.log("plugin: JBClient");
        
        
        var io = sailsIOClient(socketIOClient);
        //io.sails.url = 'http:/example.com';
        setTimeout(function(){
            browser.publish ('/jbrowse/jbclient_ready',io);
        },500);

    }

});
});
