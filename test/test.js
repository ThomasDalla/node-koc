/*global describe, it, before, beforeEach, after, afterEach */

var chai           = require('chai'),
    chaiAsPromised = require("chai-as-promised"),
    fs             = require('fs'),
    KoC            = require('../lib/koc'),
    helpers        = require('../lib/helpers'),
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
        var requiredFields = ['userid','alliance','username','armySize','race','gold', 'goldText','rank'];
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
      ['username', 'fortification', 'goldText', 'experienceText', 'turns', 'rank',
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
       it( "should have property 'gold' which is a number", function() {
         return result.should.have.property("gold").that.is.a.number;
       } );
       it( "should have property 'experience' which is a number", function() {
         return result.should.have.property("experience").that.is.a.number;
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
      turing                  : "hruen",
      error                   : "",
    } ],
    [ 'test/html/armory_new-user-advisor.html', {
      nbAttackWeapons         : 6,
      nbDefenseWeapons        : 1,
      nbSpyTools              : 4,
      nbSentryTools           : 4,
      fortification           : "Portcullis (x 3.81)",
      siegeTechnology         : "Catapults (x 4.83)",
      turing                  : "fykdg",
      error                   : "",
    } ],
    [ 'test/html/armory_repair.html', {
      nbAttackWeapons         : 2,
      nbDefenseWeapons        : 1,
      nbSpyTools              : 0,
      nbSentryTools           : 0,
      fortification           : "Camp (x 1)",
      siegeTechnology         : "None (x 1)",
      turing                  : "dbh",
      error                   : "",
    } ],
    [ 'test/html/armory_not-enough-money.html', {
      nbAttackWeapons         : 2,
      nbDefenseWeapons        : 1,
      nbSpyTools              : 0,
      nbSentryTools           : 0,
      fortification           : "Camp (x 1)",
      siegeTechnology         : "None (x 1)",
      turing                  : "udnvm",
      error                   : "Not enough money for those items.",
    } ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseArmory(html);
      it('should be an object', function() {
        return result.should.be.an('object').that.contain.keys('currentWeapons','buyWeapons','upgrades','militaryEffectiveness','personnel','repairAll','turing','error');
      });
      it('turing should be: ' + expected.turing, function() {
        return result.should.be.an('object').that.has.property('turing').that.eql(expected.turing);
      });
      it('error should be: ' + expected.error, function() {
        return result.should.be.an('object').that.has.property('error').that.eql(expected.error);
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

describe('Verify E-Mail', function() {
  describe('#verification not a valid e-mail address', function() {
    var localKoC = new KoC();
    localKoC.setSession('abc');
    var verifyPromise = localKoC.verifyEmail("not a valid email address");
    it('should be fulfilled', function() {
      return verifyPromise.should.be.fulfilled;
    });
    it('should have success field that is false', function() {
      return verifyPromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field that is not empty', function() {
      return verifyPromise.should.eventually.have.property("error").that.is.not.empty;
    });
  });
  describe('#verification not logged in', function() {
    var localKoC = new KoC();
    var verifyPromise = localKoC.verifyEmail("valid@email.com");
    it('should be fulfilled', function() {
      return verifyPromise.should.be.fulfilled;
    });
    it('should have success field that is false', function() {
      return verifyPromise.should.eventually.have.property("success").that.is.false;
    });
    it('should have error field that is not empty', function() {
      return verifyPromise.should.eventually.have.property("error").that.is.not.empty;
    });
  });
  var cases = [
    [ 'test/html/verify.html'            , ''                                                 ],
    [ 'test/html/verify_email-taken.html', 'There is already a user with that e-mail address' ],
    [ 'test/html/verify_email-sent.html' , ''                                                 ],
  ];
  cases.forEach(function(verifyCase){
    var htmlPath = verifyCase[0];
    var expectedErrorMessage = verifyCase[1];
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseVerifyEmailError(html);
      it("should be: '" + expectedErrorMessage + "'", function() {
        return result.should.be.a('string').that.eql(expectedErrorMessage);
      });
    });
  });
});

describe('Parse Training' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/train_first-time.html', {
      message           : ""       ,
      turing            : "hruen"  ,
      totalFightingForce: 14       ,
      trainingPrograms  : 6        ,
      upgrades          :
      [
        {
          currentTitle: 'Current Covert Skill',
          upgradeName: 'Upgrade',
          currentLevel: 'Level 0',
          cost: '9,600 Gold (+60%)',
          inputName: 'upgrade_spy',
        },
       {
         title: 'Increase Conscription',
         currentTitle: 'Current Conscription Rate',
         upgradeName: 'Upgrade to 5 per day',
         currentLevel: '0 soldiers per day',
         cost: '3,000 Gold',
         inputName: 'upgrade_prod',
       },
       {
         title: 'Economic Development',
         currentTitle: 'Current Economy',
         upgradeName: 'Research Hunting (100 gold per turn)',
         currentLevel: 'None (0 gold per turn)',
         cost: '300 Experience',
         inputName: 'upgrade_economy',
       },
       {
         title: 'Technological Development',
         currentTitle: 'Current Technologies',
         upgradeName: 'Research!',
         currentLevel: 'You have no technology',
         cost: '300 Experience',
         inputName: 'upgrade_tech',
       }
      ]
    }],
    [ 'test/html/train_no-technology.html', {
      message           : ""       ,
      turing            : "mbx"    ,
      totalFightingForce: 106      ,
      trainingPrograms  : 6        ,
      upgrades          :
      [
        {
          currentTitle: 'Current Covert Skill',
          upgradeName: 'Upgrade',
          currentLevel: 'Level 3',
          cost: '39,300 Gold (+60%)',
          inputName: 'upgrade_spy',
        },
       {
         title: 'Increase Conscription',
         currentTitle: 'Current Conscription Rate',
         upgradeName: 'Upgrade to 5 per day',
         currentLevel: '0 soldiers per day',
         cost: '3,000 Gold',
         inputName: 'upgrade_prod',
       },
       {
         title: 'Economic Development',
         currentTitle: 'Current Economy',
         upgradeName: 'Research Hunting (100 gold per turn)',
         currentLevel: 'None (0 gold per turn)',
         cost: '300 Experience',
         inputName: 'upgrade_economy',
       },
       {
         title: 'Technological Development',
         currentTitle: 'Current Technologies',
         upgradeName: 'Research!',
         currentLevel: 'You have no technology',
         cost: '300 Experience',
         inputName: 'upgrade_tech',
       }
      ]
    }],
    [ 'test/html/train_one-technology.html', {
      message           : ""       ,
      turing            : "chy"    ,
      totalFightingForce: 109      ,
      trainingPrograms  : 6        ,
      upgrades          :
      [
        {
          currentTitle: 'Current Covert Skill',
          upgradeName: 'Upgrade',
          currentLevel: 'Level 4',
          cost: '62,900 Gold (+60%)',
          inputName: 'upgrade_spy',
        },
       {
         title: 'Increase Conscription',
         currentTitle: 'Current Conscription Rate',
         upgradeName: 'Upgrade to 5 per day',
         currentLevel: '0 soldiers per day',
         cost: '3,000 Gold',
         inputName: 'upgrade_prod',
       },
       {
         title: 'Economic Development',
         currentTitle: 'Current Economy',
         upgradeName: 'Research Hunting (100 gold per turn)',
         currentLevel: 'None (0 gold per turn)',
         cost: '300 Experience',
         inputName: 'upgrade_economy',
       },
       {
         title: 'Technological Development',
         currentTitle: 'Current Technologies',
         upgradeName: 'Research!',
         currentLevel: 'Spear  (x 1.05 strength)',
         cost: '350 Experience',
         inputName: 'upgrade_tech',
       }
      ]
    }],
    [ 'test/html/train_two-technologies.html', {
      message           : ""       ,
      turing            : "chy"    ,
      totalFightingForce: 109      ,
      trainingPrograms  : 6        ,
      upgrades          :
      [
        {
          currentTitle: 'Current Covert Skill',
          upgradeName: 'Upgrade',
          currentLevel: 'Level 4',
          cost: '62,900 Gold (+60%)',
          inputName: 'upgrade_spy',
        },
       {
         title: 'Increase Conscription',
         currentTitle: 'Current Conscription Rate',
         upgradeName: 'Upgrade to 5 per day',
         currentLevel: '0 soldiers per day',
         cost: '3,000 Gold',
         inputName: 'upgrade_prod',
       },
       {
         title: 'Economic Development',
         currentTitle: 'Current Economy',
         upgradeName: 'Research Hunting (100 gold per turn)',
         currentLevel: 'None (0 gold per turn)',
         cost: '300 Experience',
         inputName: 'upgrade_economy',
       },
       {
         title: 'Technological Development',
         currentTitle: 'Current Technologies',
         upgradeName: 'Research!',
         currentLevel: 'Fire  (x 1.1 strength)',
         cost: '400 Experience',
         inputName: 'upgrade_tech',
       }
      ]
    }],
    [ 'test/html/train_three-technologies.html', {
      message           : "You have researched Oven!",
      turing            : "chy"    ,
      totalFightingForce: 109      ,
      trainingPrograms  : 6        ,
      upgrades          :
      [
        {
          currentTitle: 'Current Covert Skill',
          upgradeName: 'Upgrade',
          currentLevel: 'Level 4',
          cost: '62,900 Gold (+60%)',
          inputName: 'upgrade_spy',
        },
       {
         title: 'Increase Conscription',
         currentTitle: 'Current Conscription Rate',
         upgradeName: 'Upgrade to 5 per day',
         currentLevel: '0 soldiers per day',
         cost: '3,000 Gold',
         inputName: 'upgrade_prod',
       },
       {
         title: 'Economic Development',
         currentTitle: 'Current Economy',
         upgradeName: 'Research Hunting (100 gold per turn)',
         currentLevel: 'None (0 gold per turn)',
         cost: '300 Experience',
         inputName: 'upgrade_economy',
       },
       {
         title: 'Technological Development',
         currentTitle: 'Current Technologies',
         upgradeName: 'Research!',
         currentLevel: 'Oven  (x 1.16 strength)',
         cost: '460 Experience',
         inputName: 'upgrade_tech',
       }
      ]
    }],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseTraining(html);
      it('should be an object', function() {
        return result.should.be.an('object').that.contain.keys('success','personnel','train','upgrades','message','turing');
      });
      it('turing should be: ' + expected.turing, function() {
        return result.should.be.an('object').that.has.property('turing').that.eql(expected.turing);
      });
      it('message should be: \'' + expected.message + "'", function() {
        return result.should.be.an('object').that.has.property('message').that.eql(expected.message);
      });
      it( expected.upgrades.length + " upgrades", function() {
        return result.should.be.an('object').that.has.property('upgrades').that.has.length(expected.upgrades.length);
      });
      it( expected.trainingPrograms + " training programs", function() {
        return result.should.be.an('object').that.has.property('train').that.has.length(expected.trainingPrograms);
      });
      it('total fighting force: ' + expected.totalFightingForce, function() {
        return result.should.be.an('object').that.has.property('personnel').that.has.property('Total Fighting Force').that.eql(expected.totalFightingForce);
      });
      var upgradeCount = 0;
      expected.upgrades.forEach(function(upgrade) {
        var actualUpgrade = result.upgrades[upgradeCount++];
        var keys = Object.keys(upgrade);
        keys.forEach(function(key) {
          it( 'upgrade #' + upgradeCount + " " + key + ': ' + upgrade[key], function() {
            return actualUpgrade.should.be.an('object').that.has.property(key).that.eql(upgrade[key]);
          });
        });
      });
    });
  });
});

