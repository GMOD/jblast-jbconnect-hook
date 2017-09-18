***
API
***

Module: ``controllers/AuthController``
**************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Authentication Controller

This is merely meant as an example of how your Authentication controller
should look. It currently includes the minimum amount of functionality for
the basics of Passport.js to work.



.. _module-controllers_AuthController.AuthController:

Member: ``AuthController``: 

.. _module-controllers_AuthController.providers:

Member: ``providers``: 

.. _module-controllers_AuthController.errors:

Member: ``errors``: 

.. _module-controllers_AuthController.redirectTo:

Member: ``redirectTo``: 

.. _module-controllers_AuthController.errors:

Member: ``errors``: 

.. _module-controllers_AuthController.loginstate:

Member: ``loginstate``: 

.. _module-controllers_AuthController.user:

Member: ``user``: 

.. _module-controllers_AuthController.redirectTo:

Member: ``redirectTo``: 





Module: ``controllers/DatasetController``
*****************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

DatasetController

Server-side logic for managing Dataset







Module: ``controllers/JobController``
*************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

JobController

Server-side logic for managing Job







Module: ``controllers/TrackController``
***************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Server-side logic for managing jbtracks







Module: ``controllers/UserController``
**************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

UserController

Server-side logic for managing users







Module: ``models/Dataset``
**************************


.. contents:: Local Navigation
   :local:

   
Description
===========




.. _module-models_Dataset.initialize:


Function: ``initialize``
========================



.. js:function:: initialize()

    
    
.. _module-models_Dataset.syncDatasets:


Function: ``syncDatasets``
==========================

sync globals globals.jbrowse.dataSet with Dataset model database

.. js:function:: syncDatasets()

    
    :return addTrackJson.indexAnonym$8: sync globals globals.jbrowse.dataSet with Dataset model database
    

.. _module-models_Dataset.attributes:

Member: ``attributes``: 

.. _module-models_Dataset.path:

Member: ``path``: 

.. _module-models_Dataset.id:

Member: ``id``: 





Module: ``models/Job``
**********************


.. contents:: Local Navigation
   :local:

   
Description
===========

TODO: You might write a short summary of how this model works and what it represents here.


.. _module-models_Job.initialize:


Function: ``initialize``
========================



.. js:function:: initialize()

    
    
.. _module-models_Job.start:


Function: ``start``
===================



.. js:function:: start()

    
    
.. _module-models_Job.monitor:


Function: ``monitor``
=====================



.. js:function:: monitor()

    
    
.. _module-models_Job.syncJobs:


Function: ``syncJobs``
======================

Sync kue[workflow] with Job model

.. js:function:: syncJobs()

    
    
.. _module-models_Job.processEvent:


Function: ``processEvent``
==========================

queue-enqueue
queue-start
queue-failed
queue-failed-attempt
queue-progress
queue-complete
queue-remove
queue-promotion

.. js:function:: processEvent(event, id, data)

    
    :param type event: queue-enqueue
    queue-start
    queue-failed
    queue-failed-attempt
    queue-progress
    queue-complete
    queue-remove
    queue-promotion
    :param type id: queue-enqueue
    queue-start
    queue-failed
    queue-failed-attempt
    queue-progress
    queue-complete
    queue-remove
    queue-promotion
    :param type data: queue-enqueue
    queue-start
    queue-failed
    queue-failed-attempt
    queue-progress
    queue-complete
    queue-remove
    queue-promotion
    :return undefined: queue-enqueue
    queue-start
    queue-failed
    queue-failed-attempt
    queue-progress
    queue-complete
    queue-remove
    queue-promotion
    
.. _module-models_Job.test:


Function: ``test``
==================



.. js:function:: test()

    
    
.. _module-models_Job.createOrUpdate:


Function: ``createOrUpdate``
============================



.. js:function:: createOrUpdate()

    
    
.. _module-models_Job.syncJobs:


Function: ``syncJobs``
======================



.. js:function:: syncJobs()

    
    

.. _module-models_Job.request:

Member: ``request``: 

.. _module-models_Job.async:

Member: ``async``: 

