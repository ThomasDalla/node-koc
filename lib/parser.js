// KoC Parser - To parse HTML page into a JS Object
// -----------------------------------------------------------------------------

var helpers = require('./helpers');
var parser = {};

/**
 * Parse and return the turing from given HTML content
 * @param {Text} HTML content to be parsed
 * @return {Text} Turing, if found, empty if not
 */
parser.getTuring = function(html) {
  var re = /name="turing"\s*value="([^"]+)">/gmi;
  var m = re.exec(html);
  if (m !== null)
    return m[1];
  return "";
};

/**
 * Get the error message from a KoC error.php page
 * @param {Text} the HTML page to parse the error from
 * @return {Text} the error message, if found, "Unknown Error" otherwise
 */
parser.parseErrorMessage = function(html) {
  var re = /<h3>Error<\/h3>([^<]+)</gmi;
  var m = re.exec(html);
  if (m !== null) {
    return m[1].trim();
  }
  return "Unknown Error";
};

/**
 * Get the reason for being banned from a KoC bansuspend.php page
 * @param {Text} the HTML page to parse the error from
 * @return {Text} the reason, if found, "Unknown Reason" otherwise
 */
parser.parseBannedMessage = function(html) {
  var re = /Banned<\/[^>]*>\s*([^<]+)/gmi;
  var m = re.exec(html);
  if (m !== null) {
    return m[1].trim();
  }
  return "Unknown Reason";
};

/**
 * Parses a battlefield page in HTML format and returns an array of players
 * @param {Text} html the content of the HTML page to parse
 * @return {Array} an array of the players information found on that page
 */
parser.parseBattlefield = function(html) {
  var re = /<a href="alliances\.php\?id=([^"]*)">[^<]*<\/a><\/td>\s*<td><a class="player" href="\/stats\.php\?id=([0-9]+)"\s*>([^<]+)<\/a><\/td>[^>]*>([0-9,]+)<\/td>[^>]*>\s*([A-Za-z0-9-_]+)\s*<\/td>[^>]*>([^G]+)Gold<\/td>[^>]*>([^<]+)<\/td>/gmi;
  var players = [];
  var m;
  while ((m = re.exec(html)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    var player = {
      alliance: m[1],
      userid: m[2],
      username: m[3],
      armySize: m[4],
      race: m[5],
      gold: m[6],
      rank: m[7]
    };
    players.push(player);
  }
  return players;
};

/**
 * Get user info from the base HTML page
 * @param {Text} baseHtml HTML content of the Base page
 * @return {Object} an object containing user information
 */
