/*jslint evil: true */

/** @exports parser
 * KoC Parser - To parse KoC HTML pages into JS Objects */
var parser = {};

var helpers = require('./helpers');

/**
 * Parse and return the turing from given HTML content
 * @param {String} html HTML content to be parsed
 * @return {String} Turing, if found, empty if not
 */
parser.getTuring = function (html) {
  var re = /name="turing"\s*value="([^"]+)">/gmi;
  var m = re.exec(html);
  if (m !== null)
    return m[1];
  return "";
};

parser.parseErrorMessageRed = function (html) {
  var re = /<font\s*color="red">([^<]+)/gmi;
  var m = re.exec(html);
  if (m !== null)
    return m[1];
  return "";
};

/**
 * Get the error message from a KoC error.php page
 * @param {String} html the HTML page to parse the error from
 * @return {String} the error message, if found, "Unknown Error" otherwise
 */
parser.parseErrorMessage = function (html) {
  var re = /<h3>Error<\/h3>([^<]+)</gmi;
  var m = re.exec(html);
  if (m !== null) {
    return m[1].trim();
  }
  return "Unknown Error";
};

/**
 * Get the reason for being banned from a KoC bansuspend.php page
 * @param {String} html the HTML page to parse the error from
 * @return {String} the reason, if found, "Unknown Reason" otherwise
 */
parser.parseBannedMessage = function (html) {
  var re = /Banned<\/[^>]*>\s*([^<]+)/gmi;
  var m = re.exec(html);
  if (m !== null) {
    return m[1].trim();
  }
  return "Unknown Reason";
};

/**
 * Parses a battlefield page in HTML format and returns an array of players
 * @param {String} html the content of the HTML page to parse
 * @return {Object} an object with an array of the players information found on that page
 */
parser.parseBattlefield = function (html) {
  var reLoggedIn = /<td align="center" valign="middle" style="padding: 0">\s*(.*)\s*(.*)\s*<\/td>\s*<td.*><a href="alliances\.php\?id=([^"]*)">\s*([^<]*)<\/a><\/td>\s*<td><a class="player" href="\/stats\.php\?id=([0-9]+)"\s*>([^<]+)<\/a><\/td>[^>]*>([0-9,]+)<\/td>[^>]*>\s*([A-Za-z0-9-_]+)\s*<\/td>[^>]*>([^G]+)Gold<\/td>[^>]*>([^<]+)<\/td>/gmi;
  var reLoggedOut = /<a href="alliances\.php\?id=([^"]*)">\s*([^<]*)<\/a><\/td>\s*<td><a class="player" href="\/stats\.php\?id=([0-9]+)"\s*>([^<]+)<\/a><\/td>[^>]*>([0-9,]+)<\/td>[^>]*>\s*([A-Za-z0-9-_]+)\s*<\/td>[^>]*>([^G]+)Gold<\/td>[^>]*>([^<]+)<\/td>/gmi;
  var players = [];
  var loggedIn = false;
  var m;
  [
    {
      re: reLoggedIn,
      loggedIn: true
    },
    {
      re: reLoggedOut,
      loggedIn: false
    }
  ].forEach(function (currentCase) {
      if (!players.length) { // do not check reLoggedOut if reLoggedIn worked
        while ((m = currentCase.re.exec(html)) !== null) {
          var startFrom = 1;
          var player = {};
          if (currentCase.loggedIn) {
            loggedIn = true;
            startFrom = 3;
            player.buddyStatus = helpers.parseBuddyStatus(m[1]); // Buddy Information
            player.intelFile = helpers.parseIntelFile(m[2]);   // Spy Information
          }
          player.alliance = {
            id: m[startFrom],
            name: m[startFrom + 1].replace("&nbsp;",""),
          };
          player.userid = m[startFrom + 2];
          player.username = m[startFrom + 3];
          player.armySizeText = m[startFrom + 4];
          player.armySize = helpers.quantityFromString(m[startFrom + 4]);
          player.race = m[startFrom + 5];
          player.goldText = m[startFrom + 6].trim();
          player.gold = helpers.quantityFromString(m[startFrom + 6], -1);
          player.rankText = m[startFrom + 7];
          player.rank = helpers.quantityFromString(m[startFrom + 7], -1);
          players.push(player);
        }
      }
    });
  // Pages
  var reTotal = />(.*) players total \| page (.*) of ([^<]+)/gmi;
  var playersTotal = 0,
    currentPage = 0,
    maxPage = 0;
  var mTotal = reTotal.exec(html);
  if (mTotal !== null) {
    playersTotal = helpers.quantityFromString(mTotal[1]);
    currentPage = helpers.quantityFromString(mTotal[2]);
    maxPage = helpers.quantityFromString(mTotal[3]);
  }
  return {
    players: players,
    playersTotal: playersTotal,
    currentPage: currentPage,
    maxPage: maxPage,
    loggedIn: loggedIn,
    success: true,
  };
};

/**
 * Get user info from the base HTML page
 * @param {String} baseHtml HTML content of the Base page
 * @return {Object} an object containing user information
 */
