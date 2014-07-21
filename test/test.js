var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    fs             = require('fs'),
    koc            = require('../koc');
chai.use(chaiAsPromised);
var should = chai.should();

describe('Parse Battlefield' , function() {
  var htmlPaths = [
    'test/html/battlefield_full_logged-out.html',
    'test/html/battlefield_xhr_logged-out.html',
    'test/html/battlefield_xhr_logged-in.html',
    'test/html/battlefield_full_first-login.html',
  ];
  for(var iHtml in htmlPaths) {
    var htmlPath = htmlPaths[iHtml];
    describe('#' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parseBattlefield(html);
      it('should return 20 records', function() {
        return result.length.should.equal(20);
      });
      for(var index in result) {
        var player = result[index];
        var requiredFields = ['userid','alliance','username','armySize','race','gold','rank'];
        for(var i in requiredFields){
          it( "player #" + (index+1) + " should have '" + requiredFields[i] +"'", function() {
            return player.should.have.property(requiredFields[i])
              && player[requiredFields[i]].should.not.be.undefined;
          });
        }
      }
    } );
  }
} );

describe('Login' , function() {
  describe("#wrong credentials", function() {
    var loginPromise = koc.login("wrong username","wrong password");
    it('should be fulfilled', function() {
      return loginPromise.should.be.fulfilled;
    });
    it('should have KOC_SESSION_COOKIE field', function() {
      return loginPromise.should.eventually.have.property("KOC_SESSION_COOKIE");
    });
    it('should have success field', function() {
      return loginPromise.should.eventually.have.property("success");
    });
    it('should have error field', function() {
      return loginPromise.should.eventually.have.property("error");
    });
  });
});

describe('ReCaptcha Image', function() {
  describe('#get image', function() {
    var imagePromise = koc.getLoginCaptcha();
    it('should be fulfilled', function() {
      return imagePromise.should.be.fulfilled;
    });
    it('should have success field', function() {
      return imagePromise.should.eventually.have.property("success");
    });
    it('should have image field', function() {
      return imagePromise.should.eventually.have.property("image");
    });
  })
});