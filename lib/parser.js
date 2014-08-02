// KoC Parser - To parse HTML page into a JS Object
// -----------------------------------------------------------------------------

var helpers = require('./helpers');
var parser = {};

/**
 * Get the error message from a KoC error.php page
 * @param {Text} the HTML page to parse the error from
 * @return {Text} the error message, if found, "Unknown Error" otherwise
 */
parser.parseErrorMessage = function( html ) {
    var re = /<h3>Error<\/h3>([^<]+)</gmi;
    var m  = re.exec( html );
    if( m !== null) {
        return m[1].trim();
    }
    return "Unknown Error";
};

/**
 * Get the reason for being banned from a KoC bansuspend.php page
 * @param {Text} the HTML page to parse the error from
 * @return {Text} the reason, if found, "Unknown Reason" otherwise
 */
parser.parseBannedMessage = function( html ) {
    var re = /Banned<\/[^>]*>\s*([^<]+)/gmi;
    var m  = re.exec( html );
    if( m !== null) {
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
            alliance : m[1],
            userid   : m[2],
            username : m[3],
            armySize : m[4],
            race     : m[5],
            gold     : m[6],
            rank     : m[7]
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
    	var reUserInfo = new RegExp(helpers.createTableRegExp([
    	{
    		Key: "Name",
    		Value:'<a href="stats\\.php\\?id=([0-9]+)">([^<]+)<\\/a>' // 1, 2
    	},{
    		Key: "Race",
    		Value:'([^<]+)' // 3
    	},{
    		Key: "Rank",
    		Value:'([^<]+)' // 4
    	},{
    		Key: "Highest Rank",
    		Value:'([^<]+)' // 5
    	},{
    		Key: "Commander",
    		Value:'([^<]+)' // 5
    	}]), 'gm');
    	var matches = reUserInfo.exec(baseHtml);
    	var reMilitary = new RegExp(helpers.createTableRegExp([
    	{
    		Key: "Fortification",
    		Value:'([^<]+)' // 1
    	},{
    		Key: "Siege Technology",
    		Value:'([^<]+)' // 2
    	},{
    		Key: "Economy",
    		Value:'([^<]+)' // 3
    	},{
    		Key: "Technology",
    		Value:'([^<]+)' // 4
    	},{
    		Key: "Conscription",
    		Value:'([^<]+)' // 5
    	},{
    		Key: "Available Funds",
    		Value:'([^<]+)' // 6
    	},{
    		Key: "Projected Income",
    		Value:'([^<]+)' // 7
    	},{
    		Key: "Game Turns",
    		Value:'([^<]+)' // 8
    	},{
    		Key: "Covert Level",
    		Value:'([^<]+)' // 9
    	}]), 'gm');
    	var matchesMilitary = reMilitary.exec(baseHtml);
    	var reMilitaryEffectiveness = new RegExp(helpers.createTableTripleTdRegExp([
    	{
    		Key: "<b>Strike Action<\\/b>",
    		Value1:'([^<]+)', // 3
    		Value2:'([^<]+)' // 5
    	},{
    		Key: "<b>Defensive Action<\\/b>",
    		Value1:'([^<]+)', // 8
    		Value2:'([^<]+)' // 10
    	},{
    		Key: "<b>Spy Rating<\\/b>",
    		Value1:'([^<]+)', // 13
    		Value2:'([^<]+)' // 15
    	},{
    		Key: "<b>Sentry Rating<\\/b>",
    		Value1:'([^<]+)', // 18
    		Value2:'([^<]+)' // 20
    	}]), 'gm');
    	var matchesMilitaryEffectiveness = reMilitaryEffectiveness.exec(baseHtml);
    	var rePreviousLogins = new RegExp(helpers.createTableTripleTdRegExp([
    	{
    		Key: "([0-9.]+)", // 2
    		Value1:'([^<]+)', // 4
    		Value2:'([^<]+)' // 6
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
    	var rePersonnel = new RegExp(helpers.createTableTripleTdRegExp([
    	{
    		Key: "<b>Trained Attack Soldiers<\\/b>",
    		Value1:'([^<]+)', // 3
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Trained Attack Mercenaries<\\/b>",
    		Value1:'([^<]+)', // 11
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Trained Defense Soldiers<\\/b>",
    		Value1:'([^<]+)', // 19
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Trained Defense Mercenaries<\\/b>",
    		Value1:'([^<]+)', // 27
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Untrained Soldiers<\\/b>",
    		Value1:'([^<]+)', // 35
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Untrained Mercenaries<\\/b>",
    		Value1:'([^<]+)', // 43
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Spies<\\/b>",
    		Value1:'([^<]+)', // 51
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Sentries<\\/b>",
    		Value1:'([^<]+)', // 59
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Army Morale<\\/b>",
    		Value1:'([^<]+)', // 67
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	},{
    		Key: "<b>Total Fighting Force<\\/b>",
    		Value1:'([^<]+)', // 75
    		Value2:'([^<]+)<a([^>]+)>([^<]+)<\\/a>([^<]+)'
    	}]), 'gm');
    	var matchesPersonnel = rePersonnel.exec(baseHtml);
    	this.username = matches[2];
    	return {
    	    success: true,
    		userInfo: {
    			userid: matches[1],
    			username: matches[2],
    			race: matches[3].trim(),
    			rank: matches[4],
    			highestRank: matches[5],
    			commander: helpers.stripHtml(matches[6])
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
    			strikeAction : matchesMilitaryEffectiveness[3],
    			strikeActionRank : matchesMilitaryEffectiveness[5].replace(/Ranked #/gm,''),
    			defensiveAction : matchesMilitaryEffectiveness[8],
    			defensiveActionRank : matchesMilitaryEffectiveness[10].replace(/Ranked #/gm,''),
    			spyRating : matchesMilitaryEffectiveness[13],
    			spyRatingRank : matchesMilitaryEffectiveness[15].replace(/Ranked #/gm,''),
    			sentryRating : matchesMilitaryEffectiveness[18],
    			sentryRatingRank : matchesMilitaryEffectiveness[20].replace(/Ranked #/gm,'')
    		},
    		personnel: {
    			trainedAttackSoldiers: matchesPersonnel[3],
    			trainedAttackMercenaries: matchesPersonnel[11],
    			trainedDefenseSoldiers: matchesPersonnel[19],
    			trainedDefenseMercenaries: matchesPersonnel[27],
    			untrainedSoliders: matchesPersonnel[35],
    			untrainedMercenaries: matchesPersonnel[43],
    			spies: matchesPersonnel[51],
    			sentries: matchesPersonnel[59],
    			armyMorale: matchesPersonnel[67],
    			totalFightingForce: matchesPersonnel[75]
    		},
    		previousLogins: previousLogins
    	};
	}
	catch(e) {
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
    if( html === undefined || html === null || !html.length )
        return result;

    // Username and Fortification
    var re = /<title>Kings\s*of\s*Chaos\s*::\s*([^'<,]+)[^ ]*\s*([^<]+)/gmi;
    var m  = re.exec(html);
    result.username      = (m!==null) ? m[1] : "???";
    result.fortification = (m!==null) ? m[2] : "???";

    // Gold
    re.compile(/Gold:[^>]+>\s*([^\n<]+)/gmi);
    m  = re.exec(html);
    result.gold = (m!==null) ? m[1] : "???";
    result.success = m!==null;

    // Experience
    re.compile(/Experience:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
    m = re.exec(html);
    result.experience = (m!==null) ? m[1] : "???";

    // Turns
    re.compile(/Turns:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
    m = re.exec(html);
    result.turns = (m!==null) ? m[1] : "???";

    // Rank
    re.compile(/Rank:\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*([^\n<]+)/gmi);
    m = re.exec(html);
    result.rank = (m!==null) ? m[1] : "???";

    // Last Attacked
    re.compile(/Last Attacked:\s*<[^>]+>\s*<[^>]+>([^\n<]+)/gmi);
    m = re.exec(html);
    result.lastAttacked = (m!==null) ? m[1] : "???";

    // Mails
    re.compile(/Mail:\s*<a\s*href="[^"]*"\s*style="font-size:\s*[^;]*;\s*color:\s*([^;]+);">([^\n<]+)/gmi);
    m = re.exec(html);
    result.mails    = (m!==null)                ? m[2] : "???";
    result.newMails = (m!==null && m[1]=="RED") ? true : false;

    return result;
};

/**
 * Get available races information
 * @param {Text} html HTML content of the page to parse
 */
parser.parseRacesInfo = function(html) {
    var result = {};
    if( html === undefined || html === null || !html.length )
        return result;

    // Background colours
    var re = /<th\s*class="([^"]+)"\s*style="background-color:\s*([^;]+);\s*border:\s*([^ ]+)\s*[^;]*;">/gmi;
    var m;
    var colours = {};
    while((m=re.exec(html))!==null) {
        colours[m[1]] = {
            background: m[2],
            border    : m[3]
        };
    }

    // Colours
    re.compile(/style="color:([^"]+)" value="Join ([^!]+)!/gmi);
    while((m=re.exec(html))!==null) {
        if(colours[m[2]]===undefined)
            colours[m[2]] = {};
        colours[m[2]].text = m[1];
    }

    // Images
    re.compile(/<td\s*class="([^"]+)"\s*align="[^"]+">\s*<img\s*src="([^"]+)"/gmi);
    var images = {};
    while((m=re.exec(html))!==null) {
        images[m[1]] = /*this.getKoCHost() +*/ m[2];
    }

    // Features
    re.compile(/<td\s*class="([^"]+)"[^>]*>([^:]+):<br \/>\s*<b>([^<]+)<\/b>\s*<br \/>\s*<b>\s*([^<]+)/gmi);
    var races = [];
    while((m = re.exec(html))!==null) {
        races.push({
            race       : m[1],
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
    if( html === undefined || html === null || !html.length )
        return '';
    var re = /New\s*User\s*Advisor<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*<[^>]*>\s*/gmi;
    var m  = re.exec(html);
    if(m===null) return '';
    var startIndex = re.lastIndex;
    re = /<\/td>/gmi;
    re.lastIndex = startIndex;
    m = re.exec(html);
    if(m===null) return '';
    var endIndex       = m.index;
    var rawResult      = html.substring(startIndex, endIndex);
    var strippedResult = helpers.stripHtml(rawResult);
    var finalResult    = strippedResult.replace(/\s+/gmi, " ");
    return finalResult;
};

/**
 * Guess the age from the HTML on the page
 * @param {Text} html HTML content of the page to parse
 * @return {Number} KoC Age
 */
parser.guessAge = function(html) {
    if( html === undefined || html === null || !html.length )
        return 0;
    var re = /age([0-9]+)\./gmi;
    var m  = re.exec(html);
    if( m === null ) return -1;
    return Number(m[1]);
};

/**
 * Parse the menu on the left side
 * @param {Text} html HTML content of the page to parse
 * @return {Array} all the items in the menu (containing page, image and title)
 */
parser.parseMenu = function(html) {
    var result = [];
    if( html === undefined || html === null || !html.length )
        return result;
    var re = /<a.*href="([^"]+)">.*<img.*alt="([^"]+)".*src="([^"]+)"[^>]*.*width="137".*>/gmi;
    var m;
    while((m=re.exec(html))!==null) {
        result.push({
            page : m[1],
            title: m[2],
            image: m[3]
        });
    }
    return result;
};

module.exports = parser;