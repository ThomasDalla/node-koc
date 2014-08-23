/*global describe, it, before, beforeEach, after, afterEach */

var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    fs             = require('fs'),
    KoC            = require('../lib/koc'),
    koc            = new KoC();
chai.use(chaiAsPromised);
chai.should();

describe('Parse Battlefield' , function() {
  var htmlPaths = [
    'test/html/battlefield_full_logged-out.html',
    'test/html/battlefield_xhr_logged-out.html',
    'test/html/battlefield_xhr_logged-in.html',
    'test/html/battlefield_full_first-login.html'
  ];
  htmlPaths.forEach( function(htmlPath) {
    describe('#' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseBattlefield(html);
      it('should return 20 records', function() {
        return result.length.should.equal(20);
      });
      var index = 0;
      result.forEach( function(player) {
        index++;
        var requiredFields = ['userid','alliance','username','armySize','race','gold','rank'];
        requiredFields.forEach(function(requiredField) {
          it( "player #" + index.toString() + " should have '" + requiredField +"'", function() {
            return player.should.have.property(requiredField).that.is.not.undefined;
          });
        });
      });
    } );
  } );
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
    'test/html/base_01.html',
    'test/html/base_02.html',
    'test/html/base_commander.html'
  ];
  htmlPaths.forEach(function(htmlPath){
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseBase(html);
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
          'untrainedSoldiers', 'untrainedMercenaries', 'spies', 'sentries',
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
      if( previousLogins !== undefined ) {
        previousLogins.forEach( function(previousLogin) {
          ['ip','date','success'].forEach(function(previousLoginField) {
            it( "A previous login should have '" + previousLoginField + "' that is not empty", function() {
              return previousLogin.should.have.property( previousLoginField ).that.is.not.empty;
            });
          });
        });
      }
      it( "Should have the number of changes left", function() {
        return result.should.have.property( "raceChangesLeft" ).that.is.a('number').that.is.gte(0);
      });
      it( "Should have an array 'recentAttacksOnYou'", function() {
        return result.should.have.property( "recentAttacksOnYou" ).that.is.an('array');
      });
      var recentAttacks = result.recentAttacksOnYou;
      if( recentAttacks !== undefined ) {
        recentAttacks.forEach( function(recentAttack) {
          ['date','result'].forEach(function(previousLoginField) {
            it( "A recent attack should have '" + previousLoginField + "' that is not empty", function() {
              return recentAttack.should.have.property( previousLoginField ).that.is.not.empty;
            });
          });
          it( "should have a field 'enemy' that has non-empty property 'username'", function() {
            return recentAttack.should.have.property('enemy').that.is.an('object').that.has.property('username').that.is.not.empty;
          });
          it( "should have a field 'enemy' that has non-empty property 'userid'", function() {
            return recentAttack.should.have.property('enemy').that.is.an('object').that.has.property('userid').that.is.not.empty;
          });
        });
      }
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
      var result   = koc.parser.parseLeftSideBox(html);
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

describe('Parse Races Information', function() {
  describe( "#remote", function() {
    var basePromise = koc.getRacesInformation();
    it('should be fulfilled', function() {
      return basePromise.should.be.fulfilled;
    });
    it('should have success field that is true', function() {
      return basePromise.should.eventually.have.property("success").that.is.true;
    });
    it('should have kocHost field that is a string of length > 4', function() {
      return basePromise.should.eventually.have.property("kocHost").that.is.a('string').that.has.length.above(4);
    });
    it('should have races field that is an array of 5 items and features should be an array', function() {
      return basePromise.should.eventually.have.property("races")
            .that.is.an('array')
            .that.has.length(5)
            .that.has.deep.property('[0]')
              .that.contain.keys('race','description','features','image','colours')
              .that.has.property('features').that.is.an('array');
    });
    it('should have races field that is an array of 5 items and colours should be an object', function() {
      return basePromise.should.eventually.have.property("races")
            .that.is.an('array')
            .that.has.length(5)
            .that.has.deep.property('[0]')
              .that.contain.keys('race','description','features','image','colours')
              .that.has.property('colours').that.is.an('object').that.contain.keys('background','border','text');
    });
  });
});

describe('Parse New User Advisor' , function() {
  var htmlPaths = [
    // page                                        , has it,     expected to contain
    [ 'test/html/alliances_first-time.html'        , true, 'Alliances allow players to work together'　　　　　　　　　　],
    [ 'test/html/armory_first-time.html'           , true, 'status of your weapons and tools'                            ],
    [ 'test/html/attacklog_first-time.html'        , true, 'record of all incoming and outgoing attacks'                 ],
    [ 'test/html/base_first-login.html'            , true, 'This is your Command Center'                                 ],
    [ 'test/html/base_01.html'                     , true, 'This is your Command Center'                                 ],
    [ 'test/html/base_mails_read.html'             , true, 'This is your Command Center'                                 ],
    [ 'test/html/battlefield_full_logged-out.html' , false                                                               ],
    [ 'test/html/battlefield_xhr_logged-out.html'  , false                                                               ],
    [ 'test/html/battlefield_xhr_logged-in.html'   , false                                                               ],
    [ 'test/html/battlefield_full_first-login.html', true, 'This is the battlefield page'                                ],
    [ 'test/html/buddylist_first-time.html'        , true, 'players of interest for later reference'                     ],
    [ 'test/html/conquest_first-time.html'         , true, 'quickest way to gain Experience'                             ],
    [ 'test/html/home.html'                        , false                                                               ],
    [ 'test/html/intel_first-time.html'            , true, 'results of intercepted incoming Sabotage and Recon missions' ],
    [ 'test/html/mercs_first-time.html'            , true, 'increase your Army\'s size for a fee'                        ],
    [ 'test/html/recruit_first-time.html'          , true, 'effective way for you to build your army\'s morale'          ],
    [ 'test/html/stats_first-time.html'            , true, 'view information about other players'                        ],
    [ 'test/html/train_first-time.html'            , true, 'train your soldiers to be one of four types'                 ],
    [ 'test/html/verify.html'                      , false                                                               ]
  ];
  htmlPaths.forEach(function(page){
    var htmlPath      = page[0];
    var hasHelp       = page[1];
    var shouldContain = page[2];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseNewUserAdvisor(html);
      //console.log(result);
      it('should be a string', function() {
        return result.should.be.a('string');
      });
      if(hasHelp) {
         it( "should be a string of length > 4", function() {
           return result.should.be.a('string').and.has.length.above(4);
         } );
         it( "should contain '" + shouldContain+ "'", function() {
           return result.should.be.a('string').and.contain(shouldContain);
         } );
      }
      else {
         it( "should be empty", function() {
           return result.should.be.a('string').and.equal('');
         } );
      }
    });
  });
});

