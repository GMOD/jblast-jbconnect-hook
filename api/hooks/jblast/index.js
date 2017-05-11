'use strict';

var jblastProc = require('./jblastProc');

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

var thisHook = sails.hooks.jblast;

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
        jblastProc.initialize(next);
        //return next();
      }
    }, {
      key: 'routes',
      value: function routes() {
        return {
            // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/routes
            
             after: {
                'post /jbapi/workflowsubmit': 'jblastProc.workflowSubmit',
                'get /jbapi/getworkflows': 'jblastProc.getWorkflows',
                'post /jbapi/setfilter': 'jblastProc.setFilter',
                'get /jbapi/getblastdata/:asset/:dataset': 'jblastProc.getBlastData',
                'get /jbapi/gettrackdata/:asset/:dataset': 'jblastProc.getTrackData',
                'get /jbapi/gethitdetails/:asset/:dataset/:hitkey': 'jblastProc.getHitDetails',
                'get /jbapi/lookupaccession/:accession': 'jblastProc.lookupAccession'
                
            }
        };
      }
    }]);

    return Hook;
  }(_marlinspike2.default);

  thisHook = _marlinspike2.default.createSailsHook(Hook);
}

exports.default = thisHook;
module.exports = exports['default'];

/*
let thisHook = sails.hooks.jblast;

import _ from 'lodash'
import Marlinspike from 'marlinspike'

if (!thisHook) {
  class Hook extends Marlinspike {

    constructor(sails) {
      super(sails, module)
    }

    defaults (overrides) {
      // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/defaults#?using-defaults-as-a-function
    }

    configure () {
      // this.sails = sails
      // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/configure
    }

    initialize (next) {
      // http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/initialize
      return next();
    }

    routes () {
    }
  }

  thisHook = Marlinspike.createSailsHook(Hook)
}

export default thisHook;
*/