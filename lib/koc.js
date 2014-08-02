// Libs
var Q       = require('q');
var request = Q.denodeify(require('request'));
var util    = require("util");
var helpers = require('./helpers');

// Our Lib
var koc = function(session) {
    this.session                 = session;
    this.koc_session_cookie_name = "koc_session";
    this.koc_host                = "http://www.kingsofchaos.com";
    this.koc_recaptcha_url       = "http://www.google.com/recaptcha/api/challenge?k=6LcvaQQAAAAAACnjh5psIedbdyYzGDb0COW82ruo";
    this.recaptcha_image_format  = "%simage?c=%s"; // path to the ReCaptcha image from (server, challenge)
    this.location                = "";
    this.stats                   = {};
    this.username                = "???";
    this.help                    = ""; // Help from the New User Advisor, if present
    this.parser                  = require('./parser');
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
    response.stats    = this.stats;
    response.help     = this.help;
    // The verify and error pages notably doesn't show the username and fortification in the title
    // Check and get it from the last known username instead
    if( this.stats.username !== undefined && this.stats.username.indexOf(" ")>=0 )
        this.stats.username = this.username;
    if( this.stats.fortification !== undefined && this.stats.fortification.indexOf(",")>=0 )
        this.stats.fortification = "???";
    if( response.error === undefined )
        response.error = "";
    return response;
};

/**
 * Parse and return the turing from given HTML content
 * @param {Text} HTML content to be parsed
 * @return {Text} Turing, if found, empty if not
 */
koc.prototype.getTuring = function(html) {
    var re = /name="turing"\s*value="([^"]+)">/gmi;
    var m  = re.exec(html);
    if(m!==null)
        return m[1];
    return "";
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
        var response  = res[0];
        var body      = res[1];
        _koc.location = response.request.path;
        _koc.stats    = _koc.parser.parseLeftSideBox(body);
        _koc.help     = _koc.parser.parseNewUserAdvisor(body);
        _koc.updateKocSession(response.headers);
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
                error: _koc.parser.parseErrorMessage( body )
            });
        }
        if(response.request.path == "/bansuspend.php") {
            return _koc.prepareResponse({
                success: false,
                error: _koc.parser.parseBannedMessage( body )
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
    if(params !== undefined && params !== null && params.usrname !== undefined)
        _koc.username = params.usrname;
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
            user: _koc.parser.parseBase(body)
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
    if(!helpers.validateEmail(email)) {
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
                var turing = _koc.getTuring(body);
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
            user: _koc.parser.parseBase(body)
        });
    });
    return p;
};

/**
 * Get the races information
 * @return {Object} races information
 */
koc.prototype.getRacesInformation = function() {
    // we need to be logged in
    var _koc = this;
    var p = _koc.requestPage("GET", "index.php", null, function(response, body) {
        return _koc.prepareResponse({
            success: true,
            races: _koc.parser.parseRacesInfo(body),
            kocHost: _koc.getKoCHost()
        });
    });
    return p;
};

module.exports = koc;