describe('Parse Error' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/error_please-login.html', 'Please login to view that page.'                           　　　　　　　　　　],
    [ 'test/html/error_cookies.html'     , 'An unknown error has occurred. Please check to make sure cookies are enabled.' ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseErrorMessage(html);
      //console.log(result);
      it('should be a string', function() {
        return result.should.be.a('string');
      });
      it( "should be a string of length > 4", function() {
       return result.should.be.a('string').and.has.length.above(4);
      } );
      it( "should equal '" + expected + "'", function() {
       return result.should.be.a('string').and.equal(expected);
      } );
    });
  });
});

describe('Parse Banned' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/bansuspend.html', 'You have been banned for Violating KoC Rules' ]
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseBannedMessage(html);
      //console.log(result);
      it('should be a string', function() {
        return result.should.be.a('string');
      });
      it( "should be a string of length > 4", function() {
       return result.should.be.a('string').and.has.length.above(4);
      } );
      it( "should equal '" + expected + "'", function() {
       return result.should.be.a('string').and.equal(expected);
      } );
    });
  });
});

describe('Parse Age' , function() {
  var htmlPaths = [
    // page
    'test/html/alliances_first-time.html',
    'test/html/armory_first-time.html',
    'test/html/attacklog_first-time.html',
    'test/html/base_first-login.html',
    'test/html/base_01.html',
    'test/html/base_mails_read.html',
    'test/html/battlefield_full_logged-out.html',
    //'test/html/battlefield_xhr_logged-out.html',
    //'test/html/battlefield_xhr_logged-in.html',
    'test/html/battlefield_full_first-login.html',
    'test/html/buddylist_first-time.html',
    'test/html/conquest_first-time.html',
    'test/html/home.html',
    'test/html/intel_first-time.html',
    'test/html/mercs_first-time.html',
    'test/html/recruit_first-time.html',
    'test/html/stats_first-time.html',
    'test/html/train_first-time.html',
    'test/html/verify.html'
  ];
  htmlPaths.forEach(function(htmlPath){
    describe('#local ' + htmlPath, function() {
      var html = fs.readFileSync(htmlPath, 'utf8');
      var age  = koc.parser.guessAge(html);
      it( "age should be 17", function() {
       return age.should.equal(17);
      } );
    });
  });
});