describe('Test Quantity From String', function() {
  var cases = [
    // input        , default  , output
    [ "5,000"       , undefined,  5000 ],
    [ "abc"         , undefined, "abc" ],
    [ "None"        ,         0,     0 ],
    [ "<1,87^"      , undefined,   187 ],
    [ "-100"        , undefined,  -100 ],
    [ "one777two888", undefined,   777 ],
  ];
  cases.forEach(function(currentCase){
    it("helpers.quantityFromString('"+currentCase[0]+"',"+currentCase[1]+") == " + currentCase[2], function(){
      helpers.quantityFromString(currentCase[0],currentCase[1]).should.eql(currentCase[2]);
    });
  });
});

describe('Parse Mercenaries' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/mercs_first-time.html', {
      message           : ""    ,
      turing            : "gnv" ,
      totalFightingForce: 115   ,
      trainingPrograms  : 6     ,
      hire:
      [
        {
          mercenaryType: 'Attack Specialist',
          costPerUnitText: '4,500 Gold',
          costPerUnit: 4500,
          quantityAvailableText: 'None',
          quantityAvailable: 0,
          inputName: 'mercs[attack]',
          inputValue: 0,
        },
        {
          mercenaryType: 'Defense Specialist',
          costPerUnitText: '4,500 Gold',
          costPerUnit: 4500,
          quantityAvailableText: 'None',
          quantityAvailable: 0,
          inputName: 'mercs[defend]',
          inputValue: 0,
        },
        {
          mercenaryType: 'Untrained',
          costPerUnitText: '3,500 Gold',
          costPerUnit: 3500,
          quantityAvailableText: 'None',
          quantityAvailable: 0,
          inputName: 'mercs[general]',
          inputValue: 0,
        }
      ]
    }],
    [ 'test/html/mercs_defense-only.html', {
      message           : ""    ,
      turing            : "wjre",
      totalFightingForce: 56    ,
      trainingPrograms  : 6     ,
      hire:
      [
        {
          mercenaryType: 'Attack Specialist',
          costPerUnitText: '4,500 Gold',
          costPerUnit: 4500,
          quantityAvailableText: 'None',
          quantityAvailable: 0,
          inputName: 'mercs[attack]',
          inputValue: 0,
        },
        {
          mercenaryType: 'Defense Specialist',
          costPerUnitText: '4,500 Gold',
          costPerUnit: 4500,
          quantityAvailableText: '11',
          quantityAvailable: 11,
          inputName: 'mercs[defend]',
          inputValue: 0,
        },
        {
          mercenaryType: 'Untrained',
          costPerUnitText: '3,500 Gold',
          costPerUnit: 3500,
          quantityAvailableText: 'None',
          quantityAvailable: 0,
          inputName: 'mercs[general]',
          inputValue: 0,
        }
      ]
    }],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseMercenaries(html);
      it('should be an object', function() {
        return result.should.be.an('object').that.contain.keys('success','personnel','hire','message','turing');
      });
      it('turing should be: ' + expected.turing, function() {
        return result.should.be.an('object').that.has.property('turing').that.eql(expected.turing);
      });
      it('message should be: \'' + expected.message + "'", function() {
        return result.should.be.an('object').that.has.property('message').that.eql(expected.message);
      });
      it( expected.hire.length + " mercenary tpes", function() {
        return result.should.be.an('object').that.has.property('hire').that.has.length(expected.hire.length);
      });
      it('total fighting force: ' + expected.totalFightingForce, function() {
        return result.should.be.an('object').that.has.property('personnel').that.has.property('Total Fighting Force').that.eql(expected.totalFightingForce);
      });
      var hireCount = 0;
      expected.hire.forEach(function(hire) {
        var actualHire = result.hire[hireCount++];
        var keys = Object.keys(hire);
        keys.forEach(function(key) {
          it( 'hire #' + hireCount + " " + key + ': ' + hire[key], function() {
            return actualHire.should.be.an('object').that.has.property(key).that.eql(hire[key]);
          });
        });
      });
    });
  });
});

