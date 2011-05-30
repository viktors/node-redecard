// Run $ expresso

/**
 * Module dependencies.
 */

var redecard = require('../index.js')
  , assert = require('assert')

module.exports = 
  { 'test getAuthorized': function() {
      redecard.getAuthorized(
        { amount: 0.01
        , type: redecard.TYPES.FULL_PAYMENT
        , installments: 0
        , supplierId: '36483184'
        , orderId: 'ORDER001'
        , cardNumber: '4111111111111111'
        , cardCode: '123'
        , cardExpMonth: 1
        , cardExpYear: 2016
        , cardFullName: 'JOHN DOE'
        }, 
        function(err, data) {
          console.log('getAuthorized callback', err, data)
        }
      )
        
      //assert.equal(6, 'foobar'.length);
    }
  }
