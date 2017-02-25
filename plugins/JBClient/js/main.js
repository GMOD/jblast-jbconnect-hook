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
                txt += '<div class="dropdown">';
                txt += '<button class="btn btn-secondary dropdown-toggle jb-dropdown jb-login-icon" type="button" id="dropdownMenuButton" data-toggle="dropdown" >Login</button>';
                txt += '<div class="dropdown-menu dropdown-menu-right panel panel-default jb-login-panel"><div class="panel-body">';
                txt +=   '<form id="form-login" class="form-group" role="form" action="/auth/local?next=/jbrowse" method="post">';
                txt +=     '<div class="input-group">';
                txt +=       '<input class="form-control" type="text" name="identifier" placeholder="Username">';
                txt +=       '<span class="input-group-addon"></span>';
                txt +=       '<input class="form-control" type="password" name="password" placeholder="Password">';
                txt +=     '</div>';
                txt +=     '<button class="btn btn-secondary jb-form-button" type="submit">Sign in</button>';
                txt +=     '<button class="btn btn-secondary jb-form-button" type="button" onclick="window.location=\'/register\'">Register</button>';
                txt +=   '</form>';
                txt += '</div></div>';
                txt += '</div>';
            }
            else {
                txt +=    '<div class="dropdown">';
                txt +=      '<button class="btn btn-secondary dropdown-toggle jb-dropdown jb-user-icon" type="button" id="dropdownMenuButton" data-toggle="dropdown" >';
                txt +=      data.user.username;
                txt +=      '</button>';
                txt +=      '<ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">';
                txt +=        '<li><a id="button-manage" class="dropdown-item jb-menuitem" href="#">Manage</a></li>';
                txt +=        '<li><a id="button-logout" class="dropdown-item jb-menuitem" href="/logout?next=/jbrowse">Logout</a></li>';
                txt +=      '</ul>';
                txt +=    '</div>';
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
            // inject the actual login/logou redirect
            $('#form-login').attr('action','/auth/local?next='+thisB.browser.makeCurrentViewURL());
            $('#button-logout').attr('href','/logout?next='+thisB.browser.makeCurrentViewURL());

        });
    },
    Browser_override_makeCurrentViewURL(x) {
        
    }

});
});