describe('Parse Commander Change' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/commander_change.html', {
      success                  : true,
      nbTimesCanChangeCommander: 4,
      errorMessage             : '',
      statement                : '/images/commchange.gif'
    } ],
    [ 'test/html/commander_change_wrong-pass.html', {
      success                  : true,
      nbTimesCanChangeCommander: 4,
      errorMessage             : 'Your current password is required to make the requested changes.',
      statement                : '/images/commchange.gif'
    } ],
    [ 'test/html/commander_change_wrong-statement.html', {
      success                  : true,
      nbTimesCanChangeCommander: 4,
      errorMessage             : 'Please copy the text exactly as it appears',
      statement                : '/images/commchange.gif'
    } ],
    [ 'test/html/base_01.html', { // not found
      success                  : false,
      nbTimesCanChangeCommander: -1,
      errorMessage             : '',
      statement                : ''
    } ],
    [ 'test/html/commander_change_max.html', { // not found
      success                  : false,
      nbTimesCanChangeCommander: -1,
      errorMessage             : 'You cannot change your commander any more.',
      statement                : ''
    } ]
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseCommanderChange(html);
      it('should be an object', function() {
        return result.should.be.an('object');
      });
      it( "should equal expected value", function() {
       return result.should.eql( expected );
      } );
    });
  });
});

describe('Parse Menu' , function() {
  var htmlPaths = [
    // page
    'test/html/alliances_first-time.html',
    'test/html/armory_first-time.html',
    'test/html/attacklog_first-time.html',
    'test/html/base_first-login.html',
    'test/html/base_01.html',
    'test/html/base_mails_read.html',
    //'test/html/battlefield_full_logged-out.html',
    //'test/html/battlefield_xhr_logged-out.html',
    //'test/html/battlefield_xhr_logged-in.html',
    'test/html/battlefield_full_first-login.html',
    'test/html/buddylist_first-time.html',
    'test/html/conquest_first-time.html',
    //'test/html/home.html',
    'test/html/intel_first-time.html',
    'test/html/mercs_first-time.html',
    'test/html/recruit_first-time.html',
    'test/html/stats_first-time.html',
    'test/html/train_first-time.html',
    //'test/html/verify.html'
  ];
  htmlPaths.forEach(function(htmlPath){
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseMenu(html);
      it( "should be a menu", function() {
       return result.should.be.an('array').that.has.length.above(3);
      } );
    });
  });
});

describe('Test Help', function() {
  var help = koc.getHelp();
  it( "should be an array of 5 items", function() {
    return help.should.be.an('array').that.has.length(5);
  } );
  if( help.length>0) {
    var gameplay = help[0];
    it( "the first item should have title 'Gameplay'", function() {
      return gameplay.should.be.an('object').that.has.property('title').that.deep.eql('Gameplay');
    } );
    it( "the first item should have 5 sections", function() {
      return gameplay.should.be.an('object').that.has.property('sections').that.has.length(6);
    } );
    var i=0;
    help.forEach( function(helpRootItem){
      it( "item "+ i + " should have 'title', 'help' and 'sections'", function() {
        return gameplay.should.be.an('object').that.has.keys('sections', 'help', 'title');
      } );
      it( "item "+ i + " should have non-empty 'title'", function() {
        return gameplay.should.be.an('object').that.have.property('title').that.is.not.empty;
      } );
      i++;
    });
  }
});