.. _module-models_Job.attributes:

Member: ``attributes``: 

.. _module-models_Job.count:

Member: ``count``: 

.. _module-models_Job.lastActiveCount:

Member: ``lastActiveCount``: 

.. _module-models_Job.job1:

Member: ``job1``: 

.. _module-models_Job.title:

Member: ``title``: 

.. _module-models_Job.to:

Member: ``to``: 

.. _module-models_Job.template:

Member: ``template``: 

.. _module-models_Job.nextSlide:

Member: ``nextSlide``: 

.. _module-models_Job.id:

Member: ``id``: 

.. _module-models_Job.url:

Member: ``url``: 

.. _module-models_Job.json:

Member: ``json``: 

.. _module-models_Job.found:

Member: ``found``: 

.. _module-models_Job.id:

Member: ``id``: 





Module: ``models/Passport``
***************************


.. contents:: Local Navigation
   :local:

   
Description
===========




.. _module-models_Passport.hashPassword:


Function: ``hashPassword``
==========================

Hash a passport password.

.. js:function:: hashPassword(password, next)

    
    :param Object password: Hash a passport password.
    :param function next: Hash a passport password.
    

.. _module-models_Passport.bcrypt:

Member: ``bcrypt``: 

.. _module-models_Passport.Passport:

Member: ``Passport``: Passport Model

The Passport model handles associating authenticators with users. An authen-
ticator can be either local (password) or third-party (provider). A single
user can have multiple passports, allowing them to connect and use several
third-party strategies in optional conjunction with a password.

Since an application will only need to authenticate a user once per session,
it makes sense to encapsulate the data specific to the authentication process
in a model of its own. This allows us to keep the session itself as light-
weight as possible as the application only needs to serialize and deserialize
the user, but not the authentication data, to and from the session.





Module: ``models/Track``
************************


.. contents:: Local Navigation
   :local:

   
Description
===========

TODO: You might write a short summary of how this model works and what it represents here.


.. _module-models_Track.startMonitor:


Function: ``startMonitor``
==========================



.. js:function:: startMonitor()

    
    
.. _module-models_Track.syncTracks:


Function: ``syncTracks``
========================



.. js:function:: syncTracks()

    
    
.. _module-models_Track.saveTracks:


Function: ``saveTracks``
========================



.. js:function:: saveTracks()

    
    
.. _module-models_Track.saveTracks:


Function: ``saveTracks``
========================

Save model tracks to trackList.json

.. js:function:: saveTracks(dataSet,)

    
    :param type dataSet,: if dataset is not defined, all models are committed.
    :return undefined: Save model tracks to trackList.json
    
.. _module-models_Track.syncTracks:


Function: ``syncTracks``
========================

Sync tracklist.json tracks with Track model (promises version)

.. js:function:: syncTracks(req, res, next)

    
    :param type req: Sync tracklist.json tracks with Track model (promises version)
    :param type res: Sync tracklist.json tracks with Track model (promises version)
    :param type next: Sync tracklist.json tracks with Track model (promises version)
    :return addTrackJson.indexAnonym$8: Sync tracklist.json tracks with Track model (promises version)
    

.. _module-models_Track.Promise:

Member: ``Promise``: 

.. _module-models_Track.fs:

Member: ``fs``: 

.. _module-models_Track.path:

Member: ``path``: 

.. _module-models_Track.deferred:

Member: ``deferred``: 

.. _module-models_Track.deepmerge:

Member: ``deepmerge``: 

.. _module-models_Track.attributes:

Member: ``attributes``: 

.. _module-models_Track.dataSetPath:

Member: ``dataSetPath``: 

.. _module-models_Track.dataSetPath:

Member: ``dataSetPath``: 

.. _module-models_Track.id:

Member: ``id``: 

.. _module-models_Track.data:

Member: ``data``: 

.. _module-models_Track.dataSetPath:

Member: ``dataSetPath``: 

.. _module-models_Track.lkey:

Member: ``lkey``: 

.. _module-models_Track.trackData:

Member: ``trackData``: 





Module: ``models/User``
***********************


.. contents:: Local Navigation
   :local:

   
