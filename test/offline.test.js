// Run $ expresso

/**
 * Module dependencies.
 */

var redecard = require('../index.js'),
    assert = require('assert');

module.exports = {
  'test getAuthorized': function() {
    try {
      redecard.getAuthorized({
        TOTAL: '1.00',
        TRANSACAO: redecard.TRANSACTION_TYPES.FULL_PAYMENT,
        PARCELAS: '00',
        FILIACAO: '36483184',
        NUMPEDIDO: 'ITEM-001',
        NRCARTAO: '4111111111111111',
        CVC2: '123',
        MES: '01',
        ANO: '16',
        PORTADOR: 'JOHN DOE'
      }, function(err, data) {
        console.log('getAuthorized callback')
      });
    } catch(e) {
      console.log(e);
    }
    assert.equal(6, 'foobar'.length);
  }
};