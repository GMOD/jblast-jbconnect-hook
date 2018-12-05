***
API
***


.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``hooks/jblast``
************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module is the main subclass of a Sails Hook incorporating *Marlinspike*.


.. _module-hooks_jblast._interopRequireDefault:


Function: ``_interopRequireDefault``
====================================



.. js:function:: _interopRequireDefault()

    
    
.. _module-hooks_jblast._classCallCheck:


Function: ``_classCallCheck``
=============================



.. js:function:: _classCallCheck()

    
    
.. _module-hooks_jblast._possibleConstructorReturn:


Function: ``_possibleConstructorReturn``
========================================



.. js:function:: _possibleConstructorReturn()

    
    
.. _module-hooks_jblast._inherits:


Function: ``_inherits``
=======================



.. js:function:: _inherits()

    
    
.. _module-hooks_jblast.value:


Function: ``value``
===================



.. js:function:: value()

    
    
.. _module-hooks_jblast.value:


Function: ``value``
===================



.. js:function:: value()

    
    
.. _module-hooks_jblast.value:


Function: ``value``
===================



.. js:function:: value()

    
    
.. _module-hooks_jblast.value:


Function: ``value``
===================



.. js:function:: value()

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/basicWorkflowService``
*****************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This is a job services that executes local NCBI blast by either excuting 
NCBI.blast or Sim.blast, defined by the job.

This job service is functionally equivelant to galaxyService, which
does blast search through Galaxy API.

Job submission example:
::
  var postData = {
        service: "jblast",
        dataset: "sample_data/json/volvox",
        region: ">ctgA ctgA:44705..47713 (- strand) class=remark length=3009\nacatccaatggcgaacataa...gcgagttt",
        workflow: "NCBI.blast.workflow.js"
    };
  $.post( "/job/submit", postData , function( result ) {
      console.log( result );
  }, "json");

Configuration:
::
       jblast: {
          // The subdir where blast results will be deposited (i.e. ``sample_data/json/volvox/jblastdata``)
          blastResultPath: "jblastdata",
          
          // The category for successful blast results in the track selector
          blastResultCategory: "JBlast Results",
          
          // Track template of the blast result track that will be inserted in trackList.json
          trackTemplate: "jblastTrackTemplate.json",
          
          // Type of file that will be imported for processing blast.
          import: ["blastxml"],
          
          
          // BLAST profiles
          // blast profiles are parameter lists that translate to blastn cli parameters sets
          // (i.e. for "remote_htgs" would translate to "blastn -db htgs -remote")
          // These will override any default parameters defined in ``blastjs``
          // 
          // Blast profiles generally apply to basicWorkflowService only
          // and do no apply to galaxyService.
          // 
          // Our example uses a subset of htgs, an NCBI curated blast database.
          // So, it is our default profile.
          defaultBlastProfile: 'htgs',
          blastProfiles: {
              'htgs': {
                  'db': 'htgs'
              },
              'remote_htgs': {
                  'db': 'htgs',
                  'remote': ""
              }
          }
      },
      // list of services that will get registered.
      services: {
          'basicWorkflowService':     {name: 'basicWorkflowService',  type: 'workflow', alias: "jblast"},
          'filterService':            {name: 'filterService',         type: 'service'},
          'entrezService':            {name: 'entrezService',         type: 'service'}
      },

Job queue entry example:
::
    {
      "id": 145,
      "type": "workflow",
      "progress": "0",
      "priority": 0,
      "data": {
        "service": "jblast",
        "dataset": "sample_data/json/volvox",
        "region": ">ctgA ctgA:44705..47713 (- strand) class=remark length=3009\nacatccaatggcgaacataagcgagttttgt...tggccc",
        "workflow": "NCBI.blast.workflow.js",
        "name": "NCBI.blast.workflow.js",
        "sequence": {
          "seq": "ctgA",
          "start": "44705",
          "end": "47713",
          "strand": "-",
          "class": "remark",
          "length": "3009"
        },
        "blastData": {
          "name": "JBlast",
          "blastSeq": "/var/www/html/jbconnect/node_modules/jbrowse//sample_data/json/volvox/jblastdata/blast_region1517044304838.fa",
          "offset": "44705"
        },
        "seqFile": "http://localhost:1337/jbrowse/sample_data/json/volvox/jblastdata/blast_region1517044304838.fa",
        "blastOptions": {
          "db": "htgs"
        },
        "blastOptionFile": "/tmp/blast_option1517044304843.json"
      },
      "state": "failed",
      "promote_at": "1517044302842",
      "created_at": "1517044302842",
      "updated_at": "1517044310134",
      "createdAt": "2018-02-01T05:38:27.406Z",
      "updatedAt": "2018-02-01T05:38:27.406Z"
    },


