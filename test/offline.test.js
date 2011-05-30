// Run $ expresso

/**
 * Module dependencies.
 */

var redecard = require('../index.js')
  , assert = require('assert')

module.exports = 
  { 'test getAuthorized': function() {
      try {
        redecard.getAuthorized(
          { amount: 1.00
          , type: redecard.TYPES.FULL_PAYMENT
          , installments: 0
          , supplierId: '36483184'
          , orderId: 'ITEM-001'
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
        
          /*
          { CODRET: '26',
            MSGRET: 'Transa%E7%E3o+n%E3o+autorizada',
            NUMPEDIDO: 'ITEM-001',
            DATA: {},
            NUMAUTOR: {},
            NUMCV: {},
            NUMAUTENT: {},
            NUMSQN: {},
            ORIGEM_BIN: {} } */
        
      } catch(e) {
        console.log(e)
      }
      //assert.equal(6, 'foobar'.length);
    }
  }