parser.parseBase = function(baseHtml) {
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
    this.username = matches[2];
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
 * @param {Text} html the HTML content of the page to parse
 * @return {Object} an object containing gold, experience, turns, rank,
 *                  lastAttacked, mails and newMails if found
 */
parser.parseLeftSideBox = function(html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return result;

  // Username and Fortification
  var re = /\<title\>Kings\s*of\s*Chaos\s*::\s*([^'\<,]+)[^ ]*\s*([^\<]+)\<\/title\>/gmi;
  var m = re.exec(html);
  result.username = (m !== null) ? m[1] : "???";
  result.fortification = (m !== null) ? m[2] : "???";

  // Gold
  re.compile(/Gold:[^>]+>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.gold = (m !== null) ? m[1] : "???";
  result.success = m !== null;

  // Experience
  re.compile(/Experience:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
  m = re.exec(html);
  result.experience = (m !== null) ? m[1] : "???";

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
  result.newMails = (m !== null && m[1] == "RED") ? true : false;

  return result;
};

/**
 * Get available races information
 * @param {Text} html HTML content of the page to parse
 */
parser.parseRacesInfo = function(html) {
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
 * @param {Text} html HTML content of the page to parse
 */
parser.parseNewUserAdvisor = function(html) {
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
  var finalResult = strippedResult.replace(/\s+/gmi, " ");
  return finalResult;
};

/**
 * Guess the age from the HTML on the page
 * @param {Text} html HTML content of the page to parse
 * @return {Number} KoC Age
 */
parser.guessAge = function(html) {
  if (html === undefined || html === null || !html.length)
    return 0;
  var re = /age([0-9]+)\./gmi;
  var m = re.exec(html);
  if (m === null) return -1;
  return Number(m[1]);
};

/**
 * Parse the menu on the left side
 * @param {Text} html HTML content of the page to parse
 * @return {Array} all the items in the menu (containing page, image and title)
 */
parser.parseMenu = function(html) {
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
parser.parseCommanderChange = function(html) {
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
 * @param {Text} html the HTML page to parse
 */
parser.parseForgotPass = function(html) {
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

parser.parseOfficers = function(html) {

};

parser.parseFullStats = function(html) {
  var result = {};
  if (html === undefined || html === null || !html.length)
    return {
      success: false,
      error: "Empty page to parse"
    };
  // Main User Stats
  var reUserStats = /Name:[\s\<tdrbpa\>\/\\]*\<td\>\s*([^\s]+)\s*\<\/td\>[\s\<tdrbpa\>\/\\]*Commander:\s*\<\/b\>\s*\<\/td\>\s*\<td[^\>]*\>\s*(.*)\s*\<\/td\>[\s\<tdrbpa\>\/\\]*Alliances:\s*\<\/b\>\s*\<\/td\>\s*\<td\>\s*(.*)\s*\<\/td\>[\s\<tdrbpa\>\/\\]*Race:[\s\<tdrbpa\>\/\\]*\<td\>\s*([^\<\s]+)[\s\<tdrbpa\>\/\\]*Rank:[\s\<tdrbpa\>\/\\]*\<td\>([^\<\s]+)[\s\<tdrbpa\>\/\\]*Highest Rank:[\s\<tdrbpa\>\/\\]*([^\<]+)[\s\<tdrbpa\>\/\\]*Army\s*Size:[\s\<tdrbpa\>\/\\]*([^\<\s]+)[\s\<tdrbpa\>\/\\]*Army Morale:[\s\<tdrbpa\>\/\\]*([^\<\s]+)/gmi;
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
  var gold = (mGold !== null) ? mGold[1] : "???";
  // Fortification / Buddy Status
  var reFortBuddy = /[\s\<tdrbpa\>\/\\]*Fortifications\s*:[\s\<tdrbpa\>\/\\]*\>\s*([\s\<0-9a-z=\>\/\\]+)\s*\<\/td\>[\s\<a-z=\>\/\\"0-9]*Buddy\s*List\s*Status\s*:[\s\<a-z=\>\/\\"]*\>\s*([\s\<0-9a-z=\>\/\\]+)\s*\<\/td\>/gmi;
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
  var reOfficers = /<a href="stats\.php\?id=(\d+)"\s*\>\s*([^<]+)\s*<\/a>\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/gmi;
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
  var reTotalOfficers = /\>(.*) officers total/gmi;
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
    alliances: alliances,
    primaryAlliance: primaryAlliance,
    officers: officers,
    totalOfficersNb: Number(totalOfficersNb)
  };
  return result;
};

parser.parseArmory = function(html) {
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
  var reCurrentWeapons = /\>([^\<]+)\<\/td\>\s*\<td\s*align="right"\>([^\<]+)\<\/td\>\s*\<td\s*align="[rightcenter]+"\s*\>([^\<]+)\<\/td\>\s*\<td\s*align="center"\s*\>\s*\<ta/gmi;
  var reCurrentTools = /\>([^\<]+)\<\/td\>\s*\<td\s*align="right"\>([^\<]+)\<\/td\>\s*\<td\s*align="[rightcenter]+"\s*\>([^\<]+)\<\/td\>\s*\<form/gmi;
  var currentWeapons = {};
  var mCurrentWeapons;
  var getCategoryForIndex = function(index, categories) {
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
    var mPrice  = rePrice.exec(mSellFor[2]);
    var price = (mPrice!==null) ? Number(mPrice[1].replace(/,/g,"")) : 0;
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
  while((mRepair=reRepair.exec(html))!==null){
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
  if(mRepairAll !== null) {
    repairAll = {
      inputName: mRepairAll[1],
      price: helpers.quantityFromString(mRepairAll[2]),
    };
  }
  // Aggregate
  [reCurrentWeapons,reCurrentTools].forEach(function(regex){
    var i = 0;
    while ((mCurrentWeapons = regex.exec(html)) !== null) {
      var index = mCurrentWeapons.index;
      var category = getCategoryForIndex(index, weaponCategories);
      if (currentWeapons[category] === undefined)
        currentWeapons[category] = [];
      var sell = {};
      var weaponId = -1;
      if(i < weaponsSellFor.length) {
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
  // TODO: Repair
  // Get available weapons
  var reBuyWeapons = /<tr>\s*<td>([^<]+)\<\/td\>\s*\<td\s*align="right"\s*\>([^<]+)\<\/td\>\s*\<td\s*align="right"\s*\>([^<]+)\<\/td\>\s*\<td\s*align="center"\s*\>\s*\<input\s*type="text"\s*name="([^"]+)"\s*value="([^"])/gmi;
  var mBuyWeapons;
  var buyWeapons = {};
  while( (mBuyWeapons = reBuyWeapons.exec(html)) !== null) {
    var index = mBuyWeapons.index;
    var category = getCategoryForIndex(index, weaponCategories);
    if(buyWeapons[category]===undefined)
      buyWeapons[category] = [];
    buyWeapons[category].push({
      name: mBuyWeapons[1],
      strength: mBuyWeapons[2],
      price: mBuyWeapons[3],
      inputName: mBuyWeapons[4],
      inputValue: mBuyWeapons[5]
    });
  }
  // Fortification & Siege
  var reUpgrades = /\<td\>([^\<]+)\<\/td\>\s*\<td\s*align="center"\>\s*\<input.*value="([^"]+)[^>]*\>\s*.*\s*.*name="([^"]+)".*value="([^"]+)/gmi;
  var mUpgrades;
  var upgrades = [];
  while((mUpgrades = reUpgrades.exec(html)) !== null) {
    upgrades.push({
      current: mUpgrades[1],
      next: mUpgrades[2],
      inputName: mUpgrades[3],
      inputValue: mUpgrades[4]
    });
  }
  if(upgrades.length==2) {
    upgrades = {
      fortification: upgrades[0],
      siegeTechnology: upgrades[1]
    };
  }
  // Military Effectiveness
  var reMilitaryEffectiveness = /\<td\>\<b\>([^\<]+)\<\/b\>\<\/td>\s*<td\s*align="right">([^\<]+)\<\/td\>\s*\<td\s*align="right"\>([^\<]+)/gmi;
  var mMilitaryEffectiveness;
  var militaryEffectiveness = [];
  while((mMilitaryEffectiveness=reMilitaryEffectiveness.exec(html))!==null) {
    militaryEffectiveness.push({
      name: mMilitaryEffectiveness[1],
      value: mMilitaryEffectiveness[2],
      rank: mMilitaryEffectiveness[3]
    });
  }
  // Personnel
  var rePersonnel = /\<td.*\>\<b\>([^\<]+)\<\/b\>\<\/td\>\s*\<td.*\>([^\<]+)\<\/td\>\s*\<\//gmi;
  var mPersonnel;
  var personnel = {};
  while((mPersonnel=rePersonnel.exec(html))!==null){
    personnel[mPersonnel[1]] = Number(mPersonnel[2]);
  }
  return {
    currentWeapons: currentWeapons,
    buyWeapons: buyWeapons,
    upgrades: upgrades,
    militaryEffectiveness: militaryEffectiveness,
    personnel: personnel,
    repairAll: repairAll
  };
};

module.exports = parser;