.. _module-services_basicWorkflowService.init:


Function: ``init``
==================



.. js:function:: init()

    
    
.. _module-services_basicWorkflowService.validateParams:


Function: ``validateParams``
============================

job service validate

.. js:function:: validateParams(params)

    
    :param object params: parameters
    :return int: 0 if successful
    
.. _module-services_basicWorkflowService.generateName:


Function: ``generateName``
==========================

job service generate name.

.. js:function:: generateName(params)

    
    :param object params: parameters
    :return string: string job name
    
.. _module-services_basicWorkflowService.get_workflows:


Function: ``get_workflows``
===========================

Enumerate available workflow scripts

.. js:function:: get_workflows(req, res)

    
    :param object req: request
    :param object res: response
    
.. _module-services_basicWorkflowService.get_hit_details:


Function: ``get_hit_details``
=============================



.. js:function:: get_hit_details()

    
    
.. _module-services_basicWorkflowService.beginProcessing:


Function: ``beginProcessing``
=============================

Job service - job execution entry point

.. js:function:: beginProcessing(kJob)

    
    :param object kJob: reference to the kue job object
    
.. _module-services_basicWorkflowService.determineBlastProfile:


Function: ``determineBlastProfile``
===================================



.. js:function:: determineBlastProfile()

    
    
.. _module-services_basicWorkflowService.beginProcessing2:


Function: ``beginProcessing2``
==============================



.. js:function:: beginProcessing2()

    
    
.. _module-services_basicWorkflowService._runWorkflow:


Function: ``_runWorkflow``
==========================



.. js:function:: _runWorkflow()

    
    
.. _module-services_basicWorkflowService._postProcess:


Function: ``_postProcess``
==========================



.. js:function:: _postProcess()

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/blastxml2json``
**********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Convert BlastXML to JSON
(not a straight conversion)
This script not only converts the XML to json, it flattens the hits per hsp where there are multiple hsp.

Creates an indexed list by feature ID.
Essentially, it simpifies the hit array into an associative array and makes it indexed by key,
where key is <Hit_id>;<Hsp_num>


.. _module-services_blastxml2json.convert:


Function: ``convert``
=====================

Perform the conversion operation

.. js:function:: convert()

    
    :param convert(): kJob - kue job object
    :param convert(): trackJson
    :param convert(): cb - callback function
    

.. _module-services_blastxml2json.err:

Member: ``err``: 






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/entrezService``
**********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This job service enables accession value lookup utilizeing Entrez API.

Ref: `Entrez <https://www.ncbi.nlm.nih.gov/books/NBK25499/>`_


.. _module-services_entrezService.init:


Function: ``init``
==================

Initialize the module

.. js:function:: init(req, res, cb)

    
    :param object req: request
    :param object res: response
    :param function cb: callback function
    
.. _module-services_entrezService.lookup_accession:


Function: ``lookup_accession``
==============================

This does an esummary lookup (using Entrez api), adding the link field into the result.

.. js:function:: lookup_accession(req, res)

    
    :param object req: request
    :param object res: response
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/filter``
***************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Supporting methods for the filterService jservice.


.. _module-services_filter.filterInit:


Function: ``filterInit``
========================

create initial filter settings file

.. js:function:: filterInit(kJob)

    
    :param object kJob: kue job object
    :param filterInit(kJob): cb - callback
    
.. _module-services_filter.getFilterSettings:


Function: ``getFilterSettings``
===============================

get filterData

.. js:function:: getFilterSettings(requestData, cb)

    
    :param object requestData: eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox' }
    :param object cb: function(filterData)
    ::
          eg. filterData: { 
              contig: "ctgA",
              score: {type: 'abs', min: 58, max: 593, val: 421 },
              evalue: { type: 'exp', min: 5.96151e-165, max: 0.000291283, val: 0.000291283 },
              identity: { type: 'pct', min: 78, max: 100, val: 78 },
              gaps: { type: 'pct', min: 0, max: 13, val: 13 } 
          }
    
.. _module-services_filter.writeFilterSettings:


Function: ``writeFilterSettings``
=================================

write new data to filter settings file, given requestData

