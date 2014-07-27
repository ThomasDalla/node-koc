var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    fs             = require('fs'),
    KoC            = require('../koc'),
    koc            = new KoC();
chai.use(chaiAsPromised);
var should = chai.should(); // seems unused but it required

describe('Parse Battlefield' , function() {
  var htmlPaths = [
    'test/html/battlefield_full_logged-out.html',
    'test/html/battlefield_xhr_logged-out.html',
    'test/html/battlefield_xhr_logged-in.html',
    'test/html/battlefield_full_first-login.html'
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
    var imagePromise = koc.getReCaptchaChallenge();
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

describe('Parse Base' , function() {
  var htmlPaths = [
    'test/html/base_first-login.html',
    'test/html/base_01.html'
  ];
  htmlPaths.forEach(function(htmlPath){
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parseBase(html);
      //console.log(result);
      it('should be an object', function() {
        return result.should.be.an.object;
      });
      var requiredFields = [
        [ 'userInfo',
          [ 'userid', 'username', 'race', 'rank', 'highestRank', 'commander' ] ],
        [ 'militaryOverview',
          [ 'fortification', 'siegeTechnology', 'economy', 'technology',
            'conscription', 'availableFunds', 'projectedIncome',
            'gameTurns', 'covertLevel' ] ],
        [ 'militaryEffectiveness',
          [ 'strikeAction', 'strikeActionRank', 'defensiveAction', 'defensiveActionRank',
            'spyRating', 'spyRatingRank', 'sentryRating', 'sentryRatingRank' ] ],
        [ 'personnel', [ 'trainedAttackSoldiers', 'trainedAttackMercenaries',
          'trainedDefenseSoldiers', 'trainedDefenseMercenaries',
          'untrainedSoliders', 'untrainedMercenaries', 'spies', 'sentries',
          'armyMorale', 'totalFightingForce' ] ]
      ];
      requiredFields.forEach(function(requiredField){
        var field = requiredField[0];
        var subfields = requiredField[1];
        it( "Should have '" + field + "' that is an object", function() {
          return result.should.have.property( field ).that.is.an('object');
        });
        var fieldValue = result[field];
        subfields.forEach(function(subfield){
          it( "Field '" + field + "' should have property '" + subfield + "' that is not empty", function() {
            return fieldValue.should.have.property( subfield ).that.is.not.empty;
          });
        });
      });
      it( "Should have an array 'previousLogins'", function() {
        return result.should.have.property( "previousLogins" ).that.is.an('array');
      });
      var previousLogins = result.previousLogins;
      previousLogins.forEach( function(previousLogin) {
        ['ip','date','success'].forEach(function(previousLoginField) {
          it( "A previous login should have '" + previousLoginField + "' that is not empty", function() {
            return previousLogin.should.have.property( previousLoginField ).that.is.not.empty;
          });
        });
      });
    } );
  });
  describe( "#remote failing because no session id", function() {
    var localKoC = new KoC();
    var basePromise = localKoC.getUserInfo();
    it('should be fulfilled', function() {
      return basePromise.should.be.fulfilled;
    });
    it('should have success field', function() {
      return basePromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field', function() {
      return basePromise.should.eventually.have.property("error").that.is.not.empty;
    });
    it('should have a user field', function() {
      return basePromise.should.eventually.have.property("user").that.is.empty;
    });
  });
  describe( "#remote failing because not logged in", function() {
    var localKoC = new KoC();
    localKoC.setSession("invalid session");
    var basePromise = localKoC.getUserInfo();
    it('should be fulfilled', function() {
      return basePromise.should.be.fulfilled;
    });
    it('should have session field', function() {
      return basePromise.should.eventually.have.property("session").that.is.not.empty;
    });
    it('should have success field', function() {
      return basePromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field', function() {
      return basePromise.should.eventually.have.property("error").that.is.not.empty;
    });
  });
} );

describe('Parse Left-Side Box' , function() {
  var htmlPaths = [
    // page                                        , has the box
    [ 'test/html/base_first-login.html'            , true  ],
    [ 'test/html/base_01.html'                     , true  ],
    [ 'test/html/base_mails_read.html'             , true  ],
    [ 'test/html/battlefield_full_logged-out.html' , false ],
    [ 'test/html/battlefield_xhr_logged-out.html'  , false ],
    [ 'test/html/battlefield_xhr_logged-in.html'   , false ],
    [ 'test/html/battlefield_full_first-login.html', true  ],
    [ 'test/html/home.html'                        , false ],
    [ 'test/html/verify.html'                      , true  ]
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var hasBox   = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parseLeftSideBox(html);
      //console.log(result);
      it('should be an object', function() {
        return result.should.be.an.object;
      });
      ['username', 'fortification', 'gold', 'experience', 'turns', 'rank',
       'lastAttacked', 'mails' ].forEach( function(field) {
         it( "should have property '" + field + "'", function() {
           return result.should.have.property(field).that.is.not.empty;
         } );
         if(hasBox)
           it( "property '" + field + "' should not be ???", function() {
             return result.should.have.property(field).that.is.not.equal("???");
           } );
       });
       it( "should have property 'newMails' which is a boolean", function() {
         return result.should.have.property("newMails").that.is.a.boolean;
       } );
    });
  });
});