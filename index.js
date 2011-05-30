// Based on WebService Komerci English manual v2.5, 09/20/10

var https = require('https')
  , url = require('url')
  , qs = require('querystring')
  , xml2js = require('xml2js')

var SERVICE_URL = 'https://ecommerce.redecard.com.br/pos_virtual/wskomerci/cap.asmx'
  , TRANSACTION_TYPES = { FULL_PAYMENT: '04'
                        , ISSUER_INSTALLMENTS: '06'
                        , MERCHANT_INSTALLMENTS: '08'
                        , PRE_AUTHORIZATION: '73'
                        , IATA_FULL_PAYMENT: '39'
                        , IATA_INSTALLMENTS: '40'
                        }
  , VALID_TRANSACTION_CODES = Object.keys(TRANSACTION_TYPES).map(function(k) { return TRANSACTION_TYPES[k] })

var validators = 
  { amount: function(total) { return total.match(/^[0-9]+\.[0-9]{2}$/) }  
  , required: function(s) { return s.trim().length > 0 }
  , code: function(s) { return s.match(/^[A-Za-z0-9_-]+$/) }
  , month: function(mm) { return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].indexOf(mm) != -1 }
  , year: function(yy) { return yy.match(/^[0-9]{2}$/) }
  , confirmationFlag: function(s) { return s === 'N' || s === 'S' }
  , transactionType: function(s) { return VALID_TRANSACTION_CODES.indexOf(s) != -1 }
  }

function serviceRequest(serviceUrl, method, params, callback) {
  var parsedUrl = url.parse(serviceUrl + '/' + method)
    , options = { host: parsedUrl.host
                , port: 443
                , path: parsedUrl.pathname
                , method: 'POST'
                , headers: { 'Content-Type': 'application/x-www-form-urlencoded'
                           , 'Host': parsedUrl.host
                           , 'User-Agent': 'www.novembra.com.br'
                           }
                }
    , data = qs.stringify(params)

  var req = https.request(options, function(res) {
    console.log("statusCode: ", res.statusCode)
    console.log("headers: ", res.headers)

    var buf = []
    res.on('data', function(data) {
      buf.push(data)
    })
    res.on('end', function() {
      var parser = new xml2js.Parser()
      parser.addListener('end', function(result) {
          callback(0, result)
      })
      parser.parseString(buf.join(''))
    })
  })
  req.on('error', function(e) {
    console.error(e)
  })
  req.write(data)
  req.end()
}

function getAuthorized(params, callback) {
  var paramDefs = 
    { TOTAL:        { size: 10, description: 'Sales total amount', validators: [validators.required, validators.amount]}
    , TRANSACAO:    { size: 2,  description: 'Transaction type code', validators: [validators.required, validators.transactionType]}
    , PARCELAS:     { size: 2,  description: 'Number of installments', validators: [validators.required]}
    , FILIACAO:     { size: 9,  description: 'Supplying store membership number', validators: [validators.required]}
    , NUMPEDIDO:    { size: 16, description: 'Order number generated by the merchant', validators: [validators.required, validators.code]}
    , NRCARTAO:     { size: 16, description: 'Card number', validators: [validators.required]}
    , CVC2:         { size: 3,  description: 'CVC2'}
    , MES:          { size: 2,  description: 'Card expiration month', validators: [validators.required, validators.month]}
    , ANO:          { size: 2,  description: 'Card expiration year', validators: [validators.required, validators.year]}
    , PORTADOR:     { size: 50, description: 'Cardholder name', validators: [validators.required]}
    , IATA:         { size: 9,  description: 'Airline: IATA code' }
    , DISTRIBUIDOR: { size: 9,  description: 'Membership number of distributing store / card issuer, when B2B'}
    , CONCENTRADOR: { size: 5,  description: 'N/A – Send parameter blank'}
    , TAXAEMBARQUE: { size: 10, description: 'Airline: Boarding tax'}
    , ENTRADA:      { size: 10, description: 'Airline: Boarding date'}
    , NUMDOC1:      { size: 16, description: 'Airline: ticket number of the main passenger'}
    , NUMDOC2:      { size: 16, description: 'Airline: ticket number of the second passenger'}
    , NUMDOC3:      { size: 16, description: 'Airline: ticket number of the third passenger'}
    , NUMDOC4:      { size: 16, description: 'Airline: ticket number of the fourth passenger'}
    , PAX1:         { size: 26, description: 'Airline: The name of the main passenger'}
    , PAX2:         { size: 26, description: 'Airline: The name of the second passenger'}
    , PAX3:         { size: 26, description: 'Airline: The name of the third passenger'}
    , PAX4:         { size: 26, description: 'Airline: The name of the fourth passenger'}
    , CONFTXN:      { size: 1,  description: 'Confirmation “Flag”', validators: [validators.confirmationFlag]}
    , ADD_Data:     { size: 0,  description: 'Only for Airline Companies, Hotels and Car Rental merchants'}
    }
  
  // validate incoming params
  for(var param in params) {
    if(!params.hasOwnProperty(param)) continue
    var def = paramDefs[param];
    if(!def) throw('Unknown parameter: ' + param);
    var value = params[param];
    if(value.constructor != String) throw('Non-string parameter: ' + param);
    if(value.length > def.size) throw('Parameter value too long: ' + param);
    if(typeof def.validators != 'undefined') {
      for(var i = 0, l = def.validators.length; i < l; i++) {
        if(!def.validators[i](value)) throw('Validator failed on parameter: ' + param);
      }
    }
  }
  
  /* PARCELAS must be filled out with the value “00” (zero zero) when the “TRANSACAO” parameter is “04” or 
     “39”, that is, full payment/cash. */
  if([TRANSACTION_TYPES.FULL_PAYMENT, TRANSACTION_TYPES.IATA_FULL_PAYMENT].indexOf(params.TRANSACAO) != -1) {
    if(params.PARCELAS !== '00') throw('TODO');
  }
  
  var paramsToSend = {}
  for(var param in paramDefs) paramsToSend[param] = params.hasOwnProperty(param) ? params[param] : ''
  
  serviceRequest(SERVICE_URL, 'GetAuthorized', paramsToSend, callback)
}

module.exports = 
  { TRANSACTION_TYPES: TRANSACTION_TYPES
  , validators: validators
  , getAuthorized: getAuthorized
  }
