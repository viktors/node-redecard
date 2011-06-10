Redecard (former VisaNet) for Node.js
=====================================

*IMPORTANT*: this is work in progress.

This module implements Redecard (former VisaNet) [WebSevice Komerci](https://services.redecard.com.br/NovoPortal/Portals/_PierNet/documents/Manual_KomerciWebservice_EnglishVersion.pdf) for Node.js.

Redecard is 2nd largest Brazilian credit card processor. 

Supported online payment options
--------------------------------
 * MasterCard®, Diners and Visa® credit cards. Debit cards, such as Visa Electron, are not accepted.
 * Pre-authorization or full authorization
 * Splitting total amount into several installments
 * Additional installment fee applied to either merchant or the user
 * Support for Airline Companies, Hotels and Car Rental merchants (untested)

Key features
------------
 * Parameter names and return values in English
 * Normal POST over HTTPS, no SOAP
 * Automatic retries
 * Configuration files for request/response field mapping, data type conversion and validation
 * Redecard test environment supported
 * Online tests
 * Evens out some inconsistencies in Redecard API
 * Clean and maintainable code

Usage
-----
```js
var redecard = require('redecard')
  , merchant = new redecard.Instance('test', 'john.doe', 'secret')
  , details = { amount: 0.01
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
merchant.getAuthorized(details, function(err, data) {
  if(err) throw(err)
  if(data.isApproved) {
    // transaction approved, confirm it
    
    var confirmationDetails = 
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
        confirmationDetails, function(err, data) {
          if(err) throw(err)
          // data.code should be one of:
          //    redecard.CONFIRMATION_CODES.OK
          //    redecard.CONFIRMATION_CODES.ALREADY_CONFIRMED
          //    redecard.CONFIRMATION_CODES.TRX_UNDONE
          //  TRX_UNDONE means that more than 2 minutes have passed 
          //  before confirmation was sent.
        }
    )
    
  } else {
    // transaction NOT approved
  }
}
```

API Documentation
=================
