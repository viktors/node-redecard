// Based on WebService Komerci English manual v2.5, 09/20/10
// https://services.redecard.com.br/NovoPortal/Portals/_PierNet/documents/Manual_KomerciWebservice_EnglishVersion.pdf
// https://services.redecard.com.br/NovoPortal/Portals/_PierNet/documents/Manual_KomerciIntegrado_EnglishVersion.pdf

var https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , xml2js = require('xml2js')
  , parsers = require(__dirname + '/lib/parsers')

var TYPES = { FULL_PAYMENT: 4
            , ISSUER_INSTALLMENTS: 6
            , MERCHANT_INSTALLMENTS: 8
            , PRE_AUTHORIZATION: 73
            , IATA_FULL_PAYMENT: 39
            , IATA_INSTALLMENTS: 40
            }
var CONFIRMATION_CODES = { OK: 0
                         , ALREADY_CONFIRMED: 1
                         , TRX_UNDONE: 3
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
    var postdata = qs.stringify(params)
    var parsedUrl = url.parse(serviceUrl + '/' + method)
      , options = { host: parsedUrl.host
                  , port: 443
                  , path: parsedUrl.pathname
                  , method: 'POST'
                  , headers: { 'Content-Type': 'application/x-www-form-urlencoded'
                             , 'Host': parsedUrl.host
                             , 'User-Agent': 'node-redecard'
                             , 'Content-Length': postdata.length
                             }
                  }
      , data = postdata

    var req = https.request(options, function(res) {
      var buf = []
      res.on('data', function(data) { buf.push(data) })
      res.on('end', function() {
        buf = buf.join('')
        if(res.statusCode != 200) { 
          return cb(new Error( 'Status code: ' + res.statusCode 
                             + ' Headers: ' + JSON.stringify(res.headers)
                             + ' Body: ' + buf
                             ))
        }
        var parser = new xml2js.Parser()
        parser.addListener('end', function(result) { 
          result._xml = buf
          cb(0, result) 
        })
        parser.parseString(buf)
      })
    })
    req.on('error', function(e) { return cb(e) })
    req.write(data)
    req.end()
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

  function mapResponse(data, fieldMap, cb) {
    var rv = {}
    for(var p in data) {
      if(data.hasOwnProperty(p) && data[p] !== '' && typeof data[p] != 'object') {
        var def = fieldMap[p]
        if(!def) {
          rv[p] = data[p]
          console.warn('No mapping for field ' + p + '=' + data[p])
        } else {
          rv[def.field] = def.converter ? def.converter(data[p]) : data[p]          
        }
      }
    }
    return cb(null, rv)
  }
  
  function callMethod(method, params, cb) {
    parsers.parseInputDefs(method, function(err, defs) {
      if(err) return cb(err)
      prepareParams(params, defs, function(err, paramsToSend) {
        if(err) return cb(err)
        serviceRequest(method, paramsToSend, function(err, data) {
          if(err) return cb(err)
          parsers.parseOutputDefs(method, function(err, fieldMap) {
            if(err) return cb(err)
            mapResponse(data, fieldMap, function(err, res) {
              if(err) return cb(err)
              /* Retry the transaction if the following codes are returned:
                 74: Institution has no communication
                 56, 76, 86: Redo the transaction */
              if([74, 56, 76, 86].indexOf(res.code) != -1) {
                console.log('Got code ' + res.code + ' for ' + method + ', retrying...')
                return callMethod(method, params, cb)
              } else {
                return cb(err, res)
              }
            })
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
  , CONFIRMATION_CODES: CONFIRMATION_CODES
  }