.. js:function:: writeFilterSettings(requestData, cb)

    
    :param object requestData: eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox', filterParams: filterData }
    :param object cb: updated filterData function(filterData)
    ::
          eg. filterData: { 
              contig: "ctgA",
              score: {type: 'abs', min: 58, max: 593, val: 421 },
              evalue: { type: 'exp', min: 5.96151e-165, max: 0.000291283, val: 0.000291283 },
              identity: { type: 'pct', min: 78, max: 100, val: 78 },
              gaps: { type: 'pct', min: 0, max: 13, val: 13 } 
          }
    
.. _module-services_filter.applyFilter:


Function: ``applyFilter``
=========================

Based on the filterData, generate a new gff3 file.
Also announces the track to subscribed clients.

.. js:function:: applyFilter(filterData, requestData)

    
    :param object filterData: the output of writeFilterSettings or getFilterSettings.
    :param object requestData: eg. { asset: 'jblast_sample', dataset: 'sample_data/json/volvox' }
    
    callback:
    ::
      cb({
         totalFeatures: x,               // total number of features
         filteredFeatures: x             // filtered features.
      })
    
.. _module-services_filter.getHitDataFiltered:


Function: ``getHitDataFiltered``
================================



.. js:function:: getHitDataFiltered()

    
    
.. _module-services_filter._announceTrack:


Function: ``_announceTrack``
============================



.. js:function:: _announceTrack()

    
    
.. _module-services_filter.getHitDetails:


Function: ``getHitDetails``
===========================

return hit details given hit key, including all HSPs of the original hit.
The hit key looks like this "gi-402239547-gb-JN790190-1--3"
Separate the hit id ==> "gi-402239547-gb-JN790190-1--" (basically remove the last number)
Returns multiple HSPs for each hit id: data for "gi-402239547-gb-JN790190-1--1", "gi-402239547-gb-JN790190-1--2"...

.. js:function:: getHitDetails(hitkey, cb)

    
    :param string hitkey: eg. "gi-402239547-gb-JN790190-1--3"
    :param getHitDetails(hitkey, cb): dataSet - eg. "sample_data/json/volvox"
    :param function cb: callback
    
.. _module-services_filter.getHighest:


Function: ``getHighest``
========================



.. js:function:: getHighest()

    
    
.. _module-services_filter.getLowest:


Function: ``getLowest``
=======================



.. js:function:: getLowest()

    
    
.. _module-services_filter.getHighest10:


Function: ``getHighest10``
==========================



.. js:function:: getHighest10()

    
    
.. _module-services_filter.getLowest10:


Function: ``getLowest10``
=========================



.. js:function:: getLowest10()

    
    
.. _module-services_filter.getHighestPct:


Function: ``getHighestPct``
===========================



.. js:function:: getHighestPct()

    
    
.. _module-services_filter.getLowestPct:


Function: ``getLowestPct``
==========================



.. js:function:: getLowestPct()

    
    
.. _module-services_filter.convert2Num:


Function: ``convert2Num``
=========================



.. js:function:: convert2Num()

    
    
.. _module-services_filter.getHitId:


Function: ``getHitId``
======================



.. js:function:: getHitId()

    
    


.. _module-services_filter._:

Constant: ``_``: 





.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/filterService``
**********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This jservice provides restful APIs for processing filter requests.


.. _module-services_filterService.init:


Function: ``init``
==================



.. js:function:: init()

    
    
.. _module-services_filterService.set_filter:


Function: ``set_filter``
========================

Based on new filter settings provided by the caller, updates the associated
filtersettings file and the resulting GFF3 file containing filtered
features.

REST Request:
     POST `/service/exec/set_filter`

