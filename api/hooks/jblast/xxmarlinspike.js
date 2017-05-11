'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _requireAll = require('require-all');

var _requireAll2 = _interopRequireDefault(_requireAll);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var Marlinspike = (function () {
  function Marlinspike(sails, hookModule) {
    _classCallCheck(this, Marlinspike);

    this.sails = sails;
    this.name = this.constructor.name.toLowerCase();
    this.hookPath = _path2['default'].resolve(_path2['default'].dirname(hookModule.filename));

    this.sails.log.debug('hookPath:', this.hookPath);
  }

  _createClass(Marlinspike, [{
    key: 'configure',
    value: function configure() {
      return {};
    }
  }, {
    key: 'initialize',
    value: function initialize(next) {
      next();
    }
  }, {
    key: 'routes',
    value: function routes() {
      return {};
    }
  }, {
    key: 'defaults',
    value: function defaults(overrides) {
      return {};
    }
  }, {
    key: 'loadConfig',
    value: function loadConfig() {
        sails.log.debug('this.hookPath',this.hookPath);
      var configPath = _path2['default'].resolve(this.hookPath, '../../../config');
      this.sails.log.debug('marlinspike (' + this.name + '): loading config from ' + configPath);
      try {
        var configModules = (0, _requireAll2['default'])({
          dirname: configPath,
          filter: /(.+)\.js$/
        });
        var sailsConfig = _lodash2['default'].reduce(_lodash2['default'].values(configModules), _lodash2['default'].merge);
        _lodash2['default'].defaultsDeep(this.sails.config, sailsConfig);
      } catch (e) {
        this.sails.log.debug('marlinspike (' + this.name + '): no configuration found in ' + configPath + '. Skipping...');
      }
    }
  }, {
    key: 'loadModels',
    value: function loadModels() {
      this.sails.log.debug('marlinspike (' + this.name + '): loading Models...');
      try {
        var models = (0, _requireAll2['default'])({
          dirname: _path2['default'].resolve(this.hookPath, '../../models'),
          filter: /(.+)\.js$/
        });
        this.mergeEntities('models', models);
        this.sails.log.debug('models path',models.dirname);
      } catch (e) {
        this.sails.log.warn('marlinspike (' + this.name + '): no Models found. skipping');
      }
    }
  }, {
    key: 'loadPolicies',
    value: function loadPolicies() {
      this.sails.log.debug('marlinspike (' + this.name + '): loading Policies...');
      try {
        var policies = (0, _requireAll2['default'])({
          dirname: _path2['default'].resolve(this.hookPath, '../../policies'),
          filter: /(.+)\.js$/
        });
        this.sails.log.debug('policies path',policies.dirname);
        _lodash2['default'].extend(this.sails.hooks.policies.middleware, _lodash2['default'].mapKeys(policies, function (policy, key) {
          return key.toLowerCase();
        }));
      } catch (e) {
        this.sails.log.warn('marlinspike (' + this.name + '): no Policies found. skipping');
      }
    }
  }, {
    key: 'loadControllers',
    value: function loadControllers() {
      this.sails.log.debug('marlinspike (' + this.name + '): loading Controllers...');
      try {
        var controllers = (0, _requireAll2['default'])({
          dirname: _path2['default'].resolve(this.hookPath, '../../controllers'),
          filter: /(.+Controller)\.js$/,
          map: function map(name, path) {
            return name.replace(/Controller/, '');
          }
        });
        this.mergeEntities('controllers', controllers);
        this.sails.log.debug('controllers path',controllers.dirname);
      } catch (e) {
        this.sails.log.warn('marlinspike (' + this.name + '): no Controllers found. skipping');
      }
    }
  }, {
    key: 'loadServices',
    value: function loadServices() {
      var servicesPath = _path2['default'].resolve(this.hookPath, '../../services');
      this.sails.log.debug('marlinspike (' + this.name + '): loading Services from ' + servicesPath + '...');
      try {
        var services = (0, _requireAll2['default'])({
          dirname: servicesPath,
          filter: /(.+)\.js$/
        });
        this.mergeEntities('services', services);
      } catch (e) {
        this.sails.log.warn('marlinspike (' + this.name + '): no Services found. skipping');
      }
    }

    /**
     * load modules into the sails namespace
     */
  }, {
    key: 'mergeEntities',
    value: function mergeEntities(ns, entities) {
      this.sails[ns] = _lodash2['default'].merge(this.sails[ns] || {}, Marlinspike.transformEntities(entities));
    }
  }], [{
    key: 'transformEntities',
    value: function transformEntities(entities) {
      return _lodash2['default'].chain(entities).mapValues(function (entity, key) {
        return _lodash2['default'].defaults(entity, {
          globalId: key,
          identity: key.toLowerCase()
        });
      }).mapKeys(function (entity, key) {
        return key.toLowerCase();
      }).value();
    }
  }, {
    key: 'defaultConfig',
    value: function defaultConfig() {
      return {
        marlinspike: {
          controllers: true,
          models: true,
          services: true,
          policies: true
        }
      };
    }

    /**
     * Return a bona fide Sails hook object forged from the
     * specified class
     *
     * @param Class Hook
     */
  }, {
    key: 'createSailsHook',
    value: function createSailsHook(Hook) {
      var _this = this;

      return function (sails) {
        var hook = new Hook(sails);
        hook.loadConfig(Hook.constructor.name);

        var config = _lodash2['default'].defaults({}, Marlinspike.defaultConfig());
        if (hook.name in sails.config) _lodash2['default'].extend(config.marlinspike, sails.config[hook.name].marlinspike);

        return {
          name: _this.name,
          routes: hook.routes(),
          defaults: function defaults(overrides) {
            return _lodash2['default'].merge(config, hook.defaults(overrides));
          },
          configure: function configure() {
            if (config.marlinspike.services) hook.loadServices();
            if (config.marlinspike.models) hook.loadModels();
            if (config.marlinspike.controllers) hook.loadControllers();
            if (config.marlinspike.policies) hook.loadPolicies();

            hook.configure();
            sails.emit('hook:' + hook.name + ':configured');
          },
          initialize: function initialize(next) {

            hook.initialize(function () {
              sails.emit('hook:' + hook.name + ':initialized');
              next();
            });
          }
        };
      };
    }
  }]);

  return Marlinspike;
})();

exports['default'] = Marlinspike;
exports['default'] = Marlinspike;
module.exports = exports['default'];
