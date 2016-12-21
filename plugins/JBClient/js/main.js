define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/Deferred',
        'dojo/dom-construct',
        'dojo/query',
        'JBrowse/Plugin',
// sails.io.js from jbserver/node_modules/sails.io.js
// socket.io.js from jbserver/node_modules/socket.io-client
        '/js/socket.io.js',
        '/js/sails.io.js'
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