describe('Parse Forgot Pass' , function() {
  var htmlPaths = [
    // page
    [ 'test/html/forgotpass.html'               , ""                                                                           ],
    [ 'test/html/forgotpass_wrong-email.html'   , "That email address does not exist in our system."                           ],
    [ 'test/html/forgotpass_wrong-username.html', "That username does not exist in our system."                                ],
    [ 'test/html/forgotpass_invalid-email.html' , "Invalid Email"                                                              ],
    [ 'test/html/forgotpass_success.html'       , "Your login details will be emailed to you in 30 minutes."                   ],
    [ 'test/html/forgotpass_success2.html'      , "Your login details have been emailed to you and will arrive in 30 minutes." ]
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseForgotPass(html);
      it( "should be '" + expected + "'", function() {
       return result.should.be.a('string').that.eql(expected);
      } );
    });
  });
  describe( "#remote error because unknown e-mail", function() {
    var localKoC = new KoC();
    var forgotPassPromise = localKoC.forgotPass( "", "warlord@koc.abc");
    it('should be fulfilled', function() {
      return forgotPassPromise.should.be.fulfilled;
    });
    it('should have success field that is false', function() {
      return forgotPassPromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field == "That email address does not exist in our system."', function() {
      return forgotPassPromise.should.eventually.have.property("error").that.eql("That email address does not exist in our system.");
    });
  });
  describe( "#remote error because unknown username", function() {
    var localKoC = new KoC();
    var forgotPassPromise = localKoC.forgotPass( "War Lord", "");
    it('should be fulfilled', function() {
      return forgotPassPromise.should.be.fulfilled;
    });
    it('should have success field that is false', function() {
      return forgotPassPromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field == "That email address does not exist in our system."', function() {
      return forgotPassPromise.should.eventually.have.property("error").that.eql("That username does not exist in our system.");
    });
  });
});

describe('Logout' , function() {
  describe( "#remote logout", function() {
    var localKoC = new KoC();
    var logoutPromise = localKoC.logout();
    it('should be fulfilled', function() {
      return logoutPromise.should.be.fulfilled;
    });
    it('should have success field (true)', function() {
      return logoutPromise.should.eventually.have.property("success").that.is.true;
    });
    it('should have error field (empty)', function() {
      return logoutPromise.should.eventually.have.property("error").that.is.empty;
    });
  });
} );

describe('Parse Full User Stats' , function() {
  var htmlPaths = [
    // page                                         , commander, nb officers, total nb officers, number of alliances, primary alliance
    [ 'test/html/stats_NoOfficer_Alliance.html'     , "P0lytech"         ,  0,  0, 1, 'Forces of Darkness' ],
    [ 'test/html/stats_NoOfficer_NoAlliance.html'   , "chosen"           ,  0,  0, 0, null                 ],
    [ 'test/html/stats_Officers_Alliance.html'      , "TheGodFather_LaCN", 10, 25, 1, "La Cosa Nostra"     ],
    [ 'test/html/stats_Officers_NoMainAlliance.html', 'None'             ,  7,  7, 1, null                 ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath        = page[0];
    var commander       = page[1];
    var officersNb      = page[2];
    var totalOfficersNb = page[3];
    var alliancesNb     = page[4];
    var primaryAlliance = page[5];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseFullStats(html);
      //console.log(result);
      it('should be an object', function() {
        return result.should.be.an('object');
      });
      it('should have success==true', function() {
        return result.should.have.property('success').that.is.true;
      });
      it('should have user which is an object', function() {
        return result.should.have.property('user').that.is.an('object').that.contain.keys(
          'username',
          'commander',
          'race',
          'rank',
          'highestRank',
          'armyMorale',
          'fortification',
          'buddyStatus',
          'alliances',
          'officers'
        );
      });
      it('should have commander ' + commander, function() {
        return result.should.have.property('user').that.has.property('commander').that.has.property('username').that.eql(commander);
      });
      it('should have ' + officersNb + ' officers', function() {
        return result.should.have.property('user').that.has.property('officers').that.is.an('array').that.has.length(officersNb);
      });
      it('should have ' + totalOfficersNb + ' total officers', function() {
        return result.should.have.property('user').that.has.property('totalOfficersNb').that.eql(totalOfficersNb);
      });
      it('should have ' + alliancesNb + ' alliances', function() {
        return result.should.have.property('user').that.has.property('alliances').that.is.an('array').that.has.length(alliancesNb);
      });
      if(primaryAlliance !== null) {
        it('should have primary alliance ' + primaryAlliance, function() {
          return result.should.have.property('user').that.has.property('primaryAlliance').that.is.an('object').that.has.property('name').that.eql(primaryAlliance);
        });
      } else {
        it('should have no primary alliance ' + primaryAlliance, function() {
          return result.should.have.property('user').that.has.property('primaryAlliance').that.is.an('object').that.has.property('name').that.is.empty;
        });
      }
    });
  });
});


