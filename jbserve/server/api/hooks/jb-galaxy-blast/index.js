/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

module.exports = function (sails) {

   return {

        initialize: function(cb) {
           console.log("jb-galaxy-blast initialize"); 
           // todo: check that galaxy is running

           return cb();
        },
        routes: {
           after: {
              'post /jbapi/blastregion': rest_BlastRegion,

                'post /jbapi/posttest': function (req, res, next) {
                  console.log("jb-galaxy-blast /jbapi/posttest called");
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                  res.send(req.body);
              },
              'get /jbapi/test': function (req, res, next) {
                  console.log("jb-galaxy-blast /jbapi/gettest called");
                  res.send({result:"jb-galaxy-blast gettest success"});
                  //return next();
              }
           }
        }

    }
};
console.log("Sails Hook: JBrowse-Galaxy Blaster");


var request = require('request');
//var prettyjson = require('prettyjson');
//var prompt = require('prompt');
var fs = require('fs');

var filePath = "/var/www/html/jb-galaxy-blaster/tmp/";
var urlPath = "http://localhost/jb-galaxy-blaster/tmp/";

// api key on local
var galaxyUrl = "http://192.168.56.102:8080";
var apiKey = "2bb67717b99a37e92e59003f93625c9b";

/*
 * this stuff used for standard express
 * 
 
var express = require('express');
var app = express();

// for handling POST requests 
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Mount kue JSON api
app.post('/jbapi/blastregion', rest_BlastRegion);

app.listen(3001);
*/

// REST function for /jbapi/blastregion
function rest_BlastRegion(req,res) {
    var region = req.body.region;
    
    //console.dir(req.body);
    
    console.log("/jbapi/blastregion");
    console.log(region);

    
    //todo: verify the operation can be run
    // for example, if it is already running, don't run again.
    
    
    var d = new Date();
    
    var theFile = d.getTime()+".fasta";
    
    // write the received region into a file
    ws = fs.createWriteStream(filePath+theFile);
    ws.write(region);
    ws.end();
    
    // import into galaxy
    importFiles(urlPath+theFile,function(data) {
        console.log("completed import");
        
        var args = {
            hid: data.outputs[0].hid,
            id: data.outputs[0].id,
            name: data.outputs[0].name
        };
        
        execTool_megablast(args,function(results) {
            console.log("completed megablast submission");
        });

    });
    
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.send({result:"success"});
}

// fetch file(s) from url (import file into galaxy)
function importFiles(theFile,postFn) {
    console.log('uploadFiles()');
    
    var myPostFn = postFn;
    
    var params = 
    {
            "tool_id": "upload1",
            "history_id": "f597429621d6eb2b",   // must reference a history
            "inputs": {
  
                "dbkey":"?",
                "file_type":"auto",
                "files_0|type":"upload_dataset",
                "files_0|space_to_tab":null,
                "files_0|to_posix_lines":"Yes",
                "files_0|url_paste":theFile
            }
    };  
    var jsonstr = JSON.stringify(params);

    request.post({
        url: galaxyUrl+"/api/tools"+"?key="+apiKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
            //'Referrer':galaxyUrl,
            //'X-Requested-With':'XMLHttpRequest'
        },
        json: params
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            //console.log(response.statusCode, body);
            //JSON.stringify(eval("(" + str + ")"));
            //var result = JSON.parse(body);
            var result = body;
            //console.dir(result);
            console.log("imported:");
            console.log(result.outputs[0].hid);
            console.log(result.outputs[0].id);
            console.log(result.outputs[0].name);
            myPostFn(result);
        }
    });    
    
}


// run megablast
function execTool_megablast(args,postFn){
    console.log('execTool_blastPlus()');
    console.dir(args);
    var myPostFn = postFn;
    
    // todo: pass in the current history somehow
    
    var params = 
    {
      "tool_id":"toolshed.g2.bx.psu.edu/repos/devteam/megablast_wrapper/megablast_wrapper/1.2.0",
      "tool_version":"1.2.0",
      "history_id": "f597429621d6eb2b",   // must reference a history, todo: make this a variable
      "inputs":{
        "input_query":{
          "batch":false,
          "values":[
            {
              "hid": args.hid,
              "id": args.id,
              "name": args.name,
              "src":"hda"
            }
          ]
        },
        "source_select":"13apr2014-htgs",   // todo: make this all the following configurable
        "word_size":"28",
        "iden_cutoff":"90",
        "evalue_cutoff":"0.001",
        "filter_query":"yes"
      }
    };
    var jsonstr = JSON.stringify(params);

    request.post({
        url: galaxyUrl+"/api/tools"+"?key="+apiKey, 
        method: 'POST',
        //qs: params,
        headers: {
            //'Content-Type': 'application/json',
            //'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding' : 'gzip, deflate',
            'Accept-Language' : 'en-US,en;q=0.5',
            'Content-Length' : jsonstr.length
            //'Referrer':galaxyUrl,
            //'X-Requested-With':'XMLHttpRequest'
        },
        json: params
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            var result = body;
            //console.log(response.statusCode, body);
            myPostFn(result);
        }
    });    
    
}
