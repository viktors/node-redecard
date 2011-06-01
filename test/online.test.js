// Run $ expresso

var redecard = require('../index.js')
  , merchant = new redecard.Instance('test', 'john.doe', 'secret')
  , assert = require('assert')

module.exports = 
  { 'test getAuthorized and confirmTxn': function() {
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
          console.log('getAuthorized', err, data)
          assert.ifError(err)
          // 76 Refaça a transação. Sua transação não pode ser concluída. Por favor, tente novamente.
          assert.strictEqual(true, data.isApproved)
          assert.strictEqual(0, data.code)
          assert.strictEqual('BRA', data.countryCode)
          assert.strictEqual(details.orderId, data.orderId)
          
          var details2 = 
            { date: data.date
            , uniqSeq: data.uniqSeq
            , receiptId: data.receiptId
            , authorizationId: data.authorizationId
            , installments: details.installments
            , type: details.type
            , amount: details.amount
            , supplierId: details.supplierId
            , orderId: details.orderId
          }
          merchant.confirmTxn(
              details2, function(err, data) {
                console.log('confirmTxn', err, data)
                assert.ifError(err)
                assert.ok(~[ redecard.CONFIRMATION_CODES.OK
                           , redecard.CONFIRMATION_CODES.ALREADY_CONFIRMED
                           , redecard.CONFIRMATION_CODES.TRX_UNDONE
                           ].indexOf(data.code))
              }
          )
          
        }
      )
    }
    , 'test getAuthorized pre-authorization': function() {
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
            console.log('preauth getAuthorized', err, data)
            assert.ifError(err)
            assert.strictEqual(true, data.isApproved)
            assert.strictEqual(0, data.code)
            assert.strictEqual('BRA', data.countryCode)
            assert.strictEqual(details.orderId, data.orderId)
          }
        )
      }
  }