describe('Parse Armory' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/armory_first-time.html', {
      nbAttackWeapons         : 2,
      nbDefenseWeapons        : 0,
      nbSpyTools              : 0,
      nbSentryTools           : 0,
      fortification           : "Camp (x 1)",
      siegeTechnology         : "None (x 1)",
    } ],
    [ 'test/html/armory_new-user-advisor.html', {
      nbAttackWeapons         : 6,
      nbDefenseWeapons        : 1,
      nbSpyTools              : 4,
      nbSentryTools           : 4,
      fortification           : "Portcullis (x 3.81)",
      siegeTechnology         : "Catapults (x 4.83)",
    } ],
    [ 'test/html/armory_repair.html', {
      nbAttackWeapons         : 2,
      nbDefenseWeapons        : 1,
      nbSpyTools              : 0,
      nbSentryTools           : 0,
      fortification           : "Camp (x 1)",
      siegeTechnology         : "None (x 1)",
    } ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseArmory(html);
      it('should be an object', function() {
        return result.should.be.an('object').that.contain.keys('currentWeapons','buyWeapons','upgrades','militaryEffectiveness','personnel','repairAll');
      });
      [{
        type: "Attack Weapons",
        nbWeapons: expected.nbAttackWeapons
      },{
        type: "Defense Weapons",
        nbWeapons: expected.nbDefenseWeapons
      },{
        type: "Spy Tools",
        nbWeapons: expected.nbSpyTools
      },{
        type: "Sentry Tools",
        nbWeapons: expected.nbSentryTools
      }].forEach(function(currentWeapon){
        it( 'buyWeapons should have more than one ' + currentWeapon.type, function() {
         return result.should.be.an('object').that.has.property('buyWeapons').that.has.property(currentWeapon.type).that.is.an('array').that.has.length.gt(1);
        } );
        if(currentWeapon.nbWeapons>0) {
          it( 'currentWeapons should have ' + currentWeapon.nbWeapons + ' ' + currentWeapon.type, function() {
           return result.should.be.an('object').that.has.property('currentWeapons').that.has.property(currentWeapon.type).that.is.an('array').that.has.length(currentWeapon.nbWeapons);
          } );
        }
        else {
          it( 'currentWeapons should have no ' + currentWeapon.type, function() {
           return result.should.be.an('object').that.has.property('currentWeapons').that.not.has.property(currentWeapon.type);
          } );
        }
      });
      it('current fortification should be ' + expected.fortification, function() {
        return result.should.be.an('object').that.has.property('upgrades').that.has.property('fortification').that.has.property('current').that.eql(expected.fortification);
      });
      it('current siege technology should be ' + expected.siegeTechnology, function() {
        return result.should.be.an('object').that.has.property('upgrades').that.has.property('siegeTechnology').that.has.property('current').that.eql(expected.siegeTechnology);
      });
      // Personnel
      [ 'Trained Attack Soldiers', 'Trained Attack Mercenaries', 'Trained Defense Soldiers', 'Trained Defense Mercenaries',
        'Untrained Soldiers', 'Untrained Mercenaries', 'Spies', 'Sentries', 'Army Morale', 'Total Fighting Force'].forEach(function(personnelProperty){
          it( 'personnel should have ' + personnelProperty, function() {
           return result.should.be.an('object').that.has.property('personnel').that.has.property(personnelProperty).that.is.a('number');
          } );
        });
      it('militaryEffectiveness should have at least 4 items (SA, DA, Spy, Sentry)', function() {
        return result.should.be.an('object').that.has.property('militaryEffectiveness').that.is.an('array').that.has.length.gte(4);
      });
    });
  });
});