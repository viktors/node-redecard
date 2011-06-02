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
      var line = lines[i].trim()
      if(line.match(/^\#/) || !line.length) continue
      var f = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/)
      if(f.length < 6) return cb(new Error('Invalid input field definition: ' + line))
      defs[f[1]] = { field: f[2]
                   , required: !!f[3]
                   , size: f[4]
                   , type: f[5]
                   , formatter: inputFormatters[f[5]]
                   , description: f[6]
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
      var line = lines[i].trim()
      if(line.match(/^\#/) || !line.length) continue
      var f = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/)
      if(f.length < 3) return cb(new Error('Invalid output field definition: ' + line))
      defs[f[1]] = { field: f[2]
                   , type: f[3]
                   , converter: outputConverters[f[3]]
                   , description: f[4] 
                   }
    }
    cb(null, defs)
  })    
  
}

module.exports = 
  { parseInputDefs: parseInputDefs
  , parseOutputDefs: parseOutputDefs
  }
