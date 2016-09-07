/* 
 * publish globals in a well known location
 */
var fs = require("fs");

var globalPath = "/etc/jbrowse";
var globalFile = globalPath + "/globals.dat";

module.exports = function (sails) {
   var mySails = sails; 
   return {

        initialize: function(cb) {
            console.log("jb-global initialize"); 

            if (!fs.existsSync(globalPath)){
                fs.mkdir(globalPath, function(err) {
                    if (err)    throw err;
                    storeGlobals();
                });
            }
            else {
                storeGlobals();
            }
           return cb();
        },
        routes: {
        }

    }
};

function storeGlobals () {
    
    
    var gStr = JSON.stringify(sails.config.globals.jbrowse,null,4);

    fs.writeFile(globalFile,gStr, function (err) {
        if (err) throw err;
        console.log("Global file: "+ globalFile);
    });
        
}

// check if object contains circular elements
function isCyclic (obj) {
  var seenObjects = [];

  function detect (obj) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.indexOf(obj) !== -1) {
        return true;
      }
      seenObjects.push(obj);
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && detect(obj[key])) {
          //console.log(obj, 'cycle at ' + key);
          console.log('cycle at ' + key);
          return true;
        }
      }
    }
    return false;
  }

  return detect(obj);
}
// copy object and remove known circular elements
function copySpecialObj(obj) {
    var obj2 = new Object();
    
    for(var key in obj) {
        if (!(key==="owner" || key==="_handle" || key==="stream" || key==="client" || key==="kue_queue")) {
           var str = "obj2."+key+"=obj[key]";
           eval(str);
        }
    }
    return obj2;
}