parser.parseBase = function (baseHtml) {
  //var re=/<tr>\s*<td>\s*<b>Name<\/b>\s*<\/td>\s*<td>\s*<a href="stats\.php\?id=([0-9]+)">([^<]+)<\/a>\s*<\/td>\s*<\/tr>/mg;
  //var re = new RegExp(createTrRegExp("Name", '<a href="stats\\.php\\?id=([0-9]+)">([^<]+)<\\/a>'), 'gm');
  try {
    var reUserInfo = new RegExp(helpers.createTableRegExp([{
      Key: "Name",
      Value: '<a href="stats\\.php\\?id=([0-9]+)">([^<]+)<\\/a>' // 1, 2
    }, {
      Key: "Race",
      Value: '([^<]+)' // 3
    }, {
      Key: "Rank",
      Value: '([^<]+)' // 4
    }, {
      Key: "Highest Rank",
      Value: '([^<]+)' // 5
    }]), 'gm');
    var matches = reUserInfo.exec(baseHtml);
    var reCommander = /Commander<\/b>\s*<\/td>\s*<td>\s*<a.*\?id=([0-9]+)">([^<]+)<\/a>/gmi;
    var mCommander = reCommander.exec(baseHtml);
    var commander = (mCommander === null) ? {
      username: '',
      userid: -1
    } : {
      username: mCommander[2],
      userid: mCommander[1]
    };
    var reMilitary = new RegExp(helpers.createTableRegExp([{
      Key: "Fortification",
      Value: '([^<]+)' // 1
    }, {
      Key: "Siege Technology",
      Value: '([^<]+)' // 2
    }, {
      Key: "Economy",
      Value: '([^<]+)' // 3
    }, {
      Key: "Technology",
      Value: '([^<]+)' // 4
    }, {
      Key: "Conscription",
      Value: '([^<]+)' // 5
    }, {
      Key: "Available Funds",
      Value: '([^<]+)' // 6
    }, {
      Key: "Projected Income",
      Value: '([^<]+)' // 7
    }, {
      Key: "Game Turns",
      Value: '([^<]+)' // 8
    }, {
      Key: "Covert Level",
      Value: '([^<]+)' // 9
    }]), 'gm');
    var matchesMilitary = reMilitary.exec(baseHtml);
    var reMilitaryEffectiveness = new RegExp(helpers.createTableTripleTdRegExp([{
      Key: "<b>Strike Action<\\/b>",
      Value1: '([^<]+)', // 3
      Value2: '([^<]+)' // 5
    }, {
      Key: "<b>Defensive Action<\\/b>",
      Value1: '([^<]+)', // 8
      Value2: '([^<]+)' // 10
    }, {
      Key: "<b>Spy Rating<\\/b>",
      Value1: '([^<]+)', // 13
      Value2: '([^<]+)' // 15
    }, {
      Key: "<b>Sentry Rating<\\/b>",
      Value1: '([^<]+)', // 18
      Value2: '([^<]+)' // 20
    }]), 'gm');
    var matchesMilitaryEffectiveness = reMilitaryEffectiveness.exec(baseHtml);
    var rePreviousLogins = new RegExp(helpers.createTableTripleTdRegExp([{
      Key: "([0-9.]+)", // 2
      Value1: '([^<]+)', // 4
      Value2: '([^<]+)' // 6
    }]), 'gm');
    var previousLogins = [];
    var matchesPreviousLogins;
    while ((matchesPreviousLogins = rePreviousLogins.exec(baseHtml)) !== null) {
      previousLogins.push({
        ip: matchesPreviousLogins[2],
        date: matchesPreviousLogins[4],
        success: matchesPreviousLogins[6]
      });
    }
    var rePersonnel = new RegExp(helpers.createTableTripleTdRegExp([{
      Key: "<b>Trained Attack Soldiers<\\/b>",
      Value1: '([^<]+)', // 3
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Trained Attack Mercenaries<\\/b>",
      Value1: '([^<]+)', // 11
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Trained Defense Soldiers<\\/b>",
      Value1: '([^<]+)', // 19
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Trained Defense Mercenaries<\\/b>",
      Value1: '([^<]+)', // 27
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Untrained Soldiers<\\/b>",
      Value1: '([^<]+)', // 35
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Untrained Mercenaries<\\/b>",
      Value1: '([^<]+)', // 43
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Spies<\\/b>",
      Value1: '([^<]+)', // 51
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Sentries<\\/b>",
      Value1: '([^<]+)', // 59
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Army Morale<\\/b>",
      Value1: '([^<]+)', // 67
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }, {
      Key: "<b>Total Fighting Force<\\/b>",
      Value1: '([^<]+)', // 75
      Value2: '([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    }]), 'gm');
    var matchesPersonnel = rePersonnel.exec(baseHtml);
    //if(matches!==null) this.username = matches[2];
    // Race Change
    var reRaceChangesLeft = /([0-9]+) changes left/gmi;
    var mRaceChangesLeft = reRaceChangesLeft.exec(baseHtml);
    var raceChangesLeft = (mRaceChangesLeft !== null) ? Number(mRaceChangesLeft[1]) : -1;
    // Recent Attacks
    var reRecentAttacks = /<tr>\s*<td>(.*)<\/td>\s*<td>\s*<a.*href="stats\.php\?id=([0-9]+)".*>(.*)<\/a>.*<\/td>.*<td>([^<]+)/gmi;
    var mRecentAttacks;
    var recentAttacks = [];
    while ((mRecentAttacks = reRecentAttacks.exec(baseHtml)) !== null) {
      recentAttacks.push({
        date: mRecentAttacks[1],
        enemy: {
          username: mRecentAttacks[3],
          userid: mRecentAttacks[2]
        },
        result: mRecentAttacks[4]
      });
    }
    return {
      success: true,
      userInfo: {
        userid: matches[1],
        username: matches[2],
        race: matches[3].trim(),
        rank: matches[4],
        highestRank: matches[5],
        commander: commander
      },
      militaryOverview: {
        fortification: matchesMilitary[1],
        siegeTechnology: matchesMilitary[2],
        economy: matchesMilitary[3],
        technology: matchesMilitary[4],
        conscription: matchesMilitary[5],
        availableFunds: matchesMilitary[6],
        projectedIncome: matchesMilitary[7],
        gameTurns: matchesMilitary[8].trim().split('/')[0].trim(),
        covertLevel: matchesMilitary[9]
      },
      militaryEffectiveness: {
        strikeAction: matchesMilitaryEffectiveness[3],
        strikeActionRank: matchesMilitaryEffectiveness[5].replace(/Ranked #/gm, ''),
        defensiveAction: matchesMilitaryEffectiveness[8],
        defensiveActionRank: matchesMilitaryEffectiveness[10].replace(/Ranked #/gm, ''),
        spyRating: matchesMilitaryEffectiveness[13],
        spyRatingRank: matchesMilitaryEffectiveness[15].replace(/Ranked #/gm, ''),
        sentryRating: matchesMilitaryEffectiveness[18],
        sentryRatingRank: matchesMilitaryEffectiveness[20].replace(/Ranked #/gm, '')
      },
      personnel: {
        trainedAttackSoldiers: matchesPersonnel[3],
        trainedAttackMercenaries: matchesPersonnel[11],
        trainedDefenseSoldiers: matchesPersonnel[19],
        trainedDefenseMercenaries: matchesPersonnel[27],
        untrainedSoldiers: matchesPersonnel[35],
        untrainedMercenaries: matchesPersonnel[43],
        spies: matchesPersonnel[51],
        sentries: matchesPersonnel[59],
        armyMorale: matchesPersonnel[67],
        totalFightingForce: matchesPersonnel[75]
      },
      previousLogins: previousLogins,
      raceChangesLeft: raceChangesLeft,
      recentAttacksOnYou: recentAttacks
    };
  }
  catch (e) {
    return {
      success: false,
      error: "An error occurred parsing the base: " + e.toString()
    };
  }
};

/**
 * Parse the box on the left-side of each page with the stats
 * @param {String} html the HTML content of the page to parse
 * @return {Object} an object containing gold, experience, turns, rank,
 *                  lastAttacked, mails and newMails if found
 */
parser.parseLeftSideBox = function (html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return result;

  // Username and Fortification
  var re = /<title>Kings\s*of\s*Chaos\s*::\s*([^'<,]+)[^ ]*\s*([^<]+)<\/title>/gmi;
  var m = re.exec(html);
  result.username = (m !== null) ? m[1] : "???";
  result.fortification = (m !== null) ? m[2] : "???";

  // Gold
  re.compile(/Gold:[^>]+>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.goldText = (m !== null) ? m[1] : "???";
  result.gold = (m !== null) ? helpers.quantityFromString(m[1], 0) : 0;
  result.success = m !== null;

  // Experience
  re.compile(/Experience:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.experienceText = (m !== null) ? m[1] : "???";
  result.experience = helpers.quantityFromString(result.experienceText);

  // Turns
  re.compile(/Turns:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.turns = (m !== null) ? m[1] : "???";

  // Rank
  re.compile(/Rank:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.rank = (m !== null) ? m[1] : "???";

  // Last Attacked
  re.compile(/Last Attacked:\s*<[^>]+>\s*<[^>]+>([^\n<]+)/gmi);
  m = re.exec(html);
  result.lastAttacked = (m !== null) ? m[1] : "???";

  // Mails
  re.compile(/Mail:\s*<a\s*href="[^"]*"\s*style="font-size:\s*[^;]*;\s*color:\s*([^;]+);">([^\n<]+)/gmi);
  m = re.exec(html);
  result.mails = (m !== null) ? m[2] : "???";
  result.newMails = !!(m !== null && m[1] == "RED");

  return result;
};

/**
 * Get available races information
 * @param {String} html HTML content of the page to parse
 */
parser.parseRacesInfo = function (html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return result;

  // Background colours
  var re = /<th\s*class="([^"]+)"\s*style="background-color:\s*([^;]+);\s*border:\s*([^ ]+)\s*[^;]*;">/gmi;
  var m;
  var colours = {};
  while ((m = re.exec(html)) !== null) {
    colours[m[1]] = {
      background: m[2],
      border: m[3]
    };
  }

  // Colours
  re.compile(/style="color:([^"]+)" value="Join ([^!]+)!/gmi);
  while ((m = re.exec(html)) !== null) {
    if (colours[m[2]] === undefined)
      colours[m[2]] = {};
    colours[m[2]].text = m[1];
  }

  // Images
  re.compile(/<td\s*class="([^"]+)"\s*align="[^"]+">\s*<img\s*src="([^"]+)"/gmi);
  var images = {};
  while ((m = re.exec(html)) !== null) {
    images[m[1]] = /*this.getKoCHost() +*/ m[2];
  }

  // Features
  re.compile(/<td\s*class="([^"]+)"\s*align="center"\s*>([^:]+):<br \/>\s*<b>\s*([^<]+)\s*<\/b>\s*<br \/>\s*<b>\s*([^<]+)\s*/gmi);
  var races = [];
  while ((m = re.exec(html)) !== null) {
    races.push({
      race: m[1],
      description: m[2],
      features: [
        m[3],
        m[4]
      ],
      image: images[m[1]],
      colours: colours[m[1]]
    });
  }
  return races;
};

/**
 * Get the New User Advisor content, when available
 * @param {String} html HTML content of the page to parse
 */
parser.parseNewUserAdvisor = function (html) {
  if (html === undefined || html === null || !html.length)
    return '';
  var re = /New\s*User\s*Advisor<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*/gmi;
  var m = re.exec(html);
  if (m === null) return '';
  var startIndex = re.lastIndex;
  re = /<\/td>/gmi;
  re.lastIndex = startIndex;
  m = re.exec(html);
  if (m === null) return '';
  var endIndex = m.index;
  var rawResult = html.substring(startIndex, endIndex);
  var strippedResult = helpers.stripHtml(rawResult);
  return strippedResult.replace(/\s+/gmi, " ");
};

/**
 * Guess the age from the HTML on the page
 * @param {String} html HTML content of the page to parse
 * @return {Number} KoC Age
 */
parser.guessAge = function (html) {
  if (html === undefined || html === null || !html.length)
    return 0;
  var re = /age([0-9]+)\./gmi;
  var m = re.exec(html);
  if (m === null) return -1;
  return Number(m[1]);
};

/**
 * Parse the menu on the left side
 * @param {String} html HTML content of the page to parse
 * @return {Array} all the items in the menu (containing page, image and title)
 */
parser.parseMenu = function (html) {
  var result = [];
  if (html === undefined || html === null || !html.length)
    return result;
  var re = /<a.*href="([^"]+)">.*<img.*alt="([^"]+)".*src="([^"]+)"[^>]*.*width="137".*>/gmi;
  var m;
  while ((m = re.exec(html)) !== null) {
    result.push({
      page: m[1],
      title: m[2],
      image: m[3]
    });
  }
  return result;
};

/**
 * Get the number of times we can change the commander
 * and the statement to copy (image)
 * @return {Object} If succeeded, returns an object with 'success',
 * 'nbTimesCanChangeCommander', 'errorMessage' and 'statement' properties
 */
parser.parseCommanderChange = function (html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return result;
  var re = /you may only do this\s*(.*)\s*times during the age/gmi;
  var m1 = re.exec(html);
  var nbTimesCanChange = (m1 === null) ? -1 : Number(helpers.stripHtml(m1[1]));
  re = /<p>\s*<font\s*color="RED"\s*>(.*)<\/font>\s*<p>/gmi;
  var m2 = re.exec(html);
  var errorMessage = (m2 === null) ? "" : m2[1];
  if (!errorMessage.length) {
    errorMessage = this.parseErrorMessage(html);
    if (errorMessage == "Unknown Error")
      errorMessage = "";
  }
  re = /action="commander_change\.php".*>\s*<img.*src="([^"]+)">/gmi;
  var m3 = re.exec(html);
  var statement = (m3 === null) ? "" : m3[1];
  return {
    success: (m1 !== null) && (m2 !== null) && (m3 !== null),
    nbTimesCanChangeCommander: nbTimesCanChange,
    errorMessage: errorMessage,
    statement: statement
  };
};

/**
 * Parse the error message on a forgot pass page
 * @param {String} html the HTML page to parse
 */
parser.parseForgotPass = function (html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return result;
  var re = /<p>\s*<font\s*color="RED"\s*>(.*)<\/font>\s*<p>/gmi;
  var m = re.exec(html);
  var errorMessage = (m === null) ? "" : m[1];
  if (!errorMessage.length) {
    errorMessage = this.parseErrorMessage(html);
    if (errorMessage == "Unknown Error")
      errorMessage = "";
  }
  return helpers.stripHtml(errorMessage);
};

parser.parseOfficers = function (html) {

};

parser.parseFullStats = function (html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Main User Stats
  var reUserStats = /Name:[\s<tdrbpa>\/\\]*<td>\s*([^\s]+)\s*<\/td>[\s<tdrbpa>\/\\]*Commander:\s*<\/b>\s*<\/td>\s*<td[^>]*>\s*(.*)\s*<\/td>[\s<tdrbpa>\/\\]*Alliances:\s*<\/b>\s*<\/td>\s*<td>\s*(.*)\s*<\/td>[\s<tdrbpa>\/\\]*Race:[\s<tdrbpa>\/\\]*<td>\s*([^<\s]+)[\s<tdrbpa>\/\\]*Rank:[\s<tdrbpa>\/\\]*<td>([^<\s]+)[\s<tdrbpa>\/\\]*Highest Rank:[\s<tdrbpa>\/\\]*([^<]+)[\s<tdrbpa>\/\\]*Army\s*Size:[\s<tdrbpa>\/\\]*([^<\s]+)[\s<tdrbpa>\/\\]*Army Morale:[\s<tdrbpa>\/\\]*([^<\s]+)/gmi;
  var mUserStats = reUserStats.exec(html);
  if (mUserStats === null)
    return {
      success: false,
      error: "Failed to parse user stats"
    };
  result.success = true;
  // Gold
  var reGold = /Treasury\s*:\s*.*\s*<td>([^<]*)/gmi;
  var mGold = reGold.exec(html);
  var goldText = (mGold !== null) ? mGold[1] : "???";
  var gold = (mGold !== null) ? helpers.quantityFromString(mGold[1], 0) : 0;
  // Fortification / Buddy Status
  var reFortBuddy = /[\s<tdrbpa>\/\\]*Fortifications\s*:[\s<tdrbpa>\/\\]*>\s*([\s<0-9a-z=>\/\\]+)\s*<\/td>[\s<a-z=>\/\\"0-9]*Buddy\s*List\s*Status\s*:[\s<a-z=>\/\\"]*>\s*([\s<0-9a-z=>\/\\]+)\s*<\/td>/gmi;
  var mFortBuddy = reFortBuddy.exec(html);
  var fortification = "",
    buddyStatus = "";
  if (mFortBuddy !== null) {
    fortification = mFortBuddy[1];
    buddyStatus = mFortBuddy[2];
  }
  // Parse the commander
  var reCommander = /id=(\d*)">([^<]*)/gmi;
  var mCommander = reCommander.exec(mUserStats[2]);
  var commanderUsername = (mCommander === null) ? mUserStats[2] : mCommander[2];
  var commanderUserid = (mCommander === null) ? -1 : mCommander[1];
  // Parse the primary alliance
  var rePrimaryAlliance = /id=(\d*)">\s*([^<]+)\s*<\/a>\s*<\/b>\s*\(\s*Primary/gmi;
  var mPrimaryAlliance = rePrimaryAlliance.exec(mUserStats[3]);
  var primaryAlliance = mPrimaryAlliance !== null ? {
    name: mPrimaryAlliance[2],
    id: mPrimaryAlliance[1]
  } : {
    name: "",
    id: -1
  };
  // Parse the alliance(s)
  var reAlliances = /id=(\d*)">([^<]*)/gmi;
  var mAlliances;
  var alliances = [];
  while ((mAlliances = reAlliances.exec(mUserStats[3])) !== null) {
    alliances.push({
      name: mAlliances[2],
      id: mAlliances[1],
      primary: mAlliances[2] == primaryAlliance.name
    });
  }
  // Officers
  var reOfficers = /<a href="stats\.php\?id=(\d+)"\s*>\s*([^<]+)\s*<\/a>\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/gmi;
  var mOfficers;
  var officers = [];
  while ((mOfficers = reOfficers.exec(html)) !== null) {
    officers.push({
      username: mOfficers[2],
      userid: mOfficers[1],
      rank: mOfficers[3],
      armySize: mOfficers[4],
      race: mOfficers[5].trim()
    });
  }
  // Total Officers
  var reTotalOfficers = />(.*) officers total/gmi;
  var mTotalOfficers = reTotalOfficers.exec(html);
  var totalOfficersNb = mTotalOfficers === null ? 0 : mTotalOfficers[1];
  result.user = {
    username: mUserStats[1],
    commander: {
      username: commanderUsername,
      userid: commanderUserid
    },
    race: mUserStats[4],
    rank: mUserStats[5],
    highestRank: mUserStats[6],
    armySize: mUserStats[7],
    armyMorale: mUserStats[8],
    fortification: fortification,
    buddyStatus: buddyStatus,
    gold: gold,
    goldText: goldText,
    alliances: alliances,
    primaryAlliance: primaryAlliance,
    officers: officers,
    totalOfficersNb: Number(totalOfficersNb)
  };
  return result;
};

parser.parseArmory = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Weapon Categories
  var re = /class="subh"\s*align="left"\s*>\s*([^<]+)/gmi;
  var m;
  var weaponCategories = [];
  while ((m = re.exec(html)) !== null) {
    weaponCategories.push({
      name: m[1],
      index: m.index
    });
  }
  // Current Weapons
  var reCurrentWeapons = />([^<]+)<\/td>\s*<td\s*align="right">([^<]+)<\/td>\s*<td\s*align="[rightcenter]+"\s*>([^<]+)<\/td>\s*<td\s*align="center"\s*>\s*<ta/gmi;
  var reCurrentTools = />([^<]+)<\/td>\s*<td\s*align="right">([^<]+)<\/td>\s*<td\s*align="[rightcenter]+"\s*>([^<]+)<\/td>\s*<form/gmi;
  var currentWeapons = {};
  var mCurrentWeapons;
  var getCategoryForIndex = function (index, categories) {
    var i = 1;
    while (categories[i].index < index && i < categories.length)
      i++;
    return categories[--i].name;
  };
  // Current Weapons - Sell Price
  var reSellFor = /input\s*type="input"\s*name="([^"]+).*\s*.*\s*.*\s*.*Sell for ([^"]+)/gmi;
  var mSellFor;
  var weaponsSellFor = [];
  while ((mSellFor = reSellFor.exec(html)) !== null) {
    var rePrice = /([0-9,]+)/;
    var mPrice = rePrice.exec(mSellFor[2]);
    var price = (mPrice !== null) ? Number(mPrice[1].replace(/,/g, "")) : 0;
    weaponsSellFor.push({
      inputName: mSellFor[1],
      priceText: mSellFor[2],
      price: price
    });
  }
  // Repair
  var reRepair = /onSubmit="[^"]+.*\s*.*\s*.*\s*.*name="([^"]+).*value="([^"]+).*\s*.*\s*.*\s*.*Repair for (.*) Gold/gmi;
  var mRepair;
  var repairWeapons = {};
  while ((mRepair = reRepair.exec(html)) !== null) {
    var repairWeaponId = helpers.quantityFromString(mRepair[1]);
    repairWeapons[repairWeaponId] = {
      inputName: mRepair[1],
      defaultValue: helpers.quantityFromString(mRepair[2]),
      pricePerPoint: helpers.quantityFromString(mRepair[3]),
    };
  }
  // Repair all
  var reRepairAll = /name="([^"]+).*Repair all weapons for (.*) Gold/gmi;
  var mRepairAll = reRepairAll.exec(html);
  var repairAll;
  if (mRepairAll !== null) {
    repairAll = {
      inputName: mRepairAll[1],
      priceText: mRepairAll[2],
      price: helpers.quantityFromString(mRepairAll[2]),
    };
  }
  // Aggregate
  [reCurrentWeapons, reCurrentTools].forEach(function (regex) {
    var i = 0;
    while ((mCurrentWeapons = regex.exec(html)) !== null) {
      var index = mCurrentWeapons.index;
      var category = getCategoryForIndex(index, weaponCategories);
      if (currentWeapons[category] === undefined)
        currentWeapons[category] = [];
      var sell = {};
      var weaponId = -1;
      if (i < weaponsSellFor.length) {
        sell = weaponsSellFor[i];
        weaponId = helpers.quantityFromString(sell.inputName);
      }
      var quantity = helpers.quantityFromString(mCurrentWeapons[2]);
      currentWeapons[category].push({
        name: mCurrentWeapons[1],
        weaponId: weaponId,
        quantity: quantity,
        strength: mCurrentWeapons[3],
        sell: sell,
        repair: repairWeapons[weaponId]
      });
      i++;
    }
  });
  // Get available weapons
  var reBuyWeapons = /<tr>\s*<td>([^<]+)<\/td>\s*<td\s*align="right"\s*>([^<]+)<\/td>\s*<td\s*align="right"\s*>([^<]+)<\/td>\s*<td\s*align="center"\s*>\s*<input\s*type="text"\s*name="([^"]+)"\s*value="([^"])/gmi;
  var mBuyWeapons;
  var buyWeapons = {};
  while ((mBuyWeapons = reBuyWeapons.exec(html)) !== null) {
    var index = mBuyWeapons.index;
    var category = getCategoryForIndex(index, weaponCategories);
    if (buyWeapons[category] === undefined)
      buyWeapons[category] = [];
    buyWeapons[category].push({
      name: mBuyWeapons[1],
      strengthText: mBuyWeapons[2],
      strength: helpers.quantityFromString(mBuyWeapons[2]),
      price: helpers.quantityFromString(mBuyWeapons[3]),
      priceText: mBuyWeapons[3],
      inputName: mBuyWeapons[4],
      inputValue: helpers.quantityFromString(mBuyWeapons[5]),
      weaponId: helpers.quantityFromString(mBuyWeapons[4]),
    });
  }
  // Fortification & Siege
  var reUpgrades = /<td>([^<]+)<\/td>\s*<td\s*align="center">\s*<input.*value="([^"]+)[^>]*>\s*.*\s*.*name="([^"]+)".*value="([^"]+)/gmi;
  var mUpgrades;
  var upgrades = [];
  while ((mUpgrades = reUpgrades.exec(html)) !== null) {
    upgrades.push({
      current: mUpgrades[1],
      next: mUpgrades[2],
      inputName: mUpgrades[3],
      inputValue: mUpgrades[4]
    });
  }
  if (upgrades.length == 2) {
    upgrades = {
      fortification: upgrades[0],
      siegeTechnology: upgrades[1]
    };
  }
  // Military Effectiveness
  var reMilitaryEffectiveness = /<td><b>([^<]+)<\/b><\/td>\s*<td\s*align="right">([^<]+)<\/td>\s*<td\s*align="right">([^<]+)/gmi;
  var mMilitaryEffectiveness;
  var militaryEffectiveness = [];
  while ((mMilitaryEffectiveness = reMilitaryEffectiveness.exec(html)) !== null) {
    militaryEffectiveness.push({
      name: mMilitaryEffectiveness[1],
      value: mMilitaryEffectiveness[2],
      rank: mMilitaryEffectiveness[3]
    });
  }
  var personnel = this.parsePersonnel(html);
  return {
    currentWeapons: currentWeapons,
    buyWeapons: buyWeapons,
    upgrades: upgrades,
    militaryEffectiveness: militaryEffectiveness,
    personnel: personnel,
    repairAll: repairAll,
    turing: this.getTuring(html),
    error: this.parseErrorMessageRed(html),
  };
};

parser.parsePersonnel = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Personnel
  var rePersonnel = /<td.*><b>([^<]+)<\/b><\/td>\s*<td.*>([^<]+)<\/td>\s*<\//gmi;
  var mPersonnel;
  var personnel = {};
  while ((mPersonnel = rePersonnel.exec(html)) !== null) {
    personnel[mPersonnel[1]] = Number(mPersonnel[2]);
  }
  return personnel;
};

