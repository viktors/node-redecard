var fs = require('fs')

function zeroPad(num, places) {
  var s = String(parseInt(num, 10))
  return s.length >= places ? s : new Array(places - s.length + 1).join('0') + s
}

function formatDate(d) {
  return String(d.getFullYear()) + zeroPad(d.getMonth() + 1, 2) + zeroPad(d.getDate(), 2)
}

function parseInputDefs(method, cb) {
  var inputFormatters = 
    { money:    function(n) { return String(n.toFixed(2)) }
    , zpad2:    function(n) { return zeroPad(n, 2) }
    , zpad9:    function(n) { return zeroPad(n, 9) }
    , string:   String
    , digits:   function(s) { return String(s).replace(/[^0-9]+/g, '') }
    , month:    function(n) { return zeroPad(n, 2) }
    , year:     function(n) { return zeroPad(n - 2000, 2) }
    , boolean:  function(b) { return b ? 'S' : '' }
    , date:     formatDate
  }
  fs.readFile(__dirname + '/../defs/' + method + '.input.conf', 'utf8', function (err, str) {
    if (err) return cb(err)
    var defs = {}
      , lines = str.split("\n")
    for(var i = 0, l = lines.length; i < l; i++) {
      var line = lines[i]
      if(line.match(/^\#/) || !line.trim().length) continue
      var f = line.trim().split(/\s+/, 5)
      if(f.length < 5) return cb(new Error('Invalid input field definition: ' + line))
      defs[f[0]] = { field: f[1]
                   , required: !!f[2]
                   , size: f[3]
                   , type: f[4]
                   , formatter: inputFormatters[f[4]]
                   , description: f[5]
                   }
    }
    return cb(null, defs)
  })    
}

function parseDate(yyyymmdd) {
  return new Date( parseInt(yyyymmdd.substring(0, 4), 10)
                 , parseInt(yyyymmdd.substring(4, 6), 10) - 1
                 , parseInt(yyyymmdd.substring(6, 8), 10)
                 )
}

function parseOutputDefs(method, cb) {
  var outputConverters = 
    { string:   String
    , date:     parseDate
    , urlencoded: function(s) { return unescape(String(s).replace(/\+/g, '%20')) }
    , integer:  function(s) { return parseInt(s, 10) }
    }
  fs.readFile(__dirname + '/../defs/' + method + '.output.conf', 'utf8', function (err, str) {
    if (err) return cb(err)
    var defs = {}
      , lines = str.split("\n")
    for(var i = 0, l = lines.length; i < l; i++) {
      var line = lines[i]
      if(line.match(/^\#/) || !line.trim().length) continue
      var f = line.trim().split(/\s+/, 3)
      if(f.length < 3) return cb(new Error('Invalid output field definition: ' + line))
      defs[f[0]] = { field: f[1], type: f[2], converter: outputConverters[f[2]] }
    }
    cb(null, defs)
  })    
  
}

module.exports = 
  { parseInputDefs: parseInputDefs
  , parseOutputDefs: parseOutputDefs
  }
