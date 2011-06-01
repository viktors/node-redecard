// Based on WebService Komerci English manual v2.5, 09/20/10
// https://services.redecard.com.br/NovoPortal/Portals/_PierNet/documents/Manual_KomerciWebservice_EnglishVersion.pdf
// https://services.redecard.com.br/NovoPortal/Portals/_PierNet/documents/Manual_KomerciIntegrado_EnglishVersion.pdf

var https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , xml2js = require('xml2js')
  , fs = require('fs')

var TYPES = { FULL_PAYMENT: 4
            , ISSUER_INSTALLMENTS: 6
            , MERCHANT_INSTALLMENTS: 8
            , PRE_AUTHORIZATION: 73
            , IATA_FULL_PAYMENT: 39
            , IATA_INSTALLMENTS: 40
            }

function Instance(env, username, password) {
  var self = this
  self.env = env
  self.username = username
  self.password = password
  var configs = { production: { SERVICE_URL: 'https://ecommerce.redecard.com.br/pos_virtual/wskomerci/cap.asmx' }
                , test: { SERVICE_URL: 'https://ecommerce.redecard.com.br/pos_virtual/wskomerci/cap_teste.asmx' }
                }
    , ERRORS = { 20: 'Missing mandatory parameter'
               , 21: 'Membership number in invalid format'
               , 22: 'Number of installments inconsistent with the transaction'
               , 23: 'Problems in merchant’s registration: invalid IP'
               , 24: 'Problems in merchant’s registration'
               , 25: 'Merchant not registered'
               , 26: 'Merchant not registered'
               , 27: 'Invalid card'
               , 28: 'CVC2 in invalid format'
               , 29: 'Operation not allowed: The order number exceeds 13 characters for the IATA type transaction (39 or 40)'
               , 30: 'Missing AVS parameter'
               , 31: 'Order number is greater than the allowed (16 positions)'
               , 32: 'IATA code is invalid or inexistent'
               , 33: 'Invalid IATA code'
               , 34: 'Distributor is invalid or inexistent'
               , 35: 'Problems in merchant’s registration: invalid IP'
               , 36: 'Operation not allowed'
               , 37: 'Distributor is invalid or inexistent'
               , 38: 'Operation not allowed in test environment. Transactions with amounts that exceed R$ 4.00 may not be performed in the test environment.'
               , 39: 'Operation not allowed for the informed IATA code'
               , 40: 'IATA code is invalid or inexistent'
               , 41: 'Problems in the merchant’s registration, or username/password problem'
               , 42: 'Problems in the merchant’s user registration, or username/password problem'
               , 43: 'Problems in user authentication, or username/password problem'
               , 44: 'Incorrect user for tests'
               , 45: 'Problems in merchant’s registration for tests'
               , 56: 'Invalid Data'
               }
               
  function serviceRequest(method, params, cb) {
    var serviceUrl = configs[self.env].SERVICE_URL
    if(self.env == 'test') method += 'Tst'
    var parsedUrl = url.parse(serviceUrl + '/' + method)
      , options = { host: parsedUrl.host
                  , port: 443
                  , path: parsedUrl.pathname
                  , method: 'POST'
                  , headers: { 'Content-Type': 'application/x-www-form-urlencoded'
                             , 'Host': parsedUrl.host
                             , 'User-Agent': 'node-redecard'
                             }
                  }
      , data = qs.stringify(params)

    var req = https.request(options, function(res) {
      var buf = []
      res.on('data', function(data) { buf.push(data) })
      res.on('end', function() {
        if(res.statusCode != 200) { 
          return cb(new Error( 'Status code: ' + res.statusCode 
                             + ' Headers: ' + JSON.stringify(res.headers)
                             + ' Body: ' + buf.join('')
                             ))
        }
        var parser = new xml2js.Parser()
        parser.addListener('end', function(result) { cb(0, result) })
        parser.parseString(buf.join(''))
      })
    })
    req.on('error', function(e) { return cb(e) })
    req.write(data)
    req.end()
  }

  function zeroPad(num, places) {
    var s = String(parseInt(num, 10))
    return s.length >= places ? s : new Array(places - s.length + 1).join('0') + s
  }

  function parseDate(yyyymmdd) {
    return new Date( parseInt(yyyymmdd.substring(0, 4), 10)
                   , parseInt(yyyymmdd.substring(4, 6), 10) - 1
                   , parseInt(yyyymmdd.substring(6, 8), 10)
                   )
  }

  function parseInputDefs(method, cb) {
    var inputFormatters = 
      { money:    function(n) { return String(n.toFixed(2)) }
      , zpad2:    function(n) { return zeroPad(n, 2) }
      , zpad9:    function(n) { return zeroPad(n, 9) }
      , string:   function(s) { return String(s) }
      , digits:   function(s) { return String(s).replace(/[^0-9]+/g, '') }
      , month:    function(n) { return zeroPad(n, 2) }
      , year:     function(n) { return zeroPad(n - 2000, 2) }
      , boolean:  function(b) { return b ? 'S' : '' }
      , date:     function(d) { return String(d.getFullYear()) + zeroPad(d.getMonth() + 1, 2) + zeroPad(d.getDate(), 2)}
    }
    fs.readFile(__dirname + '/defs/' + method + '.input.conf', function (err, str) {
      if (err) return cb(err)
      var defs = {}
      String(str).split("\n").forEach(function(line) {
        if(line.match(/^\#/)) return
        var f = line.trim().split(/\s+/, 5)
        if(f.length < 5) return // XXX silently ignores errors
        defs[f[0]] = { field: f[1]
                     , required: !!f[2]
                     , size: f[3]
                     , formatter: inputFormatters[f[4]]
                     , description: f[5]
                     }
      })
      cb(null, defs)
    })    
  }
  
  function parseOutputDefs(method, cb) {
    var outputConverters = 
      { string:   function(s) { return String(s) }
      , date:     parseDate
      , urlencoded: function(s) { return unescape(String(s).replace(/\+/g, '%20')) }
      , integer:  function(s) { return parseInt(s, 10) }
      }
    fs.readFile(__dirname + '/defs/' + method + '.output.conf', function (err, str) {
      if (err) return cb(err)
      var defs = {}
      String(str).split("\n").forEach(function(line) {
        if(line.match(/^\#/)) return
        var f = line.trim().split(/\s+/, 3)
        if(f.length < 3) return // XXX silently ignores errors
        defs[f[0]] = { field: f[1], converter: outputConverters[f[2]] }
      })
      cb(null, defs)
    })    
    
  }

  function prepareParams(params, defs, cb) {
    var paramsToSend = {}
    for(var param in params) {
      if(!params.hasOwnProperty(param)) continue
      if(!defs.hasOwnProperty(param)) {
        return cb(new Error('Unknown parameter: ' + param))
      }
      var def = defs[param]
        , value = params[param]
      value = def.formatter ? def.formatter(value) : String(value)
      if(value.length > def.size) {
        return cb(new Error('Parameter value too long: ' + param))
      }
      paramsToSend[def.field] = value
    }
    
    // check required, set defaults
    for(var param in defs) {
      if(!defs.hasOwnProperty(param)) continue
      var def = defs[param]
      if(def.required && String(paramsToSend[def.field]).trim() === '') {
        return cb(new Error('Required parameter not present: ' + param))
      }
      if(!paramsToSend.hasOwnProperty(def.field)) paramsToSend[def.field] = ''
    }
    
    return cb(null, paramsToSend)
  }

  function mapResponse(data, fieldMap) {
    var rv = {}
    for(var p in data) {
      if(data.hasOwnProperty(p) && data[p] !== '' && typeof data[p] != 'object') {
        var def = fieldMap[p]
        rv[def.field] = def.converter ? def.converter(data[p]) : data[p]
      }
    }
    return rv    
  }
  
  function callMethod(method, params, cb) {
    parseInputDefs(method, function(err, defs) {
      prepareParams(params, defs, function(err, paramsToSend) {
        if(err) return cb(err)
        serviceRequest(method, paramsToSend, function(err, data) {
          if(err) return cb(err)
          parseOutputDefs(method, function(err, fieldMap) {
            rv = mapResponse(data, fieldMap)
            return cb(null, rv)
          })
        })
      })      
    })
  }
  
  self.getAuthorized = function(params, cb) {
    return callMethod('GetAuthorized', params, function(err, rv) {
      if(err) return cb(err)
      rv.isApproved = rv.code === 0 && rv.hasOwnProperty('receiptId')
      if(rv.code && ERRORS[rv.code]) rv.errorDetails = ERRORS[rv.code]
      return cb(err, rv)
    })
  }

  self.confirmTxn = function(params, cb) {
    return callMethod('ConfirmTxn', params, function(err, rv) {
      if(err) return cb(err)
      return cb(err, rv)
    })
  }
  
}

module.exports = 
  { Instance: Instance
  , TYPES: TYPES 
  }