parser.parseTraining = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  var personnel = this.parsePersonnel(html);
  var reTrain = /<td>([^<]+)<\/td>\s*<td\s*align="right">([^<]+)<\/td>\s*.*name="([^"]+).*value="([^"]+)/gmi;
  var mTrain;
  var train = [];
  while ((mTrain = reTrain.exec(html)) !== null) {
    train.push({
      trainingProgram: mTrain[1],
      costPerUnitText: mTrain[2],
      costPerUnit: helpers.quantityFromString(mTrain[2]),
      inputName: mTrain[3],
      inputValue: helpers.quantityFromString(mTrain[4]),
    });
  }
  var reUpgrades = [
    /<th colspan=2 align="center">([^<]+)<[A-Za-z<>\s0-9"=\/]+<th\s*class="subh"\s*align="[^"]+"\s*>([^<]+)[A-Za-z<>\s0-9"=\/]+<th\s*class="subh"\s*>([A-Za-z\s<>\/\(\)0-9]+)<\/th>[A-Za-z<>\s0-9"=\/]+<td>([^<]+)[A-Za-z<>\s0-9"=\/]+<input\s*type="submit"\s*value="([^"]+)"[A-Za-z<>\s0-9"=\/]+<input\s*type="hidden"\s*name="([^"]+)"\s*value="([^"]+)/gmi,
    /<th colspan\s*=\s*[0-9"]+ align="center">([^<]+)<[A-Za-z<>\s0-9"=\/]+<th\s*class="subh"\s*align="[^"]+"\s*>([^<]+)[A-Za-z<>\s0-9"=\/]+<th\s*class="subh"\s*>[A-Za-z<>\s0-9"=\/]+<input\s*type="submit"\s*value="([^(]+)\(([^)]+)\)"[A-Za-z<>\s0-9"=\/]+<input\s*type="hidden"\s*name="([^"]+)"\s*value="([^"]+)[A-Za-z<>\s0-9"=\/]+<tr>\s*<td\s*colspan\s*=\s*[^>]+>([^<]+)/gmi,
  ];
  var mUpgrades;
  var upgrades = [];
  reUpgrades.forEach(function (reUpgrade) {
    while ((mUpgrades = reUpgrade.exec(html)) !== null) {
      if (mUpgrades[1].indexOf("Technological") < 0) {
        upgrades.push({
          title: mUpgrades[1],
          currentTitle: mUpgrades[2],
          upgradeName: helpers.stripHtml(mUpgrades[3]).replace(/\s+/g, ' ').trim(),
          currentLevel: mUpgrades[4],
          cost: mUpgrades[5],
          inputName: mUpgrades[6],
          inputValue: mUpgrades[7],
        });
      } else {
        upgrades.push({
          title: mUpgrades[1],
          currentTitle: mUpgrades[2],
          upgradeName: helpers.stripHtml(mUpgrades[3]).replace(/\s+/g, ' ').trim(),
          currentLevel: mUpgrades[7],
          cost: mUpgrades[4],
          inputName: mUpgrades[5],
          inputValue: mUpgrades[6],
        });
      }
    }
  });
  return {
    success: true,
    personnel: personnel,
    train: train,
    upgrades: upgrades,
    message: this.parseErrorMessageRed(html),
    turing: this.getTuring(html),
    // covertSkill: covertSkill,
    // conscription: conscription,
    // economicDevelopment: economicDevelopment,
    // technologicalDevelopment: technologicalDevelopment,
  };
};

parser.parseVerifyEmailError = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  var re = /<h2 style="color: red">([^<]+)/gmi;
  var m = re.exec(html);
  if (m !== null)
    return m[1];
  return "";
};

parser.parseMercenaries = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  var reMercs = /<td>([^<]+)<\/td>\s+<td align="right">([^<]+)<\/td>\s+<td align="right">([^<]+)<\/td>\s+.*name="([^"]+)".*value="([^"]+)/gmi;
  var mMercs;
  var hire = [];
  while ((mMercs = reMercs.exec(html)) !== null) {
    hire.push({
      mercenaryType: mMercs[1],
      costPerUnitText: mMercs[2],
      costPerUnit: helpers.quantityFromString(mMercs[2], 0),
      quantityAvailableText: mMercs[3],
      quantityAvailable: helpers.quantityFromString(mMercs[3], 0),
      inputName: mMercs[4],
      inputValue: helpers.quantityFromString(mMercs[5]),
    });
  }
  return {
    success: true,
    hire: hire,
    personnel: this.parsePersonnel(html),
    message: this.parseErrorMessageRed(html),
    turing: this.getTuring(html),
  };
};

parser.parseRecruit = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Recruiting Preference is always there
  var reRecruitPref = /input\s*type\s*=\s*"radio"\s*name\s*=\s*"([^"]+)"\s*value\s*=\s*"([^"]+)"\s*([^>]*)>([^<]+)/gmi;
  var mRecruitPref;
  var recruitPref = [];
  var recruitPrefName = "clickPref";
  while ((mRecruitPref = reRecruitPref.exec(html)) !== null) {
    recruitPrefName = mRecruitPref[1];
    recruitPref.push({
      name: mRecruitPref[4],
      value: mRecruitPref[2],
      checked: mRecruitPref[3].trim() == 'checked',
    });
  }
  // Hidden fields
  var reHidden = /input\s*type=["']*hidden['"]*\s*name="([^"]+)"\s*value="([^"]+)/gmi;
  var mHiddenFields;
  var hiddenFields = {};
  while ((mHiddenFields = reHidden.exec(html)) !== null) {
    hiddenFields[mHiddenFields[1]] = mHiddenFields[2];
  }
  if (html.indexOf("<h1>Invalid selection...</h1>") >= 0) {
    // Looks like you screwed up!
    var reChallenge = /action="recruit\.php".*\s*<script\s*type="text\/javascript"\s*src="([^"]+)"/gmi;
    var mChallenge = reChallenge.exec(html);
    var challenge_url = mChallenge[1];
    // response field
    var reChallengeFields = /textarea name="([^"]+)".*\s*<input type="hidden" name="([^"]+)/gmi;
    var mChallengeField = reChallengeFields.exec(html);
    var challengeField = mChallengeField === null ? "recaptcha_challenge_field" : mChallengeField[1];
    mChallengeField = reChallengeFields.exec(html);
    var challengeResponseField = mChallengeField === null ? "recaptcha_response_field" : mChallengeField[1];
    return {
      success: false,
      error: "Invalid Selection",
      challenge_url: challenge_url,
      hiddenFields: hiddenFields,
      recruitPreferences: recruitPref,
      recruitPreferencesInputName: recruitPrefName,
      challengeField: challengeField,
      challengeResponseField: challengeResponseField,
    };
  }
  var reRecruitJavascript = /document\.write\(\s*[']*<([^)]+)/gmi;
  var mRecruitJavascript = reRecruitJavascript.exec(html);
  if (mRecruitJavascript === null)
    return {
      success: false,
      error: "Could not parse the javascript to get the image",
    };
  var imageHtml = String(eval("String( '" + mRecruitJavascript[1] + ")"));
  var reRecruitImage = /img\s+src="([^"]+)/gmi;
  var mRecruitImage = reRecruitImage.exec(imageHtml);
  if (mRecruitImage === null)
    return {
      success: false,
      error: "Could not parse the image of the letter to type",
    };
  var image = mRecruitImage[1];
  // Army Morale
  var reMorale = /Your Army's Morale:[^0-9-+]*([0-9-+]+)/gmi;
  var mMorale = reMorale.exec(html);
  var morale = (mMorale !== null) ? mMorale[1] : "???";
  // Field name
  var reFieldName = /type="submit" value="[a-z]" name="([^"]+)/gmi;
  var mFieldName = reFieldName.exec(html);
  var fieldName = mFieldName === null ? "image_click_value" : mFieldName[1];
  return {
    success: true,
    image: image,
    morale: morale,
    hiddenFields: hiddenFields,
    recruitPreferences: recruitPref,
    recruitPreferencesInputName: recruitPrefName,
    fieldName: fieldName
  };
};

