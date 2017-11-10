***
API
***


.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/accessionEntrez``
************************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module enables accession value lookup utilizeing Entrez API.

Ref: https://www.ncbi.nlm.nih.gov/books/NBK25499/


.. _module-services_accessionEntrez.init:


Function: ``init``
==================

Initialize the module

.. js:function:: init(req, res, cb)

    
    :param object req: Initialize the module
    :param object res: Initialize the module
    :param function cb: callback function
    
.. _module-services_accessionEntrez.lookup:


Function: ``lookup``
====================

This does an esummary lookup (using Entrez api), adding the link field into the result.

.. js:function:: lookup(req, res, cb)

    
    :param object req: This does an esummary lookup (using Entrez api), adding the link field into the result.
    :param object res: This does an esummary lookup (using Entrez api), adding the link field into the result.
    :param function cb: callback function
    






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
This script not only converts the XML to json, it flattens the hits per hap where there are multiple hsp.

Essentially, it simpifies the hit array into an associative array and makes it indexed by key,
where key is <Hit_id>;<Hsp_num>


.. _module-services_blastxml2json.convert:


Function: ``convert``
=====================



.. js:function:: convert()

    
    :param convert(): kJob - kue job object
    :param convert(): trackJson
    :param convert(): cb - callback function
    

.. _module-services_blastxml2json.err:

Member: ``err``: 






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/filter``
***************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Blast feature filter functions.


.. _module-services_filter.filterInit:


Function: ``filterInit``
========================

create initial filter settings file

.. js:function:: filterInit(kWorkflowJob, newTrackJson)

    
    :param type kWorkflowJob: create initial filter settings file
    :param type newTrackJson: newTrackJson[0].filterSettings must be defined
         newTrackJson[0].label must be defined
    :return undefined|module.exports.filterInit.filter: create initial filter settings file
    
.. _module-services_filter.writeFilterSettings:


Function: ``writeFilterSettings``
=================================

write new data to filter settings file, given requestData

.. js:function:: writeFilterSettings(requestData, cb)

    
    :param type requestData: write new data to filter settings file, given requestData
    :param type cb: cb(filterData)
    :return err|Number: write new data to filter settings file, given requestData
    
.. _module-services_filter.applyFilter:


Function: ``applyFilter``
=========================

Based on the filterData, generate a new gff3 file.
If filterData == 0, then nothing will be filtered