describe('Parse Recruit' , function() {
  var htmlPaths = [
    // page                              , expected to be
    [ 'test/html/recruit_first-time.html',
      {
        success: true,
        image: '/ads/recruit.img?313568&uniqid=vqr4na2u',
        morale: '0',
        hiddenFields: {
          iuniqid: '1f8097b1f1a2c611c13ea7c54df5a8d1',
          uniqid: 'vqr4na2u',
        },
        "recruitPreferences":
        [
          {
            "checked": false,
            "name": "Only Me",
            "value": "1",
          },
          {
            "checked": false,
            "name": "Friends",
            "value": "2",
          },
          {
            "checked": true,
            "name": "Anyone",
            "value": "4",
          }
        ],
        "recruitPreferencesInputName": "clickPref",
        "fieldName": "image_click_value",
      }
    ],
    [ 'test/html/recruit_01.html',
      {
        success: true,
        image: '/ads/recruit.img?a37867&uniqid=4p1tq6gt',
        morale: '-100',
        hiddenFields: {
          iuniqid: 'e1ee70ae2b1f5d644d175a5fdf889632',
          uniqid: '4p1tq6gt',
        },
        "recruitPreferences":
        [
          {
            "checked": false,
            "name": "Only Me",
            "value": "1",
          },
          {
            "checked": false,
            "name": "Friends",
            "value": "2",
          },
          {
            "checked": true,
            "name": "Anyone",
            "value": "4",
          }
        ],
        "recruitPreferencesInputName": "clickPref",
        "fieldName": "image_click_value",
      }
    ],
    [ "test/html/recruit_invalid_01.html",
      {
        success: false,
        error: 'Invalid Selection',
        challenge_url: 'http://api.recaptcha.net/challenge?k=6LcvaQQAAAAAACnjh5psIedbdyYzGDb0COW82ruo',
        recruitPreferences:
         [ { name: 'Only Me', value: '1', checked: false },
           { name: 'Anyone', value: '4', checked: true } ],
        recruitPreferencesInputName: 'clickPref',
        challengeField: 'recaptcha_challenge_field',
        challengeResponseField: 'recaptcha_response_field',
        hiddenFields: {
          recaptcha_response_field: "manual_challenge",
          uniqid: "ab1cd2ef",
        },
      }
    ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath = page[0];
    var expected = page[1];
    describe('#local ' + htmlPath, function() {
      var html   = fs.readFileSync(htmlPath, 'utf8');
      var result = koc.parser.parseRecruit(html);
      it('should be as expected', function() {
        return result.should.be.an('object').that.eql(expected);
      });
    });
  });
});