parser.parseAttackLog = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  var reOnYou = /<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*><a\s*href="stats\.php\?id=([0-9]+)"\s*>([^<]+)<\/a><\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*><a\s*href="detail\.php\?attack_id=([0-9]+)">([^<]+)<\/a><\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>/gmi;
  var mOnYou;
  var attacksOnYou = [];
  while ((mOnYou = reOnYou.exec(html)) !== null) {
    attacksOnYou.push({
      time: mOnYou[1] + " " + mOnYou[2],
      enemy: {
        userid: mOnYou[3],
        username: mOnYou[4],
      },
      type: mOnYou[5],
      attack_id: mOnYou[6],
      result: mOnYou[7],
      enemyLosses: mOnYou[8],
      yourLosses: mOnYou[9],
      damageByEnemy: mOnYou[10],
      damageByYou: mOnYou[11],
    });
  }
  var reByYou = /<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*><a\s*href="stats\.php\?id=([0-9]+)"\s*>([^<]+)<\/a><\/td>\s*<td.*><a\s*href="detail\.php\?attack_id=([0-9]+)">([^<]+)<\/a><\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>/gmi;
  var mByYou;
  var attacksByYou = [];
  while ((mByYou = reByYou.exec(html)) !== null) {
    attacksByYou.push({
      time: mByYou[1] + " " + mByYou[2],
      enemy: {
        userid: mByYou[3],
        username: mByYou[4],
      },
      attack_id: mByYou[5],
      result: mByYou[6],
      enemyLosses: mByYou[7],
      yourLosses: mByYou[8],
      damageByEnemy: mByYou[9],
      damageByYou: mByYou[10],
    });
  }
  var reTotal = />(.*) attacks total \| page (.*) of ([^<]+)/gmi;
  var attacksOnYouTotal = 0,
    attacksByYouTotal = 0,
    attacksOnYouCurrentPage = 0,
    attacksOnYouMaxPage = 0,
    attacksByYouCurrentPage = 0,
    attacksByYouMaxPage = 0;
  var mTotal = reTotal.exec(html);
  if (mTotal !== null) {
    attacksOnYouTotal = mTotal[1];
    attacksOnYouCurrentPage = mTotal[2];
    attacksOnYouMaxPage = mTotal[3];
    mTotal = reTotal.exec(html);
    if (mTotal !== null) {
      attacksByYouTotal = mTotal[1];
      attacksByYouCurrentPage = mTotal[2];
      attacksByYouMaxPage = mTotal[3];
    }
  }

  // Retrieve the Back / Next pages so front-end doesn't have to compute
  var attacksByYouIndex = html.indexOf('Attacks by You');
  var reBack = /attacklog\.php\?b_start=([0-9]*)&o_start=([0-9]*)">[^ ]+ Back/gmi;
  var reNext = /attacklog\.php\?b_start=([0-9]*)&o_start=([0-9]*)">Next/gmi;
  var mBack, mNext;
  var attacksOnYouBack ={}, attacksOnYouNext = {};
  var attacksByYouBack = {}, attacksByYouNext = {};
  var parameters = {};
  while((mBack = reBack.exec(html)) !== null ){
    parameters = {
      b_start: helpers.quantityFromString(mBack[1], 0),
      o_start: helpers.quantityFromString(mBack[2], 0),
    };
    if(mBack.index < attacksByYouIndex)
      attacksOnYouBack = parameters;
    else
      attacksByYouBack = parameters;
  }
  while((mNext = reNext.exec(html)) !== null ){
    parameters = {
      b_start: helpers.quantityFromString(mNext[1], 0),
      o_start: helpers.quantityFromString(mNext[2], 0),
    };
    if(mNext.index < attacksByYouIndex)
      attacksOnYouNext = parameters;
    else
      attacksByYouNext = parameters;
  }

  return {
    success: true,
    attacksOnYou: {
      attacks: attacksOnYou,
      total: helpers.quantityFromString(attacksOnYouTotal),
      currentPage: helpers.quantityFromString(attacksOnYouCurrentPage),
      maxPage: helpers.quantityFromString(attacksOnYouMaxPage),
      backPage: attacksOnYouBack,
      nextPage: attacksOnYouNext,
    },
    attacksByYou: {
      attacks: attacksByYou,
      total: helpers.quantityFromString(attacksByYouTotal),
      currentPage: helpers.quantityFromString(attacksByYouCurrentPage),
      maxPage: helpers.quantityFromString(attacksByYouMaxPage),
      backPage: attacksByYouBack,
      nextPage: attacksByYouNext,
    },
  };
};

