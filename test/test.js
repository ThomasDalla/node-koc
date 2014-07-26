var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    fs             = require('fs'),
    KoC            = require('../koc'),
    koc            = new KoC();
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
            return player.should.have.property(requiredFields[i]).that.is.not.undefined;
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
    it('should have a session field', function() {
      return loginPromise.should.eventually.have.property("session").that.is.not.empty;
    });
    it('should have success field', function() {
      return loginPromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field', function() {
      return loginPromise.should.eventually.have.property("error").that.is.not.empty;
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
      return imagePromise.should.eventually.have.property("success").that.is.true;
    });
    it('should have image field', function() {
      return imagePromise.should.eventually.have.property("image").that.is.not.empty;
    });
    it('should have challenge field', function() {
      return imagePromise.should.eventually.have.property("challenge").that.is.not.empty;
    });
  })
});

describe('Signup', function() {
  describe('#verification wrong username and password', function() {
    var verifyPromise = koc.verify("wrong username","wrong password","not same password");
    it('should be fulfilled', function() {
      return verifyPromise.should.be.fulfilled;
    });
    it('should have success field', function() {
      return verifyPromise.should.eventually.have.property("success").that.is.true;
    });
    it('should have username field', function() {
      return verifyPromise.should.eventually.have.property("username").that.is.not.empty;
    });
    it('should have password field', function() {
      return verifyPromise.should.eventually.have.property("password").that.is.not.empty;
    });
  });
  describe('#verification wrong username correct pass', function() {
    var verifyPromise = koc.verify("wrong username","AcceptedPass","AcceptedPass");
    it('should be fulfilled', function() {
      return verifyPromise.should.be.fulfilled;
    });
    it('should have success field', function() {
      return verifyPromise.should.eventually.have.property("success").that.is.true;
    });
    it('should have username field', function() {
      return verifyPromise.should.eventually.have.property("username").that.is.not.empty;
    });
    it('should have password field', function() {
      return verifyPromise.should.eventually.have.property("password").that.is.empty;
    });
  });
});