.. js:function:: set_filter(req, res)

    
    :param object req: request
    
    ::
    
       req.body = {
         filterParams: {score:{val: 50}, evalue:{val:-2}...
         dataSet: (i.e. "sample_data/json/volvox" generally from config.dataRoot)
         asset: asset id
       }
    :param object res: response
    
.. _module-services_filterService.get_blastdata:


Function: ``get_blastdata``
===========================

Determine filter details, like number of hit results.
REST
     `GET /service/exec/set_filter`
     data: eg. `{asset: '151_1517462263883', dataset: 'sample_data/json/volvox'}`

Return data: eg. `{ result: 'success', hits: 792, filteredHits: 501 }`

.. js:function:: get_blastdata(req, res)

    
    :param object req: request
    :param object res: response
    
.. _module-services_filterService.get_trackdata:


Function: ``get_trackdata``
===========================

Fetch the GFF3 file of the prior filter operation

``GET /service/exec/set_filter``

.. js:function:: get_trackdata(req, res)

    
    :param type req: request
    :param type res: response
    
.. _module-services_filterService.fixNumber:


Function: ``fixNumber``
=======================



.. js:function:: fixNumber()

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/galaxyService``
**********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This job service is functionally equivelant to basicWorkflowService, however,
NCBI operations are sent through galaxy workflow for processing. 

Job submission example:
::
  var postData = {
        service: "jblast",
        dataset: "sample_data/json/volvox",
        region: ">ctgA ctgA:44705..47713 (- strand) class=remark length=3009\nacatccaatggcgaacataa...gcgagttt",
        workflow: "NCBI.blast.workflow.js"
    };
  $.post( "/job/submit", postData , function( result ) {
      console.log( result );
  }, "json");

Configuration:
::
       // Galaxy settings
       galaxy: {
           // Galaxy API path
           galaxyUrl: "http://localhost:8080",
           
           // Galaxy installation path
           galaxyPath: "/var/www/html/galaxy",
          
           // Galaxy API key (you must obtain this from your Galaxy installation)
           galaxyAPIKey: "c7be32db9329841598b1a5705655f633",

           // The default Galaxy History where workflows will execute
           historyName: "Unnamed history"
       },
      
       jblast: {
          // The subdir where blast results will be deposited (i.e. ``sample_data/json/volvox/jblastdata``)
          blastResultPath: "jblastdata",
          
          // The category for successful blast results in the track selector
          blastResultCategory: "JBlast Results",
          
          // Track template of the blast result track that will be inserted in trackList.json
          trackTemplate: "jblastTrackTemplate.json",
          
          // Type of file that will be imported for processing blast.
          import: ["blastxml"],
          
          
          // BLAST profiles
          // blast profiles are parameter lists that translate to blastn cli parameters sets
          // (i.e. for "remote_htgs" would translate to "blastn -db htgs -remote")
          // These will override any default parameters defined in ``blastjs``
          // 
          // Blast profiles generally apply to basicWorkflowService only
          // and do no apply to galaxyService.
          // 
          // Our example uses a subset of htgs, an NCBI curated blast database.
          // So, it is our default profile.
          defaultBlastProfile: 'htgs',
          blastProfiles: {
              'htgs': {
                  'db': 'htgs'
              },
              'remote_htgs': {
                  'db': 'htgs',
                  'remote': ""
              }
          }
      },
      // list of services that will get registered.
      services: {
          'galaxyService':          {name: 'galaxyService',         type: 'workflow', alias: "jblast"},
          'filterService':            {name: 'filterService',         type: 'service'},
          'entrezService':            {name: 'entrezService',         type: 'service'}
      },


.. _module-services_galaxyService.init:


Function: ``init``
==================



.. js:function:: init()

    
    
.. _module-services_galaxyService.validateParams:


Function: ``validateParams``
============================

job service validation

.. js:function:: validateParams(params)

    
    :param object params: parameters
    :return val: 0 if successful, otherwise failure
    
.. _module-services_galaxyService.generateName:


Function: ``generateName``
==========================

job service generate name

.. js:function:: generateName(params)

    
    :param object params: parameters
    :return string: name of job
    
.. _module-services_galaxyService.beginProcessing:


Function: ``beginProcessing``
=============================

job service begin

.. js:function:: beginProcessing(kJob)

    
    :param object kJob: kue job object
    
.. _module-services_galaxyService.get_workflows:


Function: ``get_workflows``
===========================



.. js:function:: get_workflows()

    
    
.. _module-services_galaxyService.get_hit_details:


Function: ``get_hit_details``
=============================



.. js:function:: get_hit_details()

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/galaxyUtils``
********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This provides functional support to galaxyService job service.


.. _module-services_galaxyUtils.init:


Function: ``init``
==================

Initialize module

.. js:function:: init(cb, cberr)

    
    :param type cb: Initialize module
    :param type cberr: Initialize module
    :return undefined: Initialize module
    
.. _module-services_galaxyUtils.galaxyGetPromise:


Function: ``galaxyGetPromise``
==============================



.. js:function:: galaxyGetPromise()

    
    
.. _module-services_galaxyUtils.galaxyPostPromise:


Function: ``galaxyPostPromise``
===============================



.. js:function:: galaxyPostPromise()

    
    
.. _module-services_galaxyUtils.galaxyGET:


Function: ``galaxyGET``
=======================

send JSON GET request to galaxy server

.. js:function:: galaxyGET(api, cb)

    
    :param type api: i.e. '/api/histories'
    :param type cb: callback i.e. function(retval)
    
.. _module-services_galaxyUtils.galaxyPOST:


Function: ``galaxyPOST``
========================



.. js:function:: galaxyPOST()

    
    
.. _module-services_galaxyUtils.getHistoryId:


Function: ``getHistoryId``
==========================



.. js:function:: getHistoryId()

    
    :return string: history id
    
.. _module-services_galaxyUtils.getHistoryName:


Function: ``getHistoryName``
============================



.. js:function:: getHistoryName()

    
    :return string: history name
    
.. _module-services_galaxyUtils.initHistory:


Function: ``initHistory``
=========================

acquire history id from galaxy

.. js:function:: initHistory(cb)

    
    :param type cb: acquire history id from galaxy
    
.. _module-services_galaxyUtils.getWorkflows:


Function: ``getWorkflows``
==========================

get workflows

.. js:function:: getWorkflows(cb)

    
    :param type cb: get workflows
    :return undefined: get workflows
    
.. _module-services_galaxyUtils.sendFile:


Function: ``sendFile``
======================

send file to galaxy

.. js:function:: sendFile(theFile, hId, cb, cberr)

    
    :param type theFile: send file to galaxy
    :param type hId: send file to galaxy
    :param type cb: send file to galaxy
    :param type cberr: send file to galaxy
    :return undefined: send file to galaxy
    
.. _module-services_galaxyUtils.beginProcessing:


Function: ``beginProcessing``
=============================

Job service, job entry point.

.. js:function:: beginProcessing(kJob)

    
    :param object kJob: reference to kue job object
    
.. _module-services_galaxyUtils.beginProcessing2:


Function: ``beginProcessing2``
==============================



.. js:function:: beginProcessing2()

    
    
.. _module-services_galaxyUtils.monitorWorkflow:


Function: ``monitorWorkflow``
=============================

Monitor workflow and exit upon completion of the workflow

.. js:function:: monitorWorkflow(kJob)

    
    :param object kJob: Monitor workflow and exit upon completion of the workflow
    
.. _module-services_galaxyUtils.doCompleteAction:


Function: ``doCompleteAction``
==============================

Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.

.. js:function:: doCompleteAction(kJob, hista)

    
    :param object kJob: kue job object
    :param object hista: associative array of histories
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/jblastPostAction``
*************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module implements the actions that occur after a galaxy workflow completes.
It supports galaxyService job service.


.. _module-services_jblastPostAction.postMoveResultFiles:


Function: ``postMoveResultFiles``
=================================



.. js:function:: postMoveResultFiles()

    
    
.. _module-services_jblastPostAction.getHits:


Function: ``getHits``
=====================



.. js:function:: getHits()

    
    
.. _module-services_jblastPostAction.processFilter:


Function: ``processFilter``
===========================



.. js:function:: processFilter()

    
    
.. _module-services_jblastPostAction.postMoveResultFiles:


Function: ``postMoveResultFiles``
=================================

this generates track template

.. js:function:: postMoveResultFiles(kJob, cb)

    
    :param type kJob: kue job object
    :param type cb: callback
    
.. _module-services_jblastPostAction.processFilter:


Function: ``processFilter``
===========================

Generate the GFF file

.. js:function:: processFilter(kJob, newTrackJson, cb)

    
    :param type kJob: = kue job object
    :param type newTrackJson: working track object
    :param type cb: callback
    
.. _module-services_jblastPostAction.getHits:


Function: ``getHits``
=====================

return number of hits

.. js:function:: getHits(kJob, newTrackJson)

    
    :param object kJob: kue job object
    :param JSON newTrackJson: working track object
    :return Number: number of hits
    

.. _module-services_jblastPostAction.requestp:

Member: ``requestp``: 

.. _module-services_jblastPostAction.path:

Member: ``path``: 

.. _module-services_jblastPostAction.Promise:

Member: ``Promise``: 

.. _module-services_jblastPostAction.fs:

Member: ``fs``: 

.. _module-services_jblastPostAction.deferred:

Member: ``deferred``: 

.. _module-services_jblastPostAction.filter:

Member: ``filter``: 

.. _module-services_jblastPostAction.offsetfix:

Member: ``offsetfix``: 

.. _module-services_jblastPostAction.blast2json:

Member: ``blast2json``: 

.. _module-services_jblastPostAction.galaxy:

Member: ``galaxy``: 

.. _module-services_jblastPostAction._:

Member: ``_``: 

.. _module-services_jblastPostAction.newTrackJson:

Member: ``newTrackJson``: 






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/offsetfix``
******************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module fixes the offsets of blast search results.


.. _module-services_offsetfix.process:


Function: ``process``
=====================



.. js:function:: process()

    
    





