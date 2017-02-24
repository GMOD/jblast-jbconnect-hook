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
        var thisB = this;
        var browser = this.browser;
        console.log("plugin: JBClient");
        
        
        var io = sailsIOClient(socketIOClient);
        //io.sails.url = 'http:/example.com';
        setTimeout(function(){
            browser.publish ('/jbrowse/jbclient_ready',io);
        },500);
        
        $.get("/loginstate",function(data) {
            console.log("loginstate",data);
            var txt = "";
            if (data.loginstate !== true) {
                txt += '<form id="form-login" role="form" action="/auth/local?next=/jbrowse" method="post">';
                txt +=  '<input type="text" name="identifier" placeholder="Username or Email">';
                txt +=  '<input type="password" name="password" placeholder="Password">';
                txt +=  '<button type="submit">Sign in</button>';
                txt += '</form>';

                txt += '<a class="btn btn-secondary" type="button" href="/register">Register</a>';
            }
            else {
                //txt += data.user.username;
                //txt += 
                txt +=    '<div class="dropdown">';
                txt +=    '      <button class="btn btn-secondary dropdown-toggle jb-dropdown" type="button" id="dropdownMenuButton" data-toggle="dropdown" >';
                txt +=    '      <img src="smiley.gif"></img>';
                txt +=    data.user.username;
                txt +=    '      </button>';
                txt +=    '      <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">';
                txt +=    '        <li><a id="button-manage" class="dropdown-item jb-menuitem" href="#">Manage</a></li>';
                txt +=    '        <li><a id="button-logout" class="dropdown-item jb-menuitem" href="/logout?next=/jbrowse">Logout</a></li>';
                txt +=    '      </ul>';
                txt +=    '    </div>';
            }
        $( "body" ).append( "<div class='jb-loginbox'>"+txt+"</div>" );
        });
        /*
         * class override function intercepts
         */
        browser.afterMilestone( 'loadConfig', function() {
            if (typeof browser.config.classInterceptList === 'undefined') {
                browser.config.classInterceptList = {};
            }
            // override Browser
            require(["dojo/_base/lang", "JBrowse/Browser"], function(lang, Browser){
                lang.extend(Browser, {
                    extendedRender: function(track, f, featDiv, container) {
                        setTimeout(function() {
                            thisB.insertFeatureDetail(track);
                        },1000);
                    }
                });
            });
        }); 
        browser.afterMilestone( 'initView', function() {

            $('#form-login').attr('action','/auth/local?next='+thisB.browser.makeCurrentViewURL());
            $('#button-logout').attr('href','/logout?next='+thisB.browser.makeCurrentViewURL());

        });
    },
    Browser_override_makeCurrentViewURL(x) {
        
    }

});
});
