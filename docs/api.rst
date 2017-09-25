***
API
***


.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``controllers/AuthController``
**************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Authentication Controller

It currently includes the minimum amount of functionality for
the basics of Passport.js to work.








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``models/Dataset``
**************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Dataset is a model that represents the JBrowse dataset.  Generally, this includes
path to the dataset and some of the data contained in trackList.json.

Datasets known to JBServer are defined in config/globals.js
(see: :ref:`jbs-globals-config`)
     
Ref: `Sails Models and ORM <http://sailsjs.org/documentation/concepts/models-and-orm/models>`_


.. _module-models_Dataset.initialize:


Function: ``initialize``
========================

Initializes datasets as defined in config/globals.js.
(see: :ref:`jbs-globals-config`)

.. js:function:: initialize(cb)

    
    :param function cb: callback function
    :return undefined: Initializes datasets as defined in config/globals.js.
    (see: :ref:`jbs-globals-config`)
    
.. _module-models_Dataset.syncDatasets:


Function: ``syncDatasets``
==========================

Sync datasets, defined in globals with database.

todo: need to improve, perhaps use async?

.. js:function:: syncDatasets()

    
    :param syncDatasets(): cb - callback function
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``models/Job``
**********************


.. contents:: Local Navigation
   :local:

   
Description
===========

Job model is an encapsulation of the `Kue <https://automattic.github.io/kue/>`_ job framework.

Kue uses `redis <https://redis.io/>`_ database.  This model synchronizes the Job database with the redis data
through the use of Kue's API.
 
Events

+----------------------------+
| * queue-enqueue            |
| * queue-start              |
| * queue-failed             |
| * queue-failed-attempt     |
| * queue-progress           |
| * queue-complete           |
| * queue-remove             |
| * queue-promotion          |
+----------------------------+

Ref: `Sails Models and ORM <http://sailsjs.org/documentation/concepts/models-and-orm/models>`_


.. _module-models_Job.initialize:


Function: ``initialize``
========================

Obsolete

.. js:function:: initialize()

    
    
.. _module-models_Job.start:


Function: ``start``
===================

start the monitor

.. js:function:: start()

    
    
.. _module-models_Job.monitor:


Function: ``monitor``
=====================

monitor events from the kue framework and translate to Job events

.. js:function:: monitor()

    
    
.. _module-models_Job.syncJobs:


Function: ``syncJobs``
======================

Sync kue[workflow] with Job model

.. js:function:: syncJobs()

    
    
.. _module-models_Job.processEvent:


Function: ``processEvent``
==========================

Send a Job framework event

.. js:function:: processEvent(event, id, data)

    
    :param type event: Send a Job framework event
    :param type id: Send a Job framework event
    :param type data: Send a Job framework event
    
.. _module-models_Job.test:


Function: ``test``
==================



.. js:function:: test()

    
    
.. _module-models_Job.createOrUpdate:


Function: ``createOrUpdate``
============================

Create or update a job in the sails framework based on kue job data

.. js:function:: createOrUpdate(, mJob)

    
    :param createOrUpdate(, mJob): kJob - Kue framework job
    :param object mJob: Sails framework job
    
.. _module-models_Job.syncJobs:


Function: ``syncJobs``
======================

Synchronize Jobs with the Kue framework

.. js:function:: syncJobs()

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``models/Passport``
***************************


.. contents:: Local Navigation
   :local:

   
Description
===========

The Passport model handles associating authenticators with users. An authen-
ticator can be either local (password) or third-party (provider). A single
user can have multiple passports, allowing them to connect and use several
third-party strategies in optional conjunction with a password.

Since an application will only need to authenticate a user once per session,
it makes sense to encapsulate the data specific to the authentication process
in a model of its own. This allows us to keep the session itself as light-
weight as possible as the application only needs to serialize and deserialize
the user, but not the authentication data, to and from the session.


.. _module-models_Passport.hashPassword:


Function: ``hashPassword``
==========================

Hash a passport password.

.. js:function:: hashPassword(password, next)

    
    :param Object password: Hash a passport password.
    :param function next: Hash a passport password.
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``models/Track``
************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Track is a model for a list of tracks that are in the ``trackList.json``'s ``[tracks]`` section.

Ref: `Sails Models and ORM <http://sailsjs.org/documentation/concepts/models-and-orm/models>`_


.. _module-models_Track.startMonitor:


Function: ``startMonitor``
==========================

Obsolete

.. js:function:: startMonitor()

    
    
.. _module-models_Track.syncTracks:


Function: ``syncTracks``
========================

Sync tracklist.json tracks with Track model (promises version)

todo: dataSet should accept string or dataSet object id

.. js:function:: syncTracks(dataSet,)

    
    :param string dataSet,: if dataset is not defined, all models are committed.
    
.. _module-models_Track.saveTracks:


Function: ``saveTracks``
========================



.. js:function:: saveTracks()

    
    
.. _module-models_Track.saveTracks:


Function: ``saveTracks``
========================



.. js:function:: saveTracks()

    
    
.. _module-models_Track.syncTracks:


Function: ``syncTracks``
========================



.. js:function:: syncTracks()

    
    

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






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``models/User``
***********************


.. contents:: Local Navigation
   :local:

   
Description
===========

User is the data model for a user.








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

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








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``policies/isAdmin``
****************************


.. contents:: Local Navigation
   :local:

   
Description
===========

isAdmin policy provides passage if the user contains the property admin: true.








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

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








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``policies/sessionAuth``
********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Simple policy to allow any authenticated user.
Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`

Ref: `Sails Policies Concepts <http://sailsjs.org/#!/documentation/concepts/Policies>`_








.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

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

    
    :param addPluginRoutes(): params
    
.. _module-services_jbRouteUtil.addLibRoutes:


Function: ``addLibRoutes``
==========================

Add library routes

.. js:function:: addLibRoutes()

    
    :param addLibRoutes(): params
    
.. _module-services_jbRouteUtil.addRoute:


Function: ``addRoute``
======================

Add a route

.. js:function:: addRoute(params, module, route, target)

    
    :param object params: Add a route
    :param string module: Add a route
    :param string route: Add a route
    :param string target: Add a route
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

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