.. js:function:: applyFilter(filterData, requestData)

    
    :param type filterData: Based on the filterData, generate a new gff3 file.
    If filterData == 0, then nothing will be filtered
    :param type requestData: {
         "asset": <the asset id>
         "dataSet": "sample_data/json/volvox"
    :return undefined: callback:
     cb({
         totalFeatures: x,               // total number of features
         filteredFeatures: x             // filtered features.
     })
    
.. _module-services_filter.getHitDetails:


Function: ``getHitDetails``
===========================

return hit details given hit key, including all HSPs of the original hit.

.. js:function:: getHitDetails(hitkey, cb)

    
    :param string hitkey: return hit details given hit key, including all HSPs of the original hit.
    :param getHitDetails(hitkey, cb): dataSet
    :param function cb: callback
    
    The hit key looks like this "gi-402239547-gb-JN790190-1--3"
    Separate the hit id ==> "gi-402239547-gb-JN790190-1--" (basically remove the last number)
    Returns multiple HSPs for each hit id: data for "gi-402239547-gb-JN790190-1--1", "gi-402239547-gb-JN790190-1--2"...
    
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

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/galaxyUtils``
********************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module manages the communication with the galaxy API.


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
    
.. _module-services_galaxyUtils.workflowSubmit:


Function: ``workflowSubmit``
============================

submit workflow.

.. js:function:: workflowSubmit(params, cb)

    
    :param type params: submit workflow.
    :param type cb: submit workflow.
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/jblastProc``
*******************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module implements the various REST APIs for JBlast.


.. _module-services_jblastProc.initialize:


Function: ``initialize``
========================

Initialize the service

.. js:function:: initialize(cb)

    
    :param type cb: Initialize the service
    :return undefined: Initialize the service
    
.. _module-services_jblastProc.workflowSubmit:


Function: ``workflowSubmit``
============================

Submit a workflow

REST: ``POST /jbapi/workflowsubmit``

.. js:function:: workflowSubmit(req, res, next)

    
    :param type req: Submit a workflow
    
    REST: ``POST /jbapi/workflowsubmit``
    :param type res: Submit a workflow
    
    REST: ``POST /jbapi/workflowsubmit``
    :param type next: Submit a workflow
    
    REST: ``POST /jbapi/workflowsubmit``
    
.. _module-services_jblastProc.getWorkflows:


Function: ``getWorkflows``
==========================

Get Workflows

REST: ``GET /jbapi/getworkflows``

.. js:function:: getWorkflows(req, res, next)

    
    :param type req: Get Workflows
    
    REST: ``GET /jbapi/getworkflows``
    :param type res: Get Workflows
    
    REST: ``GET /jbapi/getworkflows``
    :param type next: Get Workflows
    
    REST: ``GET /jbapi/getworkflows``
    
.. _module-services_jblastProc.setFilter:


Function: ``setFilter``
=======================

post /jbapi/setfilter - send filter parameters

.. js:function:: setFilter(req, res, next)

    
    :param type req: * data = req.body
       * data.filterParams = {score:{val: 50}, evalue:{val:-2}...
       * data.dataSet = (i.e. "sample_data/json/volvox" generally from config.dataRoot)
       * data.asset =
    :param type res: post /jbapi/setfilter - send filter parameters
    :param type next: post /jbapi/setfilter - send filter parameters
    
.. _module-services_jblastProc.getBlastData:


Function: ``getBlastData``
==========================

Get info about the given track

REST: ``GET /jbapi/getblastdata``

.. js:function:: getBlastData(req, res, next)

    
    :param type req: Get info about the given track
    
    REST: ``GET /jbapi/getblastdata``
    :param type res: Get info about the given track
    
    REST: ``GET /jbapi/getblastdata``
    :param type next: Get info about the given track
    
    REST: ``GET /jbapi/getblastdata``
    
.. _module-services_jblastProc.getTrackData:


Function: ``getTrackData``
==========================

Get Track Data

REST: ``GET /jbapi/gettrackdata``

.. js:function:: getTrackData(req, res, next)

    
    :param type req: Get Track Data
    
    REST: ``GET /jbapi/gettrackdata``
    :param type res: Get Track Data
    
    REST: ``GET /jbapi/gettrackdata``
    :param type next: Get Track Data
    
    REST: ``GET /jbapi/gettrackdata``
    
.. _module-services_jblastProc.getHitDetails:


Function: ``getHitDetails``
===========================

Return hits data given hit key

REST: ``GET /jbapi/gethitdetails called``

.. js:function:: getHitDetails(req, res, next)

    
    :param type req: Return hits data given hit key
    
    REST: ``GET /jbapi/gethitdetails called``
    :param type res: Return hits data given hit key
    
    REST: ``GET /jbapi/gethitdetails called``
    :param type next: Return hits data given hit key
    
    REST: ``GET /jbapi/gethitdetails called``
    
.. _module-services_jblastProc.lookupAccession:


Function: ``lookupAccession``
=============================

returns accession data given accesion number.
Utilizes Entrez service

REST: ``GET /jbapi/lookupaccession``

.. js:function:: lookupAccession(req, res, next)

    
    :param type req: returns accession data given accesion number.
    Utilizes Entrez service
    
    REST: ``GET /jbapi/lookupaccession``
    :param type res: returns accession data given accesion number.
    Utilizes Entrez service
    
    REST: ``GET /jbapi/lookupaccession``
    :param type next: returns accession data given accesion number.
    Utilizes Entrez service
    
    REST: ``GET /jbapi/lookupaccession``
    
.. _module-services_jblastProc.rest_getHitDetails:


Function: ``rest_getHitDetails``
================================



.. js:function:: rest_getHitDetails()

    
    
.. _module-services_jblastProc.rest_applyFilter:


Function: ``rest_applyFilter``
==============================



.. js:function:: rest_applyFilter()

    
    






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

    
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/postAction``
*******************************


.. contents:: Local Navigation
   :local:

   
Description
===========

This module implements the actions that occur after a galaxy workflow completes.


.. _module-services_postAction.doCompleteAction:


Function: ``doCompleteAction``
==============================



.. js:function:: doCompleteAction()

    
    
.. _module-services_postAction.monitorWorkflow:


Function: ``monitorWorkflow``
=============================

Monitor workflow and exit upon completion of the workflow

.. js:function:: monitorWorkflow(kWorkflowJob)

    
    :param object kWorkflowJob: Monitor workflow and exit upon completion of the workflow
    
.. _module-services_postAction.doCompleteAction:


Function: ``doCompleteAction``
==============================

Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.

.. js:function:: doCompleteAction(kWorkflowJob, hista)

    
    :param object kWorkflowJob: Read output of last generated file, copy results to /jblastdata, insert track to trackList.json.
    :param object hista: associative array of histories
    
.. _module-services_postAction.processResults:


Function: ``processResults``
============================



.. js:function:: processResults()

    
    
.. _module-services_postAction.processResultStep:


Function: ``processResultStep``
===============================

processResultStep

.. js:function:: processResultStep(stepctx, kJob, trackJson, cb)

    
    :param object stepctx: processResultStep
    :param object kJob: processResultStep
    :param JSON trackJson: processResultStep
    :param function cb: callback function
    
.. _module-services_postAction.postMoveResultFiles:


Function: ``postMoveResultFiles``
=================================

this generates track template

.. js:function:: postMoveResultFiles(kWorkflowJob, cb)

    
    :param type kWorkflowJob: this generates track template
    :param type cb: this generates track template
    
.. _module-services_postAction.processFilter:


Function: ``processFilter``
===========================

Generate the GFF file

.. js:function:: processFilter(kWorkflowJob, newTrackJson, cb)

    
    :param type kWorkflowJob: Generate the GFF file
    :param type newTrackJson: Generate the GFF file
    :param type cb: Generate the GFF file
    
.. _module-services_postAction.getHits:


Function: ``getHits``
=====================

return number of hits

.. js:function:: getHits(kWorkflowJob, newTrackJson)

    
    :param object kWorkflowJob: return number of hits
    :param JSON newTrackJson: return number of hits
    :return Number: hits
    
.. _module-services_postAction.addToTrackList:


Function: ``addToTrackList``
============================

Add track to track list and notify.

.. js:function:: addToTrackList(kWorkflowJob, newTrackJson)

    
    :param object kWorkflowJob: Add track to track list and notify.
    :param JSON newTrackJson: Add track to track list and notify.
    






.. raw:: html

   <hr style="border-color: black; border-width: 2px;">

Module: ``services/utils``
**************************


.. contents:: Local Navigation
   :local:

   
Description
===========

Utility Functions


.. _module-services_utils.getRegionStart:


Function: ``getRegionStart``
============================

return the starting coordinate
>ctgA ctgA:3014..6130 (+ strand) class=remark length=3117

.. js:function:: getRegionStart(str)

    
    :param type str: return the starting coordinate
    >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
    :return unresolved: return the starting coordinate
    >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
    
.. _module-services_utils.parseSeqData:


Function: ``parseSeqData``
==========================

Get parsed sequence data from FASTA file header

.. js:function:: parseSeqData(str)

    
    :param type str: Get parsed sequence data from FASTA file header
    :return parseSeqData(str): (JSON) sequence data
    





