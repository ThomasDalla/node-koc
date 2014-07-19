var should = require('chai').should(),
    koc = require('../koc'),
    test = koc.test;

describe('#test', function() {
  var result = test();
  it('should respond "hellow, world"', function() {
    result.should.equal("hellow, world");
  });
});