describe('Parse Attack Log' , function() {
  var htmlPaths = [
    // page                                , on you, total, current, max, by you, total, current, max
    [ 'test/html/attacklog_first-time.html',      3,     3,       1,   1,     10,    11,       1,   2 ],
    [ 'test/html/attacklog_no-by-you.html' ,     10,    15,       1,   2,      0,     0,       1,   1 ],
    [ 'test/html/attacklog_xhr.html'       ,      5,    15,       2,   2,      1,     1,       1,   1 ],
  ];
  htmlPaths.forEach(function(page){
    var htmlPath     = page[0];
    var onYou        = page[1];
    var onYouTotal   = page[2];
    var onYouCurrent = page[3];
    var onYouMax     = page[4];
    var byYou        = page[5];
    var byYouTotal   = page[6];
    var byYouCurrent = page[7];
    var byYouMax     = page[8];
    describe('#local ' + htmlPath, function() {
      var html     = fs.readFileSync(htmlPath, 'utf8');
      var result   = koc.parser.parseAttackLog(html);
      //console.log(result);
      it('should be an object', function() {
        return result.should.be.an('object');
      });
      it('should have success==true', function() {
        return result.should.have.property('success').that.is.true;
      });
      it('should have ' + onYou + ' attacks on you', function() {
        return result.should.have.property('attacksOnYou').that.has.property('attacks').that.has.length(onYou);
      });
      it('should have ' + byYou + ' attacks by you', function() {
        return result.should.have.property('attacksByYou').that.has.property('attacks').that.has.length(byYou);
      });
      it('should have ' + onYouTotal + ' total attacks on you', function() {
        return result.should.have.property('attacksOnYou').that.has.property('total').that.eql(onYouTotal);
      });
      it('should have ' + byYouTotal + ' total attacks by you', function() {
        return result.should.have.property('attacksByYou').that.has.property('total').that.eql(byYouTotal);
      });
      it('attacks on you should be on page ' + onYouCurrent + ' / ' + onYouMax, function() {
        result.should.have.property('attacksOnYou').that.has.property('currentPage').that.eql(onYouCurrent);
        result.should.have.property('attacksOnYou').that.has.property('maxPage').that.eql(onYouMax);
      });
      it('attacks by you should be on page ' + byYouCurrent + ' / ' + byYouMax, function() {
        result.should.have.property('attacksByYou').that.has.property('currentPage').that.eql(byYouCurrent);
        result.should.have.property('attacksByYou').that.has.property('maxPage').that.eql(byYouMax);
      });
    });
  });
});
