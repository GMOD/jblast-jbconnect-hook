/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

module.exports = function galaxyKueSyncHook(sails) {
   return {

        initialize: function(cb) {
            console.log("Sails Hook: jb-trackwatch initialized");
            
            return cb();
        },
        routes: {
           before: {
               
              'get /jbtrack/test': function (req, res, next) {
                  console.log("jb-trackwatch /jbtrack/test called");
                  res.send({result:"success"});
                  //return next();
              }
           }
        }
   };
}