parser.parseIntelligence = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Intercepted
  var reIntercepted = /<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td align="left">(.+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*>([^<]+)<\/td>/gmi;
  var mIntercepted;
  var intercepted = [];
  while ((mIntercepted = reIntercepted.exec(html)) !== null) {
    intercepted.push({
      time: mIntercepted[1] + ' ' + mIntercepted[2],
      enemy: helpers.parseUser(mIntercepted[3]),
      missionType: mIntercepted[4],
      numberOfSpies: mIntercepted[5],
      numberOfSpiesCaught: mIntercepted[6],
    });
  }
  // Pages
  var rePages = />(.*) [operationsfiles]+ total \| page (.+) of ([^<]+)/gmi;
  var interceptedTotal = 0,
    interceptedCurrent = 0,
    interceptedMax = 0,
    filesTotal = 0,
    filesCurrent = 0,
    filesMax = 0;
  var mTotal = rePages.exec(html);
  if (mTotal !== null) {
    interceptedTotal = helpers.quantityFromString(mTotal[1]);
    interceptedCurrent = helpers.quantityFromString(mTotal[2]);
    interceptedMax = helpers.quantityFromString(mTotal[3]);
    mTotal = rePages.exec(html);
    if (mTotal !== null) {
      filesTotal = helpers.quantityFromString(mTotal[1]);
      filesCurrent = helpers.quantityFromString(mTotal[2]);
      filesMax = helpers.quantityFromString(mTotal[3]);
    }
  }
  // Files
  var reFiles = /<td align="left">(.*)<\/td>\s*<td.*>([^<]+)<\/td>\s*<td.*><a\s*href="intelfile\.php\?asset_id=([0-9]+)/gmi;
  var mFiles;
  var files = [];
  while ((mFiles = reFiles.exec(html)) !== null) {
    files.push({
      enemy: helpers.parseUser(mFiles[1]),
      numberOfReports: helpers.quantityFromString(mFiles[2]),
      asset_id: helpers.quantityFromString(mFiles[3]),
    });
  }

  // Retrieve the Back / Next pages so front-end doesn't have to compute
  var attacksByYouIndex = html.indexOf('Attacks by You');
  var reBack = /intel\.php\?b_start=([0-9]*)&o_start=([0-9]*)">[^ ]+ Back/gmi;
  var reNext = /intel\.php\?b_start=([0-9]*)&o_start=([0-9]*)">Next/gmi;
  var mBack, mNext;
  var interceptedBack ={}, interceptedNext = {};
  var filesBack = {}, filesNext = {};
  var parameters = {};
  while((mBack = reBack.exec(html)) !== null ){
    parameters = {
      b_start: helpers.quantityFromString(mBack[1], 0),
      o_start: helpers.quantityFromString(mBack[2], 0),
    };
    if(mBack.index < attacksByYouIndex)
      interceptedBack = parameters;
    else
      filesBack = parameters;
  }
  while((mNext = reNext.exec(html)) !== null ){
    parameters = {
      b_start: helpers.quantityFromString(mNext[1], 0),
      o_start: helpers.quantityFromString(mNext[2], 0),
    };
    if(mNext.index < attacksByYouIndex)
      interceptedNext = parameters;
    else
      filesNext = parameters;
  }

  return {
    success: true,
    intercepted: {
      operations: intercepted,
      total: interceptedTotal,
      currentPage: interceptedCurrent,
      maxPage: interceptedMax,
      backPage: interceptedBack,
      nextPage: interceptedNext,
    },
    files: {
      reports: files,
      total: filesTotal,
      currentPage: filesCurrent,
      maxPage: filesMax,
      backPage: filesBack,
      nextPage: filesNext,
    }
  };
};

