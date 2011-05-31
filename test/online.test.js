// Run $ expresso

/**
 * Module dependencies.
 */

var redecard = require('../index.js')
  , merchant = new redecard.Instance('test', 'john.doe', 'secret')
  , assert = require('assert')

module.exports = 
  { 'test getAuthorized success': function() {
      var details = { amount: 0.01
                    , type: redecard.TYPES.FULL_PAYMENT
                    , installments: 0
                    , supplierId: '36483184'
                    , orderId: 'ORDER001'
                    , cardNumber: '4111111111111111'
                    , cardCode: '123'
                    , cardExpMonth: 1
                    , cardExpYear: 2016
                    , cardFullName: 'JOHN DOE'
                    }
      merchant.getAuthorized(
        details
        , function(err, data) {
          assert.ifError(err)
          assert.strictEqual(true, data.isApproved)
          assert.strictEqual(0, data.code)
          assert.strictEqual('BRA', data.countryCode)
          assert.strictEqual(details.orderId, data.orderId)
        }
      )
    }
    , 'test getAuthorized pre-authorization': function() {
        /*
        TODO: This is sometimes returned - test that
        code: 76,
        message: 'Refaça a transação. Sua transação não pode ser concluída. Por favor, tente novamente.',
        */
        var details = { amount: 0.01
                      , type: redecard.TYPES.PRE_AUTHORIZATION
                      , installments: 0
                      , supplierId: '36483184'
                      , orderId: 'ORDER001'
                      , cardNumber: '4111111111111111'
                      , cardCode: '123'
                      , cardExpMonth: 1
                      , cardExpYear: 2016
                      , cardFullName: 'JOHN DOE'
                      }
        merchant.getAuthorized(
          details
          , function(err, data) {
            assert.ifError(err)
            assert.strictEqual(true, data.isApproved)
            assert.strictEqual(0, data.code)
            assert.strictEqual('BRA', data.countryCode)
            assert.strictEqual(details.orderId, data.orderId)
          }
        )
      }
  }
