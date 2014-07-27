// Libs
var Q       = require('q');
var request = Q.denodeify(require('request'));
var util    = require("util");

// Our Lib
var koc = function(session) {
    this.session                 = session;
    this.koc_session_cookie_name = "koc_session";
    this.koc_host                = "http://www.kingsofchaos.com";
    this.koc_recaptcha_url       = "http://www.google.com/recaptcha/api/challenge?k=6LcvaQQAAAAAACnjh5psIedbdyYzGDb0COW82ruo";
    this.recaptcha_image_format  = "%simage?c=%s"; // path to the ReCaptcha image from (server, challenge)
    this.location                = "";
};

// Helpers (outside the lib)
// =============================================================================

/**
 * Simple e-mail validation with RegEx
 * @param {Text} email E-Mail address to validate
 * @return {Boolean} whether or not this is a valid e-mail address
 */
var validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

/**
 * Parse and return the turing from given HTML content
 * @param {Text} HTML content to be parsed
 * @return {Text} Turing, if found, empty if not
 */
var getTuring = function(html) {
    var re = /name="turing"\s*value="([^"]+)">/gmi;
    var m  = re.exec(html);
    if(m!==null)
        return m[1];
    return "";
};

/**
 * Get the error message from a KoC error.php page
 * @param {Text} the HTML page to parse the error from
 * @return {Text} the error message, if found, "Unknown Error" if not
 */
var getErrorMessage = function( html ) {
    var re = /<h3>Error<\/h3>([^<]+)</gmi;
    var m  = re.exec( html );
    if( m !== null) {
        return m[1].trim();
    }
    return "Unknown Error";
};

var createTrRegExp = function(header, content) {
	return "<tr>\\s*<td>\\s*<b>" + header + "<\\/b>\\s*<\\/td>\\s*<td>\\s*" + content + "\\s*<\\/td>\\s*<\\/tr>";
};

var createTrTripleTdRegExp = function(header, content1, content2) {
	return "<tr>\\s*<td([^<]*)>\\s*" + header + "\\s*<\\/td>\\s*<td([^<]*)>\\s*" + content1 + "\\s*<\\/td>\\s*<td([^<]*)>\\s*" + content2 + "\\s*<\\/td>\\s*<\\/tr>";
};

var createTableRegExp = function(keyPairValues) {
	var l = keyPairValues.length;
	var keyPairValuesRegExp = [];
	for (var i=0; i<l; i++) {
		keyPairValuesRegExp[i] = createTrRegExp(keyPairValues[i].Key, keyPairValues[i].Value);
	}
	return keyPairValuesRegExp.join("\\s*");
};

var createTableTripleTdRegExp = function(keyPairValues) {
	var l = keyPairValues.length;
	var keyPairValuesRegExp = [];
	for (var i=0; i<l; i++) {
		keyPairValuesRegExp[i] = createTrTripleTdRegExp(keyPairValues[i].Key, keyPairValues[i].Value1, keyPairValues[i].Value2);
	}
	return keyPairValuesRegExp.join("\\s*");
};

var stripHtml = function(html) {
   return html.replace(/<(?:.|\n)*?>/gm, '');
};

// Our lib
// =============================================================================

// Getters / Setters
// -----------------------------------------------------------------------------

/**
 * Set the name of the cookie that KoC uses to store the session id
 * @param {Text} new cookie name
 */
koc.prototype.setKoCSessionCookieName = function( new_cookie_name ) {
    if( new_cookie_name !== undefined && new_cookie_name.length )
        this.koc_session_cookie_name = new_cookie_name;
};

/**
 * Get the name of the cookie that KoC uses to store the session id
 * @return {Text} the cookie name
 */
koc.prototype.getKoCSessionCookieName = function() {
    return this.koc_session_cookie_name;
};

/**
 * Set the base URL of KoC website
 * @param {Text} new KoC URL
 */
koc.prototype.setKoCHost = function( new_koc_host ) {
    if( new_koc_host !== undefined && new_koc_host.length )
        this.koc_host = new_koc_host;
};

/**
 * Get the base URL of KoC website
 * @return {Text} KoC URL
 */
koc.prototype.getKoCHost = function() {
    return this.koc_host;
};

/**
 * Set the URL of the Javascript to get a new challenge for KoC
 * @param {Text} new captcha url
 */
koc.prototype.setKoCReCaptchaUrl = function( new_koc_recaptcha_url ) {
    if( new_koc_recaptcha_url !== undefined && new_koc_recaptcha_url.length )
        this.koc_recaptcha_url = new_koc_recaptcha_url;
};

