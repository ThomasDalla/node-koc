// Various helpers for non KoC specific stuff
// =============================================================================

var helpers = {};

/**
 * Simple e-mail validation with RegEx
 * @param {Text} email E-Mail address to validate
 * @return {Boolean} whether or not this is a valid e-mail address
 */
helpers.validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
   return html.replace(/<(?:.|\n)*?>/gm, '');
};

// Tries to parse a number (comma separated)
// If fails, just return the original string
// Or a defaultValue if specified
helpers.quantityFromString = function( quantityStr, defaultValue ) {
  var reQty = /([0-9,.]+)/;
  var mQty  = reQty.exec(quantityStr);
  if(defaultValue===undefined)
  	defaultValue = quantityStr;
  var quantity = mQty!==null ? Number( mQty[1].replace(/,/g,'') ) : defaultValue;
  return quantity;
};

module.exports = helpers;