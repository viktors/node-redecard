// Based on WebService Komerci English manual v2.5, 09/20/10

var https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , xml2js = require('xml2js')

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

  var paramDefs = 
    { amount:         { field: 'TOTAL',        size: 10, description: 'Sales total amount', formatter: function(n) { return n.toFixed(2) }}
    , type:           { field: 'TRANSACAO',    size:  2, description: 'Transaction type code', formatter: function(n) { return zeroPad(n, 2) }}
    , installments:   { field: 'PARCELAS',     size:  2, description: 'Number of installments', formatter: function(n) { return zeroPad(n, 2) }}
    , supplierId:     { field: 'FILIACAO',     size:  9, description: 'Supplying store membership number', formatter: function(n) { return zeroPad(n, 9) }}
    , orderId:        { field: 'NUMPEDIDO',    size: 16, description: 'Order number generated by the merchant'}
    , cardNumber:     { field: 'NRCARTAO',     size: 16, description: 'Card number', formatter: function(s) { return String(s).replace(/[^0-9]+/g, '') }}
    , cardCode:       { field: 'CVC2',         size:  3, description: 'CVC2', formatter: function(s) { return String(s).replace(/[^0-9]+/g, '') }}
    , cardExpMonth:   { field: 'MES',          size:  2, description: 'Card expiration month', formatter: function(n) { return zeroPad(n, 2) }}
    , cardExpYear:    { field: 'ANO',          size:  2, description: 'Card expiration year', formatter: function(n) { return zeroPad(n - 2000, 2) }}
    , cardFullName:   { field: 'PORTADOR',     size: 50, description: 'Cardholder name'}
    , iata:           { field: 'IATA',         size:  9, description: 'Airline: IATA code' }
    , distributorId:  { field: 'DISTRIBUIDOR', size:  9, description: 'Membership number of distributing store / card issuer, when B2B'}
    , concentradorId: { field: 'CONCENTRADOR', size:  5, description: 'N/A – Send parameter blank'} // no idea what it is
    , boardingTax:    { field: 'TAXAEMBARQUE', size: 10, description: 'Airline: Boarding tax', formatter: function(n) { return n.toFixed(2) }}
    , boardingDate:   { field: 'ENTRADA',      size: 10, description: 'Airline: Boarding date'}
    , docNum1:        { field: 'NUMDOC1',      size: 16, description: 'Airline: ticket number of the main passenger'}
    , docNum2:        { field: 'NUMDOC2',      size: 16, description: 'Airline: ticket number of the second passenger'}
    , docNum3:        { field: 'NUMDOC3',      size: 16, description: 'Airline: ticket number of the third passenger'}
    , docNum4:        { field: 'NUMDOC4',      size: 16, description: 'Airline: ticket number of the fourth passenger'}
    , pax1:           { field: 'PAX1',         size: 26, description: 'Airline: The name of the main passenger'}
    , pax2:           { field: 'PAX2',         size: 26, description: 'Airline: The name of the second passenger'}
    , pax3:           { field: 'PAX3',         size: 26, description: 'Airline: The name of the third passenger'}
    , pax4:           { field: 'PAX4',         size: 26, description: 'Airline: The name of the fourth passenger'}
    , autoConfirm:    { field: 'CONFTXN',      size:  1, description: 'Confirmation Flag', formatter: function(b) { return b ? 'S' : '' }}
    , additionalData: { field: 'ADD_Data',     size:  0, description: 'Only for Airline Companies, Hotels and Car Rental merchants'}
    , date:           { field: 'DATA',         size:  8, description: 'Transaction date', formatter: function(d) { return String(d.getFullYear()) + zeroPad(d.getMonth() + 1, 2) + zeroPad(d.getDate(), 2)}}
    , uniqSeq:        { field: 'NUMSQN',       size: 12, description: 'Unique sequential number'}
    , receiptId:      { field: 'NUMCV',        size:  9, description: 'Sales receipt number'}
    , authorizationId:{ field: 'NUMAUTOR',     size:  6, description: 'Authorization number'}
    , originalType:   { field: 'TRANSORIG',    size:  2, description: 'Transaction type code', formatter: function(n) { return zeroPad(n, 2) }}
    , username:       { field: 'USR',          size: 16, description: 'Transaction type code', formatter: function(n) { return zeroPad(n, 2) }}
    , password:       { field: 'PWD',          size: 20, description: 'Transaction type code', formatter: function(n) { return zeroPad(n, 2) }}
    , startDate:      { field: 'DATA_INICIAL', size:  8, description: 'Transaction date', formatter: function(d) { return String(d.getFullYear()) + zeroPad(d.getMonth() + 1, 2) + zeroPad(d.getDate(), 2)}}
    , endDate:        { field: 'DATA_FINAL',   size:  8, description: 'Transaction date', formatter: function(d) { return String(d.getFullYear()) + zeroPad(d.getMonth() + 1, 2) + zeroPad(d.getDate(), 2)}}
    , trxType:        { field: 'TIPO_TRX',     size:  2, description: 'Transaction type code', formatter: function(n) { return zeroPad(n, 2) }}
    , status:         { field: 'STATUS_TRX',   size:  2, description: 'Transaction status code', formatter: function(n) { return zeroPad(n, 2) }}
    , avs:            { field: 'SERVICO_AVS',  size:  1, description: 'AVS restriction code'}
    }
    
    var requiredParams = 'supplierId username password startDate endDate'.split(' ')
      , optionalParams = 'distributorId type status avs'
      
      
  if(self.env == 'test') paramDefs.additionalData.field = 'ADDData' // bug in redecard
  
  function prepareParams(params, requiredParams, optionalParams, cb) {
    var paramsToSend = {}
    for(var param in params) {
      if(!params.hasOwnProperty(param)) continue;
      if(requiredParams.indexOf(param) == -1 && optionalParams.indexOf(param) == -1) {
        return cb(new Error('Unknown parameter: ' + param))
      }
      var def = paramDefs[param]
        , value = params[param]
      value = def.formatter ? def.formatter(value) : String(value)
      if(value.length > def.size) {
        return cb(new Error('Parameter value too long: ' + param))
      }
      paramsToSend[def.field] = value
    }
    
    // check required
    for(var i = 0, l = requiredParams.length; i < l; i++) {
      var def = paramDefs[requiredParams[i]]
      if(String(paramsToSend[def.field]).trim() === '') {
        return cb(new Error('Required parameter not present: ' + param))
      }
    }
    
    // set defaults
    for(var i = 0, l = optionalParams.length; i < l; i++) {
      var def = paramDefs[optionalParams[i]]
      if(!paramsToSend.hasOwnProperty(def.field)) paramsToSend[def.field] = ''
    }
    
    return cb(null, paramsToSend)
  }

  function mapResponse(data, fieldMap) {
    var rv = {}
    for(var p in data) {
      if(data.hasOwnProperty(p) && data[p] !== '' && typeof data[p] != 'object') {
        var def = fieldMap[p]
        if(!def) console.log("Invalid p: ", p)
        rv[def.field] = def.convert ? def.convert(data[p]) : data[p]
      }
    }
    return rv    
  }
  
  self.getAuthorized = function(params, cb) {
    var requiredParams = 'amount type installments supplierId orderId cardNumber cardCode cardExpMonth cardExpYear cardFullName'.split(' ')
      , optionalParams = 'iata distributorId concentradorId boardingTax boardingDate docNum1 docNum2 docNum3 docNum4 pax1 pax2 pax3 pax4 autoConfirm additionalData'.split(' ')
    prepareParams(params, requiredParams, optionalParams, function(err, paramsToSend) {
      if(err) return cb(err)
      serviceRequest('GetAuthorized', paramsToSend, function(err, data) {
        if(err) return cb(err)
        var fieldMap = { CODRET: {field: 'code', convert: function(s) { return parseInt(s, 10) }}
                       , MSGRET: {field: 'message', convert: function(s) { return unescape(String(s).replace(/\+/g, '%20')) }}
                       , DATA: {field: 'date', convert: parseDate}
                       , NUMPEDIDO: {field: 'orderId'}
                       , NUMAUTOR: {field: 'authorizationId'}
                       , NUMCV: {field: 'receiptId'}
                       , NUMAUTENT: {field: 'authenticationId'}
                       , NUMSQN: {field: 'uniqSeq'}
                       , ORIGEM_BIN: {field: 'countryCode'}
                       , DISTRIBUIDOR: {field: 'distributorId'}
                       , IATA: {field: 'iata'}
                       , CONFCODRET: {field: 'autoConfirmCode', convert: function(s) { return parseInt(s, 10) }}
                       , CONFMSGRET: {field: 'autoConfirmMessage', convert: function(s) { return unescape(String(s).replace(/\+/g, '%20')) }}
                       }

        rv = mapResponse(data, fieldMap)
        rv.isApproved = rv.code === 0 && rv.hasOwnProperty('receiptId')
        if(rv.code && ERRORS[rv.code]) rv.errorDetails = ERRORS[rv.code]

        return cb(null, rv)
      })
    })
  }

  self.confirmTxn = function(params, cb) {
    var requiredParams = 'date uniqSeq receiptId authorizationId installments originalType amount orderId'.split(' ')
      , optionalParams = 'supplierId distributorId docNum1 docNum2 docNum3 docNum4 pax1 pax2 pax3 pax4 additionalData'.split(' ')
    prepareParams(params, requiredParams, optionalParams, function(err, paramsToSend) {
      if(err) return cb(err)
      serviceRequest('ConfirmTxn', paramsToSend, function(err, data) {
        if(err) return cb(err)
        var fieldMap = { CODRET: {field: 'code', convert: function(s) { return parseInt(s, 10) }}
                       , MSGRET: {field: 'message', convert: function(s) { return unescape(String(s).replace(/\+/g, '%20')) }}
                       }

        rv = mapResponse(data, fieldMap)

        return cb(null, rv)
      })
    })
  }

  self.salesReport = function(params, cb) {
    params.username = self.username
    params.password = self.password
    var requiredParams = 'supplierId username password startDate endDate'.split(' ')
      , optionalParams = 'distributorId trxType status avs'.split(' ')
    prepareParams(params, requiredParams, optionalParams, function(err, paramsToSend) {
      if(err) return cb(err)
      serviceRequest('CouncilReport', paramsToSend, function(err, data) {
        if(err) return cb(err)
        return cb(null, data)
      })
    })
  }

}

module.exports = 
  { Instance: Instance
  , TYPES: TYPES 
  }