/**
 * Get the URL of the Javascript to get a new challenge for KoC
 * @return {Text} captcha url
 */
koc.prototype.getKoCReCaptchaUrl = function() {
    return this.koc_recaptcha_url;
};

/**
 * Get a link to a ReCaptcha image given the server and the challenge
 * @param {Text} server ReCaptcha Server
 * @param {Text} challenge ReCaptcha challenge
 * @return {Text} URL to the ReCaptcha image
 */
koc.prototype.getRecaptchaImage = function(server, challenge) {
    return util.format(this.getReCaptchaImageFormat(), server, challenge);
};

/**
 * Set the format of the URL to get the recaptcha image from (server, challenge)
 * @param {Text} new URL format
 */
koc.prototype.setReCaptchaImageFormat = function( new_recaptcha_image_format ) {
    if( new_recaptcha_image_format !== undefined && new_recaptcha_image_format.length )
        this.recaptcha_image_format = new_recaptcha_image_format;
};

/**
 * Get the format of the URL to get the recaptcha image from (server, challenge)
 * @return {Text} URL format
 */
koc.prototype.getReCaptchaImageFormat = function() {
    return this.recaptcha_image_format;
};

/**
 * Set the session id to passed new_session_id
 * @param {Text} new session id to set
 */
koc.prototype.setSession = function( new_session ) {
    if( new_session !== undefined && new_session.length )
        this.session = new_session;
};

/**
 * Get current session id
 * @return {Text} current session id
 */
koc.prototype.getSession = function() {
    return this.session;
};

/**
 * Returns true if there is a session (non empty), false otherwise
 * @return {Boolean} whether or not there is a session set (non empty)
 */
koc.prototype.hasSession = function() {
    var session = this.getSession();
    return session !== undefined && session.length;
};

/**
 * Wrapper to prepare a response having all the fields. Especially adds the
 * session and the last known location.
 */
koc.prototype.prepareResponse = function( response ) {
    // append the session to the response
    response.session  = this.getSession();
    response.location = this.location;
    if( response.error === undefined )
        response.error = "";
    return response;
};

// Web Requests Helpers
// -----------------------------------------------------------------------------

/**
 * Get request options that we can pass to node request
 * @param {Text} method HTTP method to use (GET, POST, HEAD)
 * @param {Text} page KoC page to request (login.php, battlefield.php, etc...)
 * @param {Object} params Parameters for GET and POST requests
 * @param {Boolean} xhr Whether or not request through XHR (Ajax)
 * @return {Object} the options to pass to node request
 */
koc.prototype.getRequestOptions = function(method, page, params, xhr) {
    var koc_session = "";
    if(this.getSession() !== undefined && this.getSession().length>0) {
        koc_session = " " + this.getKoCSessionCookieName() + "=" + this.getSession();
    }
    var options = {
        url:   this.getKoCHost()+'/'+page,
        method: method,
        headers: {
            'Cookie': "country=XO;" + koc_session,
            'User-Agent': 'Node-KoC', //'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
            'Referer' : this.getKoCHost() + '/'
        },
        followAllRedirects: true
    };
    if( xhr===true ) {
        options.headers["X-Requested-With"] = "XMLHttpRequest";
        options.headers["Accept"] = "application/json, text/javascript, */*";
        options.headers["Origin"] = "http://www.kingsofchaos.com";
    }
    if(params!==undefined && params!==null)
        if(method=="GET")
            options.qs   = params;
        else
            options.form = params;
    return options;
};

/**
 * Update the value of KoC session id, if requeted by KoC server
 * @param {Object} headers The headers received from the server
 */
koc.prototype.updateKocSession = function( headers ) {
    if( headers === undefined ) return;
    var setCookie = headers['set-cookie'];
    var _koc = this;
    if( setCookie !== undefined && setCookie.length>0 ) {
        setCookie.forEach( function( cookieString ) {
            var cookie       = cookieString.split(';')[0];
            var cookieSplit  = cookie.split('=');
            var cookieName   = cookieSplit[0];
            var cookieValue  = cookieSplit[1] || '';
            if( cookieName == _koc.getKoCSessionCookieName() )
                _koc.setSession(cookieValue);
        });
    }
};

/**
 * Given express options, create and return a request promise to KoC server
 * @param {Object} options The options to send to request
 * @param {function} onSuccess Callback to call on success
 * @return {Object} the HTTP request promise (use .then() and .fail() on it)
 */
