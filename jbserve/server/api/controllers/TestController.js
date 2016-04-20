/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    testmsg: function (req, res) {
        console.log("jb-galaxy-kue-sync /jbapi/testmsg called");

        Test.findOne({name: 'eric'}).exec(function(err, foundUser){
          if (err) return res.serverError(err);
          if (!foundUser) return res.notFound();

          // This message can contain anything you want!
          Test.message(foundUser.id, {count: 12, hairColor: 'red'});

          return res.ok();
        });        
        
      return res.send("Hi there!");
    }	
	
};

