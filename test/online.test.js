// Run $ expresso

/**
 * Module dependencies.
 */

var redecard = require('../index.js')
  , assert = require('assert')

module.exports = 
  { 'test getAuthorized success': function() {
      var details = { env: 'test'
                    , amount: 0.01
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
      redecard.getAuthorized(
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