koc.prototype.createRequestPromise = function( options, onSuccess ) {
    var _koc = this;
    // Don't catch verify as an error if that's what we asked for!
    var catchVerify = options.url.indexOf("verify") == -1 && options.url.indexOf("signup") == -1;
    var p = request(options)
    .then( function(res) {
        var response = res[0];
        var body     = res[1];
        _koc.updateKocSession(response.headers);
        _koc.location = response.request.path;
        if (response.statusCode != 200) {
            return _koc.prepareResponse({
                success: false,
                error: "Wrong response from KoC server",
                details: "Got status " + response.statusCode,
            });
        }
        if(response.request.path == "/error.php") {
            return _koc.prepareResponse({
                success: false,
                error: getErrorMessage( body )
            });
        }
        if(catchVerify && response.request.path == "/verify.php") {
            return _koc.prepareResponse({
                success: false,
                error: "You must verify your account (e-mail) before you can play Kings of Chaos"
            });
        }
        return onSuccess(response, body);
    })
    .fail( function(error) {
        return _koc.prepareResponse({
            success: false,
            error: "A connection error occurred",
            details: error
        });
    });
    return p;
};

/**
 * Parses a battlefield page in HTML format and returns an array of players
 * @param {Text} html the content of the HTML page to parse
 * @return {Array} an array of the players information found on that page
 */
