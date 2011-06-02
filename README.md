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
    // transaction approved
  } else {
    // transaction NOT approved
  }
}
```

API Documentation
=================
<h2>GetAuthorized</h2><h3>Arguments</h3><p>GetAuthorized takes two parameters: a hash of arguments and a callback.</p><table><tr><th>Field</th><th>Type</th><th>Required?</th><th>Max. length</th><th>Original Redecard Field</th><th>Description</th></tr><tr><td>amount</td><td>money</td><td>Yes</td><td>10</td><td>TOTAL</td><td>Sales total amount</td></tr><tr><td>type</td><td>zpad2</td><td>Yes</td><td>2</td><td>TRANSACAO</td><td>Transaction type code</td></tr><tr><td>installments</td><td>zpad2</td><td>Yes</td><td>2</td><td>PARCELAS</td><td>Number of installments</td></tr><tr><td>supplierId</td><td>zpad9</td><td>Yes</td><td>9</td><td>FILIACAO</td><td>Supplying store membership number</td></tr><tr><td>orderId</td><td>string</td><td>Yes</td><td>16</td><td>NUMPEDIDO</td><td>Order number generated by the merchant</td></tr><tr><td>cardNumber</td><td>digits</td><td>Yes</td><td>16</td><td>NRCARTAO</td><td>Card number</td></tr><tr><td>cardCode</td><td>digits</td><td>Yes</td><td>3</td><td>CVC2</td><td>Card CVC2</td></tr><tr><td>cardExpMonth</td><td>month</td><td>Yes</td><td>2</td><td>MES</td><td>Card expiration month</td></tr><tr><td>cardExpYear</td><td>year</td><td>Yes</td><td>2</td><td>ANO</td><td>Card expiration year</td></tr><tr><td>cardFullName</td><td>string</td><td>Yes</td><td>50</td><td>PORTADOR</td><td>Cardholder name</td></tr><tr><td>iata</td><td>string</td><td>Yes</td><td>9</td><td>IATA</td><td>Airline: IATA code</td></tr><tr><td>distributorId</td><td>string</td><td>Yes</td><td>9</td><td>DISTRIBUIDOR</td><td>Membership number of distributing store / card issuer, when B2B</td></tr><tr><td>concentradorId</td><td>string</td><td>Yes</td><td>5</td><td>CONCENTRADOR</td><td>N/A – Send parameter blank</td></tr><tr><td>boardingFee</td><td>money</td><td>Yes</td><td>10</td><td>TAXAEMBARQUE</td><td>Airline: Boarding fee</td></tr><tr><td>checkinFee</td><td>money</td><td>Yes</td><td>10</td><td>ENTRADA</td><td>Airline: Check-in fee</td></tr><tr><td>docNum1</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC1</td><td>Airline: ticket number of the main passenger</td></tr><tr><td>docNum2</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC2</td><td>Airline: ticket number of the second passenger</td></tr><tr><td>docNum3</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC3</td><td>Airline: ticket number of the third passenger</td></tr><tr><td>docNum4</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC4</td><td>Airline: ticket number of the fourth passenger</td></tr><tr><td>pax1</td><td>string</td><td>Yes</td><td>26</td><td>PAX1</td><td>Airline: The name of the main passenger</td></tr><tr><td>pax2</td><td>string</td><td>Yes</td><td>26</td><td>PAX2</td><td>Airline: The name of the second passenger</td></tr><tr><td>pax3</td><td>string</td><td>Yes</td><td>26</td><td>PAX3</td><td>Airline: The name of the third passenger</td></tr><tr><td>pax4</td><td>string</td><td>Yes</td><td>26</td><td>PAX4</td><td>Airline: The name of the fourth passenger</td></tr><tr><td>autoConfirm</td><td>boolean</td><td>Yes</td><td>1</td><td>CONFTXN</td><td>Auto-confirm transaction?</td></tr><tr><td>addDataTst</td><td>string</td><td>Yes</td><td>0</td><td>ADDData</td><td>Only for Airline Companies, Hotels and Car Rental merchants</td></tr><tr><td>additionalData</td><td>string</td><td>Yes</td><td>0</td><td>ADD_Data</td><td>Only for Airline Companies, Hotels and Car Rental merchants</td></tr></table><h3>Callback</h3><p>Callback function receives ```err``` and a hash of return values.</p><table><tr><th>Field</th><th>Type</th><th>Original Redecard Field</th><th>Description</th></tr><tr><td>code</td><td>integer</td><td>CODRET</td><td>Return code</td></tr><tr><td>message</td><td>urlencoded</td><td>MSGRET</td><td>Return code description</td></tr><tr><td>date</td><td>date</td><td>DATA</td><td>Transaction date</td></tr><tr><td>orderId</td><td>string</td><td>NUMPEDIDO</td><td>Order number</td></tr><tr><td>authorizationId</td><td>string</td><td>NUMAUTOR</td><td>Authorization number</td></tr><tr><td>receiptId</td><td>string</td><td>NUMCV</td><td>Sales receipt number</td></tr><tr><td>authenticationId</td><td>string</td><td>NUMAUTENT</td><td>Authentication number</td></tr><tr><td>uniqSeq</td><td>string</td><td>NUMSQN</td><td>Unique sequential number</td></tr><tr><td>countryCode</td><td>string</td><td>ORIGEM_BIN</td><td>Code of issuer country, 2-letter or 3-letter ISO country code</td></tr><tr><td>distributorId</td><td>string</td><td>DISTRIBUIDOR</td><td>Membership number of distributor / cardholder, when B2B</td></tr><tr><td>iata</td><td>string</td><td>IATA</td><td>IATA</td></tr><tr><td>autoConfirmCode</td><td>integer</td><td>CONFCODRET</td><td>Automatic confirmation return code</td></tr><tr><td>autoConfirmMessage</td><td>urlencoded</td><td>CONFMSGRET</td><td>Return code description</td></tr></table><h2>ConfirmTxn</h2><h3>Arguments</h3><p>ConfirmTxn takes two parameters: a hash of arguments and a callback.</p><table><tr><th>Field</th><th>Type</th><th>Required?</th><th>Max. length</th><th>Original Redecard Field</th><th>Description</th></tr><tr><td>date</td><td>date</td><td>Yes</td><td>8</td><td>DATA</td><td>Transaction date</td></tr><tr><td>uniqSeq</td><td>string</td><td>Yes</td><td>12</td><td>NUMSQN</td><td>Unique sequential number</td></tr><tr><td>receiptId</td><td>string</td><td>Yes</td><td>9</td><td>NUMCV</td><td>Sales receipt number</td></tr><tr><td>authorizationId</td><td>string</td><td>Yes</td><td>6</td><td>NUMAUTOR</td><td>Authorization number</td></tr><tr><td>installments</td><td>zpad2</td><td>Yes</td><td>2</td><td>PARCELAS</td><td>Number of installments</td></tr><tr><td>type</td><td>zpad2</td><td>Yes</td><td>2</td><td>TRANSORIG</td><td>Transaction type code</td></tr><tr><td>amount</td><td>money</td><td>Yes</td><td>10</td><td>TOTAL</td><td>Sales total amount</td></tr><tr><td>supplierId</td><td>zpad9</td><td>Yes</td><td>9</td><td>FILIACAO</td><td>Supplying store membership number</td></tr><tr><td>distributorId</td><td>string</td><td>Yes</td><td>9</td><td>DISTRIBUIDOR</td><td>Membership number of distributing store / card issuer, when B2B</td></tr><tr><td>orderId</td><td>string</td><td>Yes</td><td>16</td><td>NUMPEDIDO</td><td>Order number generated by the merchant</td></tr><tr><td>docNum1</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC1</td><td>Airline: ticket number of the main passenger</td></tr><tr><td>docNum2</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC2</td><td>Airline: ticket number of the second passenger</td></tr><tr><td>docNum3</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC3</td><td>Airline: ticket number of the third passenger</td></tr><tr><td>docNum4</td><td>string</td><td>Yes</td><td>16</td><td>NUMDOC4</td><td>Airline: ticket number of the fourth passenger</td></tr><tr><td>pax1</td><td>string</td><td>Yes</td><td>26</td><td>PAX1</td><td>Airline: The name of the main passenger</td></tr><tr><td>pax2</td><td>string</td><td>Yes</td><td>26</td><td>PAX2</td><td>Airline: The name of the second passenger</td></tr><tr><td>pax3</td><td>string</td><td>Yes</td><td>26</td><td>PAX3</td><td>Airline: The name of the third passenger</td></tr><tr><td>pax4</td><td>string</td><td>Yes</td><td>26</td><td>PAX4</td><td>Airline: The name of the fourth passenger</td></tr><tr><td>additionalData</td><td>string</td><td>Yes</td><td>0</td><td>AddData</td><td>Only for Airline Companies, Hotels and Car Rental merchants</td></tr></table><h3>Callback</h3><p>Callback function receives ```err``` and a hash of return values.</p><table><tr><th>Field</th><th>Type</th><th>Original Redecard Field</th><th>Description</th></tr><tr><td>code</td><td>integer</td><td>CODRET</td><td>Return code</td></tr><tr><td>message</td><td>string</td><td>MSGRET</td><td>Return message</td></tr><tr><td>orderId</td><td>string</td><td>NUMPEDIDO</td><td>Order number</td></tr></table>