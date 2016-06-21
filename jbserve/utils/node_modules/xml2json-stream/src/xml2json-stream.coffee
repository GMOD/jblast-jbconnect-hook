# 2013 Bruno Vieira [mail@bmpvieira.com] | License: MIT

stream = require 'stream'
sax = require 'sax'
EOL = require('os').EOL

class Parser extends stream.Stream
  constructor: (@_splitTag) ->
    @readable = true
    @writable = true

    @_notPaused = true
    @_elements = {}

    tagObj = null
    tagName = null
    parenTagName = null
    path = []
    pathArraysIndexes = {}

    @_saxParser = sax.createStream false
      trim: true
      lowercase: true
      position: false

    @_saxParser.on 'opentag', (tag) =>
      # Update tagObj
      if tagObj?[tagName]? # try with previous tagName
        tagObj = tagObj[tagName]
      else if path.length > 1
        # tagObj is shallower than prev tagObj, needs to get it using path array
        tagObj = @_getObjByDynamicKeys @_elements, path, pathArraysIndexes
      else
        tagObj = @_elements # tagObj is at root
      # Add tagName to path for later reference and update current tag and parent
      path.push tag.name
      parenTagName = tagName
      tagName = tag.name

      if not parenTagName? # tagObj is at root, so just create new empty object
        tagObj[tagName] = {}
      else
        if tagObj[parenTagName]? # nested tag, so update tagObj and move deeper
          tagObj = tagObj[parenTagName]
        if not tagObj[tagName]?
          tagObj[tagName] = {} # tag is new, so just create an empty object
        else # tag isn't new, so it must be part of an array
          if tagObj[tagName] instanceof Array
            # tag already set as an array, so just needs to push new empty
            # object and update pathArraysIndexes for later reference
            pathArraysIndexes[tagName]++
            index = pathArraysIndexes[tagName]
            tagObj[tagName].push {}
            tagObj = tagObj[tagName][index]
          else
            # tag wasn't set as array, so needs to set as one with previous
            # object at index 0, and new empty object at index 1
            pathArraysIndexes[tagName] = 1
            tagObj[tagName] = [tagObj[tagName], {}]
            tagObj = tagObj[tagName][1]
          # delete indexes refs from arrays nesteds in current array's siblings
          delete pathArraysIndexes[key] for key of pathArraysIndexes when key not in path

    @_saxParser.on 'text', (text) =>
      number = Number text
      if isNaN number
        tagObj[tagName] = text
      else
        tagObj[tagName] = number

    @_saxParser.on 'closetag', (tag) =>
      if @_splitTag? and tag is @_splitTag
        data = JSON.stringify @_getObjByDynamicKeys @_elements, path, pathArraysIndexes
        @emit 'data', "#{data}#{EOL}"
        # clean up to free memory
        @_elements = {}
        path = []
        pathArraysIndexes = {}
      path.pop()
      tagName = path[path.length-1]
      parenTagName = path[path.length-2]

    @_saxParser.on 'error', (error) => @emit 'error', error

  write: (data) =>
    @_saxParser.write data
    @_notPaused

  pause: =>
    @_notPaused = false

  resume: =>
    @_notPaused = true
    @emit 'drain'

  end: (data) =>
    @emit 'data', JSON.stringify @_elements if not @_splitTag?
    @emit 'close'

  _getObjByDynamicKeys: (object, path, pathArraysIndexes) ->
    # helper to get an object using dynamic keys supplied
    # by path array, with support for objects inside nested
    # arrays using specified indexes supplied by pathArraysIndexes
    for key in path
      index = pathArraysIndexes[key]
      if not index?
        object = object[key] = object[key]
      else
        object = object[key][index]
    object

module.exports = exports = Parser: Parser
