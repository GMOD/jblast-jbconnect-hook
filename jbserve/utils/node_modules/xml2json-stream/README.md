xml2json-stream
===============
[![deprecated by xml-json](http://img.shields.io/badge/deprecated%20by-xml--json-red.svg?style=flat)](http://github.com/maxogden/xml-json)

This module converts simple (but eventually huge) XML data to JSON, using Streams and sax.
No support for attributes and some other XML stuff, as this was made more specifically for NCBI's Blast results files, but some features should be easy to add in the future.
Everything is stored in memory during conversion. However, if the data source is too large for that, but mostly composed of a repetitive tag (i.e., the XML is a huge array of objects) that tag can be specified (with `tag`) and data will be emitted every time the tag is closed (with all of it's nested tags). Caches are cleared afterwards, thus avoiding memory limits. In this case, the output will be composed of one object per line, representing each repetition of the specified tag, instead of one object representing the whole XML data.
For example, for huge NCBI's Blast files, `tag` could be `iteration`.

DEPRECATED
==========
This code hasn't been updated in a while and is broken for most cases.  
Just use @maxogden's new [xml-json](http://github.com/maxogden/xml-json).

Install
=======
npm install xml2json-stream

Options
=======
`tag` - String (optional). Used to specify a repetitive tag of interest that should be emitted each time it's closed, followed by a clean up of caches to avoid memory limits with huge data sources / files.

Usage
=====
```javascript
var fs = require('fs')
  , xml2json = require('xml2json-stream')
  , parser = new xml2json.Parser('iteration')
  , input = fs.createReadStream(process.argv[2])
  , output = fs.createWriteStream(process.argv[3]);

input.pipe(parser).pipe(output);
```

License
=======
(The MIT License)

Copyright 2013 Bruno Vieira. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
