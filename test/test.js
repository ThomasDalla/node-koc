var should = require('chai').should(),
    fs     = require('fs'),
    koc    = require('../koc');

describe('#battlefield' , function() {
  var htmlPaths = [
    'test/html/battlefield_xhr_logged-out.html',
    'test/html/battlefield_full_logged-out.html'
  ];
  for(var iHtml in htmlPaths) {
    var htmlPath = htmlPaths[iHtml];
    console.log('Parsing battlefield from ' + htmlPath);
    var html     = fs.readFileSync(htmlPath, 'utf8');
    var result   = koc.parseBattlefield(html);
    it('should have 20 records', function() {
      result.length.should.equal(20);
    });
    for(var index in result) {
      var player = result[index];
      it('each player should have all properties', function() {
        var requiredFields = ['userid','alliance','username','armySize','race','gold','rank'];
        for(var i in requiredFields){
          player.should.have.property(requiredFields[i]);
          player[requiredFields[i]].should.not.be.undefined;
        }
      });
    }
  }
} );