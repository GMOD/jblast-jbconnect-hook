/**
 * @module hooks/jblast
 * @description
 * This module is the main subclass of a Sails Hook incorporating *Marlinspike*.
 */
'use strict';

//var mapRoutes = require('./mapRoutes');
//var jblastProc = require('../../services/jblastProc');

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

//var _marlinspike = require('./marlinspike');
var _marlinspike = require('marlinspike');

var _marlinspike2 = _interopRequireDefault(_marlinspike);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }


var thisHook;

if (typeof sails !== 'undefined')
    thisHook = sails.hooks.jblast;
else
    thisHook = global.jtest_hook;   // this handles hbh-jblast npm test case.  It's a bit hackish

if (!thisHook) {
  var Hook = function (_Marlinspike) {
    _inherits(Hook, _Marlinspike);

    function Hook(sails) {
      _classCallCheck(this, Hook);

      return _possibleConstructorReturn(this, (Hook.__proto__ || Object.getPrototypeOf(Hook)).call(this, sails, module));
    }

    _createClass(Hook, [{
      key: 'defaults',
      value: function defaults(overrides) {
        // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/defaults#?using-defaults-as-a-function
      }
    }, {
      key: 'configure',
      value: function configure() {
        // this.sails = sails
        // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/configure
      }
    }, {
      key: 'initialize',
      value: function initialize(next) {
        // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/initialize
        //jblastProc.initialize(next);
        
        let sh = require("shelljs");

        sails.on('hook:orm:loaded', function() {
          //sails.on('lifted', function() {
  
              //sails.log(">>> jblastProc.initialize.lifted");
  
              // copy sample data
              //console.log(">>>> cwd",process.cwd());
              sh.exec('./jbutil --setupdata');
  
              // do something after hooks are loaded
              return next();
          });
  
        //return next();
      }
    }, {
      key: 'routes',
      value: function routes() {
        //sails.log('>>> setup jbh-jblast routes');
        //return mapRoutes.routes();
        //return {};
      }
    }]);

    return Hook;
  }(_marlinspike2.default);

  thisHook = _marlinspike2.default.createSailsHook(Hook);
}

exports.default = thisHook;
module.exports = exports['default'];

