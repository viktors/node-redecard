#!/usr/bin/env node

var parsers = require(__dirname + '/../lib/parsers')
  , fs = require('fs')
  , jade = require('jade');

function defsToList(defsKv) {
  var defs = []
  for(var k in defsKv) {
    if(!defsKv.hasOwnProperty(k)) continue
    var def = defsKv[k]
    def.key = k
    defs.push(def)
  }
  return defs
}

var out = []

function genDoc(method, cb) {
  parsers.parseInputDefs(method, function(err, defs) {
    if(err) throw(err)
    jade.renderFile(__dirname + '/inputDefs.jade', { locals: { method: method, defs: defsToList(defs) } }, function(err, html) {
      if(err) throw(err)
      out.push(html)
      parsers.parseOutputDefs(method, function(err, defs) {
        if(err) throw(err)
        jade.renderFile(__dirname + '/outputDefs.jade', { locals: { method: method, defs: defsToList(defs) } }, function(err, html) {
          if(err) throw(err)
          out.push(html)
          return cb()
        })
      })
    })
  })
}

fs.readdir(__dirname + '/../defs/', function(err, files) {
  if(err) throw(err)
  var methods = files
                .filter(function(fn) { return fn.match(/\.input\.conf$/) } )
                .map(function(fn) { return fn.split('.', 1)[0] })
                .sort()
  ;(function nextMethod() {
    var method = methods.pop()
    if(method) {
      genDoc(method, nextMethod)
    } else {
      var s = fs.readFileSync(__dirname + '/README.md')
      fs.writeFileSync(__dirname + '/../README.md', s + out.join(''))
    }
  })()
})
