/** @exports helpers
 * Various helpers for non KoC specific stuff */
var helpers = {};

/**
 * Simple e-mail validation with RegEx
 * @param {String} email E-Mail address to validate
 * @return {Boolean} whether or not this is a valid e-mail address
 */
helpers.validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

helpers.createTrRegExp = function(header, content) {
	return "<tr>\\s*<td>\\s*<b>" + header + "<\\/b>\\s*<\\/td>\\s*<td>\\s*" + content + "\\s*<\\/td>\\s*<\\/tr>";
};

helpers.createTrTripleTdRegExp = function(header, content1, content2) {
	return "<tr>\\s*<td([^<]*)>\\s*" + header + "\\s*<\\/td>\\s*<td([^<]*)>\\s*" + content1 + "\\s*<\\/td>\\s*<td([^<]*)>\\s*" + content2 + "\\s*<\\/td>\\s*<\\/tr>";
};

helpers.createTableRegExp = function(keyPairValues) {
	var l = keyPairValues.length;
	var keyPairValuesRegExp = [];
	for (var i=0; i<l; i++) {
		keyPairValuesRegExp[i] = this.createTrRegExp(keyPairValues[i].Key, keyPairValues[i].Value);
	}
	return keyPairValuesRegExp.join("\\s*");
};

helpers.createTableTripleTdRegExp = function(keyPairValues) {
	var l = keyPairValues.length;
	var keyPairValuesRegExp = [];
	for (var i=0; i<l; i++) {
		keyPairValuesRegExp[i] = this.createTrTripleTdRegExp(keyPairValues[i].Key, keyPairValues[i].Value1, keyPairValues[i].Value2);
	}
	return keyPairValuesRegExp.join("\\s*");
};

helpers.stripHtml = function(html) {
   return html.replace(/<(?:.|\n)*?>/gm, '').trim();
};

// Tries to parse a number (comma separated)
// If fails, just return the original string
// Or a defaultValue if specified
helpers.quantityFromString = function( quantityStr, defaultValue ) {
  var reQty = /([\+\-]*)([0-9,.M]+)/;
  var mQty  = reQty.exec(quantityStr);
  if(defaultValue===undefined)
  	defaultValue = quantityStr;
	return mQty !== null ? Number(mQty[0].replace(/,/g, '').replace(/M/g, '000000')) : defaultValue;
};

// Tries to parse a user link on form:
//    <a href="stats.php?id=4503936">AndyRock</a>
// returning:
//  {
//    username: AndyRock
//    userid: 4503936
//  }
// or returns the input if such link is not found, nested under 'username':
//  {
//    username: html
//  }
helpers.parseUser = function(html) {
  var reStatsLink = /stats\.php\?id=([0-9]+)">([^<]+)/;
  var mEnemy = reStatsLink.exec(html);
  var user;
  if(mEnemy!==null) {
    user = {
      username: mEnemy[2],
      userid: this.quantityFromString(mEnemy[1]),
    };
  }
  else {
    user = {
      username: helpers.stripHtml(html),
      // no userid (probably inactive)
    };
  }
  return user;
};

helpers.parseBuddyStatus = function(html) {
	var reBuddyStatus = /<img class="buddy_type".*alt="([^"]+)".*src="([^"]+)">/;
	var mBuddyStatus = reBuddyStatus.exec(html);
	if(mBuddyStatus!==null) {
		return {
			status: mBuddyStatus[1],
			image: mBuddyStatus[2],
		};
	}
	return {};
};

helpers.parseIntelFile = function(html){
	var reReconFile = /<a href="\/intelfile\.php\?asset_id=([0-9]+)"><img alt="([^"]+)".*src="([^"]+)/;
	var mReconFile = reReconFile.exec(html);
	if(mReconFile!==null) {
		return {
			assetId: mReconFile[1],
			title: mReconFile[2],
			image: mReconFile[3],
		};
	}
	return {};
};

module.exports = helpers;