Description
===========





.. _module-models_User.User:

Member: ``User``: 





Module: ``policies/bearerAuth``
*******************************


.. contents:: Local Navigation
   :local:

   
Description
===========

bearerAuth Policy

Policy for authorizing API requests. The request is authenticated if the 
it contains the accessToken in header, body or as a query param.
Unlike other strategies bearer doesn't require a session.
Add this policy (in config/policies.js) to controller actions which are not
accessed through a session. For example: API request from another client



.. _module-policies_bearerAuth.session:

Member: ``session``: 





Module: ``policies/isAdmin``
****************************


.. contents:: Local Navigation
   :local:

   
Description
===========

isAdmin policy



.. _module-policies_isAdmin.redirectTo:

Member: ``redirectTo``: 

.. _module-policies_isAdmin.redirectTo:

Member: ``redirectTo``: 





Module: ``policies/passport``
*****************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Passport Middleware

Policy for Sails that initializes Passport.js and as well as its built-in
session support.

In a typical web application, the credentials used to authenticate a user
will only be transmitted during the login request. If authentication
succeeds, a session will be established and maintained via a cookie set in
the user's browser.

Each subsequent request will not contain credentials, but rather the unique
cookie that identifies the session. In order to support login sessions,
Passport will serialize and deserialize user instances to and from the
session.

For more information on the Passport.js middleware, check out:
http://passportjs.org/guide/configure/







Module: ``policies/sessionAuth``
********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Simple policy to allow any authenticated user
                Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`







Module: ``services/jbRouteUtil``
********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module provides functions to inject plugin routes and library routes
that are accessible by the client side.


.. _module-services_jbRouteUtil.addPluginRoutes:


Function: ``addPluginRoutes``
=============================

inject client-side plugins into the clinet plugin directory as routes.
handles submodules plugins too.

.. js:function:: addPluginRoutes()

    
    :return undefined: inject client-side plugins into the clinet plugin directory as routes.
    handles submodules plugins too.
    
.. _module-services_jbRouteUtil.addLibRoutes:


Function: ``addLibRoutes``
==========================

Add library routes

.. js:function:: addLibRoutes()

    
    
.. _module-services_jbRouteUtil.addRoute:


Function: ``addRoute``
======================

Add a route

.. js:function:: addRoute(params, module, route, target)

    
    :param type params: Add a route
    :param type module: Add a route
    :param type route: Add a route
    :param type target: Add a route
    :return undefined: Add a route
    

.. _module-services_jbRouteUtil.fs:

Member: ``fs``: 

.. _module-services_jbRouteUtil.glob:

Member: ``glob``: 

.. _module-services_jbRouteUtil.merge:

Member: ``merge``: 





Module: ``services/passport``
*****************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Passport Service

A painless Passport.js service for your Sails app that is guaranteed to
Rock Your Socks™. It takes all the hassle out of setting up Passport.js by
encapsulating all the boring stuff in two functions:

  passport.endpoint()
  passport.callback()

The former sets up an endpoint (/auth/:provider) for redirecting a user to a
third-party provider for authentication, while the latter sets up a callback
endpoint (/auth/:provider/callback) for receiving the response from the
third-party provider. All you have to do is define in the configuration which
third-party providers you'd like to support. It's that easy!

Behind the scenes, the service stores all the data it needs within "Pass-
ports". These contain all the information required to associate a local user
with a profile from a third-party provider. This even holds true for the good
ol' password authentication scheme – the Authentication Service takes care of
encrypting passwords and storing them in Passports, allowing you to keep your
User model free of bloat.



.. _module-services_passport.provider:

Member: ``provider``: 

.. _module-services_passport.provider:

Member: ``provider``: 

.. _module-services_passport.identifier:

Member: ``identifier``: 

.. _module-services_passport.usernameField:

Member: ``usernameField``: 

.. _module-services_passport.Strategy:

Member: ``Strategy``: 

.. _module-services_passport.Strategy:

Member: ``Strategy``: 

.. _module-services_passport.callback:

Member: ``callback``: 

.. _module-services_passport.Strategy:

Member: ``Strategy``: 