parser.parseBattleReport = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  var re = /<td class="report"[^>]*>([a-zA-Z<>':0-9\/=",.!-?\s]+)<\/td>/gmi;
  var m = re.exec(html);
  if (m === null) {
    return {
      success: false,
      error: "Unable to parse the battle report",
      details: html,
    };
  }
  return {
    success: true,
    report: m[1].trim(),
  };
};

/**
 * Parse the intelligence log of a particular user, listing all the intel reports
 * @param {String} html
 * @returns {Object} an object with success, reports, currentPage, maxPage and total
 */
parser.parseIntelFile = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };

  // Details
  var re = /<td align="right">([^<]+)<\/td>\s*<td align="left">([^<]+)<\/td>\s*<td align="right">([^<]+)<\/td>\s*<td align="right">([^<]+)<\/td>\s*<td align="center">.*inteldetail\.php\?report_id=([0-9]+)">([^<]+)/gmi;
  var m;
  var reports = [];
  while ((m = re.exec(html)) !== null) {
    reports.push({
      time: m[1] + " " + m[2],
      missionType: m[3],
      numberOfSpies: helpers.quantityFromString(m[4]),
      reportId: m[5],
      result: m[6],
    });
  }

  if (reports.length) {

    // Pages
    var rePages = />([^ ]+) reports total \| page ([^ ]+) of ([^<]+)/gmi;
    m = rePages.exec(html);
    var currentPage = 0, maxPage = 0, total = 0;
    if (m !== null) {
      total = helpers.quantityFromString(m[1]);
      currentPage = helpers.quantityFromString(m[2]);
      maxPage = helpers.quantityFromString(m[3]);
    }

    return {
      success: true,
      reports: reports,
      currentPage: currentPage,
      maxPage: maxPage,
      total: total,
    };
  }
  else {
    return {
      success: false,
      error: parser.parseErrorMessage(html),
    };
  }
};