koc.prototype.parseBattlefield = function(html) {
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
 * Create a request to KoC website and return a node request promise
 * @param {Text} method HTTP method to use (GET, POST, HEAD)
 * @param {Text} page KoC page to request (login.php, battlefield.php, etc...)
 * @param {Object} params Parameters for GET and POST requests
 * @param {function} onSuccess Callback to call on success
 * @param {Boolean} xhr Whether or not request through XHR (Ajax)
 * @return {Object} the HTTP request promise (use .then() and .fail() on it)
 */
koc.prototype.requestPage = function(method, page, params, onSuccess, xhr) {
    var _koc = this;
    _koc.location = "/" + page;
    // If no koc_session, need to request one first
    if( _koc.getSession() === undefined || !_koc.getSession().length ) {
        // Request only headers to get a new koc_session
        _koc.location = "/";
        var p = request(_koc.getRequestOptions("HEAD",""))
        .then( function( result ) {
            var response = result[0];
            _koc.updateKocSession( response.headers );
            _koc.location = response.request.path;
            return _koc.createRequestPromise(_koc.getRequestOptions(method, page, params, xhr), onSuccess);
        } )
        .fail( function( error ) {
            return _koc.prepareResponse({
                success: false,
                error: "could not get a koc_session",
                details: error
            });
        } );
        return p;
    }
    return _koc.createRequestPromise(_koc.getRequestOptions(method, page, params, xhr), onSuccess);
};

/**
 * Login to KoC
 * @param {Text} username
 * @param {Text} password
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.login = function(username, password) {
    var _koc = this;
    var p = _koc.requestPage("POST", "login.php", {
        'usrname' : username,
        'peeword': password
    }, function(response, body) {
        return _koc.prepareResponse({
            success: true,
            user: _koc.parseBase(body)
        });
    });
    return p;
};

/**
 * Get a new ReCaptcha challenge for KoC
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.getReCaptchaChallenge = function() {
    // load recaptcha dynamic script
    var _koc = this;
    _koc.location = "captcha";
    var p = request({url:_koc.getKoCReCaptchaUrl()})
        .then(function(result){
            var response = result[0];
            if (response.statusCode != 200) {
                return _koc.prepareResponse({
                    success: false,
                    error: "Wrong response from the server",
                    details: "Got status " + response.statusCode
                });
            }
            var body     = result[1];
            // get the challenge & server
            var reChallenge = /challenge\s*:\s*'([^']+)',/gmi;
            var reServer    = /server\s*:\s*'([^']+)',/gmi;
            var mChallenge  = reChallenge.exec(body);
            var mServer     = reServer.exec(body);
            if( mChallenge === null || mServer === null ) {
                return _koc.prepareResponse({
                    success: false,
                    error: "Failed to read challenge or server",
                    details: {
                        challenge: mChallenge,
                        server: mServer
                    }
                });
            }
            var server    = mServer[1];
            var challenge = mChallenge[1];
            return _koc.prepareResponse({
                success: true,
                image: _koc.getRecaptchaImage(server, challenge),
                server: server,
                challenge: challenge
            });
        })
        .fail(function(error){
            return _koc.prepareResponse({
                success: false,
                error: "Error getting the captcha",
                details: error
            });
        });
    return p;
};

/**
 * Register a new user to KoC
 * @param {Text} race Humans, Dwarves, Elves, Undead, Orcs
 * @param {Text} username
 * @param {Text} password
 * @param {Text} email
 * @param {Text} challenge
 * @param {Text} challenge_response
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.register = function(race, username, password, email, challenge, challenge_response) {
    this.location = "register";
    if(!validateEmail(email)) {
        return Q(_koc.prepareResponse({
            success: false,
            error: "Invalid e-mail",
            details: {
                email: email
            }
        }));
    }
    var _koc = this;
    return this.verify(username, password, password).then( function(result) {
        if(!result.success || (!result.username.length && !result.password.length)) {
            // we need a turing
            return _koc.requestPage("GET", "index.php", null, function(response, body) {
                // get the turing
                var turing = getTuring(body);
                if( turing.length) {
                    return _koc.requestPage("POST", "signup.php", {
                        'race'      : race,
                        'username'  : username,
                        'password'  : password,
                        'password2' : password,
                        'turing'    : turing,
                        'recaptcha_challenge_field': challenge,
                        'recaptcha_response_field' : challenge_response
                    }, function(response, body) {
                        // Send the mail
                        return _koc.requestPage("POST", "verify.php", {
                            activation_email: email
                        }, function(response, body) {
                            if( response.request.path == '/verify.php?sent=true') {
                                return _koc.prepareResponse({
                                    success: true,
                                    message: "You should receive an e-mail shortly to validate your account"
                                });
                            }
                            else {
                                var message = "Account created but issue sending the verification mail";
                                if( response.request.path == "/verify.php?invalid=true" ) {
                                    message = "Account created but invalid or already taken e-mail";
                                }
                                return _koc.prepareResponse({
                                    success: true,
                                    message: message
                                });
                            }
                        });
                    });
                }
                else {
                    return _koc.prepareResponse({
                      success: false,
                      error: "Could not get a turing",
                      details: body
                    });
                }
            });
        }
        else {
            // something's wrong with the validation
            var error = util.format("%s %s", result.username, result.password).trim();
            return _koc.prepareResponse({
                success: false,
                error: error,
                details: result
            });
        }
    });
};

/**
 * Verify if the provided username and passwords are valid
 * @param {Text} username
 * @param {Text} password
 * @param {Text} password2 when asked to enter twice the password
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.verify = function(username, password, password2) {
    var _koc = this;
    return _koc.requestPage("POST", "signup.php", {
        username : username,
        password: password,
        password2: password2
    }, function(response, body) {
        try {
            var result = JSON.parse(body);
            result.success = result.username!==undefined&&result.password!==undefined;
            return _koc.prepareResponse(result);
        } catch(e){
            return _koc.prepareResponse({
                success: false,
                error: "Error parsing response",
                details: body
            });
        }
    }, true );
}

/**
 * Get user info from the base HTML page
 * @param {Text} baseHtml HTML content of the Base page
 * @return {Object} an object containing user information
 */
koc.prototype.parseBase = function(baseHtml) {
	//var re=/<tr>\s*<td>\s*<b>Name<\/b>\s*<\/td>\s*<td>\s*<a href="stats\.php\?id=([0-9]+)">([^<]+)<\/a>\s*<\/td>\s*<\/tr>/mg;
	//var re = new RegExp(createTrRegExp("Name", '<a href="stats\\.php\\?id=([0-9]+)">([^<]+)<\\/a>'), 'gm');
	try {
    	var reUserInfo = new RegExp(createTableRegExp([
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
    	var reMilitary = new RegExp(createTableRegExp([
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
    	var reMilitaryEffectiveness = new RegExp(createTableTripleTdRegExp([
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
    	var rePreviousLogins = new RegExp(createTableTripleTdRegExp([
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
    	var rePersonnel = new RegExp(createTableTripleTdRegExp([
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
    	return {
    	    success: true,
    		userInfo: {
    			userid: matches[1],
    			username: matches[2],
    			race: matches[3].trim(),
    			rank: matches[4],
    			highestRank: matches[5],
    			commander: stripHtml(matches[6])
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
 * Get user info. You need to be logged in and have a session already.
 * @return {Object} Return an object with 'success', 'error', 'session' and 'user'
 */
koc.prototype.getUserInfo = function() {
    // we need to be logged in
    var _koc = this;
    if( !this.hasSession() ) {
        return Q(_koc.prepareResponse({
            success: false,
            error: "You must set a session id to retrieve the base",
            user: {}
        }));
    }
    var p = _koc.requestPage("GET", "base.php", null, function(response, body) {
        return _koc.prepareResponse({
            success: true,
            user: _koc.parseBase(body)
        });
    });
    return p;
};

module.exports = koc;