// Parse Intel Details
parser.parseIntelDetail = function (html) {
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };

  // Story
  var storyHeader = "Covert Mission Report";
  var storyStart = html.indexOf( storyHeader ) + storyHeader.length;
  var storyEnd = html.indexOf( "<br>", storyStart );
  var story = helpers.stripHtml(html.substr(storyStart, storyEnd-storyStart)).trim();

  //Military Stats
  var reMilitaryStats = /<td>([ a-zA-Z0-9,:]+)<\/td>\s*<td align="right">([ a-zA-Z0-9,?]+)<\/td>\s*<\/tr>/gmi;
  var mMilitaryStats;
  var militaryStats = [];
  while ((mMilitaryStats = reMilitaryStats.exec(html)) !== null)
    militaryStats.push({
      name: mMilitaryStats[1],
      valueAsText: mMilitaryStats[2],
      value: helpers.quantityFromString(mMilitaryStats[2]),
    });

  // Treasury
  var reTreasury = /Treasury<\/th>\s*<\/tr>\s*<tr>\s*<td align="center">([ a-zA-Z0-9,?]+)<\/td>/gmi;
  var mTreasury = reTreasury.exec(html);
  var treasuryText = (mTreasury === null) ? '???' : mTreasury[1];
  var treasury = helpers.quantityFromString(treasuryText);

  // Army Size & Weapons
  var reWeapons = /<td>([^<]+)<\/td>\s*<td[^>]+>([^<]+)<\/td>\s*<td[^>]+>([^<]+)<\/td>\s*<td[^>]+>([^<]+)<\/td>/gmi;
  var mWeapons;
  var weapons = [];
  var armySize = {};
  while((mWeapons=reWeapons.exec(html))!==null){
    if(mWeapons[1]=='Mercenaries')
      armySize.mercenaries = {
        attack: helpers.quantityFromString(mWeapons[2]),
        defense: helpers.quantityFromString(mWeapons[3]),
        untrained: helpers.quantityFromString(mWeapons[4]),
      };
    else if(mWeapons[1]=='Soldiers')
      armySize.soldiers = {
        attack: helpers.quantityFromString(mWeapons[2]),
        defense: helpers.quantityFromString(mWeapons[3]),
        untrained: helpers.quantityFromString(mWeapons[4]),
      };
    else
      weapons.push({
        name: mWeapons[1],
        type: mWeapons[2],
        quantityText: mWeapons[3],
        quantity: helpers.quantityFromString(mWeapons[3]),
        strength: mWeapons[4],
      });
  }

  return {
    story: story,
    army: armySize,
    stats: militaryStats,
    treasuryText: treasuryText,
    treasury: treasury,
    weapons: weapons,
    success: mTreasury !== null,
  };
};

module.exports = parser;