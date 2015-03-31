// Libs
var Q = require('q');
var request = Q.denodeify(require('request'));
var util = require("util");
var helpers = require('./helpers');

// Our Lib
/** @exports koc
 * Main Library */
var koc = function (session) {
  this.session = session;
  this.koc_session_cookie_name = "koc_session";
  this.koc_host = "http://www.kingsofchaos.com";
  this.koc_recaptcha_url = "http://www.google.com/recaptcha/api/challenge?k=6LcvaQQAAAAAACnjh5psIedbdyYzGDb0COW82ruo";
  this.recaptcha_image_format = "%simage?c=%s"; // path to the ReCaptcha image from (server, challenge)
  this.location = "";
  this.stats = {};
  this.username = "???";
  this.help = ""; // Help from the New User Advisor, if present
  this.parser = require('./parser');
  this.age = 0;
  this.menu = [];
  this.default_commander_change_statement = "Yes, I am sure I want to change commanders.";
};

// Our lib
// =============================================================================

// Getters / Setters
// -----------------------------------------------------------------------------

/**
 * Set the name of the cookie that KoC uses to store the session id
 * @param {String} new_cookie_name
 */
koc.prototype.setKoCSessionCookieName = function (new_cookie_name) {
  if (new_cookie_name !== undefined && new_cookie_name.length)
    this.koc_session_cookie_name = new_cookie_name;
};

/**
 * Get the name of the cookie that KoC uses to store the session id
 * @return {String} the cookie name
 */
koc.prototype.getKoCSessionCookieName = function () {
  return this.koc_session_cookie_name;
};

/**
 * Set the base URL of KoC website
 * @param {String} new_koc_host
 */
koc.prototype.setKoCHost = function (new_koc_host) {
  if (new_koc_host !== undefined && new_koc_host.length)
    this.koc_host = new_koc_host;
};

/**
 * Get the base URL of KoC website
 * @return {String} KoC URL
 */
koc.prototype.getKoCHost = function () {
  return this.koc_host;
};

/**
 * Set the URL of the Javascript to get a new challenge for KoC
 * @param {String} new_koc_recaptcha_url
 */
koc.prototype.setKoCReCaptchaUrl = function (new_koc_recaptcha_url) {
  if (new_koc_recaptcha_url !== undefined && new_koc_recaptcha_url !== null && new_koc_recaptcha_url.length)
    this.koc_recaptcha_url = new_koc_recaptcha_url;
};

/**
 * Get the URL of the Javascript to get a new challenge for KoC
 * @return {String} captcha url
 */
koc.prototype.getKoCReCaptchaUrl = function () {
  return this.koc_recaptcha_url;
};

/**
 * Get a link to a ReCaptcha image given the server and the challenge
 * @param {String} server ReCaptcha Server
 * @param {String} challenge ReCaptcha challenge
 * @return {String} URL to the ReCaptcha image
 */
koc.prototype.getRecaptchaImage = function (server, challenge) {
  return util.format(this.getReCaptchaImageFormat(), server, challenge);
};

/**
 * Set the format of the URL to get the recaptcha image from (server, challenge)
 * @param {String} new_recaptcha_image_format
 */
koc.prototype.setReCaptchaImageFormat = function (new_recaptcha_image_format) {
  if (new_recaptcha_image_format !== undefined && new_recaptcha_image_format.length)
    this.recaptcha_image_format = new_recaptcha_image_format;
};

/**
 * Get the format of the URL to get the recaptcha image from (server, challenge)
 * @return {String} URL format
 */
koc.prototype.getReCaptchaImageFormat = function () {
  return this.recaptcha_image_format;
};

/**
 * Set the session id to passed new_session_id
 * @param {String} new_session new session id to set
 */
koc.prototype.setSession = function (new_session) {
  if (new_session !== undefined && new_session.length)
    this.session = new_session;
};

/**
 * Get current session id
 * @return {String} current session id
 */
koc.prototype.getSession = function () {
  return this.session;
};

/**
 * Returns true if there is a session (non empty), false otherwise
 * @return {Boolean} whether or not there is a session set (non empty)
 */
koc.prototype.hasSession = function () {
  var session = this.getSession();
  return session !== undefined && session.length;
};

/**
 * Wrapper to prepare a response having all the fields. Especially adds the
 * session and the last known location.
 * Nest the result under "result", keeping top-level error/success
 */
koc.prototype.prepareResponse = function (result) {
  // nest the response under "result", keeping top-level error/success
  var response = {
    result : result,
    error  : (result.error   === undefined) ?    "" : result.error,
    success: (result.success === undefined) ? false : result.success,
  };
  // append the session to the response
  response.session = this.getSession();
  response.location = this.location;
  response.stats = this.stats;
  if (this.help.length > 0)
    response.help = this.help;
  // The verify and error pages notably don't show the username and fortification in the title
  // Check and get it from the last known username instead
  if (this.stats.username !== undefined && this.stats.username.indexOf(" ") >= 0)
    this.stats.username = this.username;
  if (this.stats.fortification !== undefined && this.stats.fortification.indexOf(",") >= 0)
    this.stats.fortification = "???";
  if (this.age > 0)
    response.age = this.age;
  response.kocHost = this.koc_host;
  // if (this.menu.length>0)
  //     response.menu = this.menu;
  return response;
};

koc.prototype.getDefaultCommanderChangeStatement = function () {
  return this.default_commander_change_statement;
};

koc.prototype.setDefaultCommanderChangeStatement = function (new_value) {
  if (new_value !== undefined && new_value.length)
    this.default_commander_change_statement = new_value;
};

// Web Requests Helpers
// -----------------------------------------------------------------------------

/**
 * Get request options that we can pass to node request
 * @param {String} method HTTP method to use (GET, POST, HEAD)
 * @param {String} page KoC page to request (login.php, battlefield.php, etc...)
 * @param {Object} [params] Parameters for GET and POST requests
 * @param {Boolean} [xhr] Whether or not request through XHR (Ajax)
 * @return {Object} the options to pass to node request
 */
koc.prototype.getRequestOptions = function (method, page, params, xhr) {
  var koc_session = "";
  if (this.getSession() !== undefined && this.getSession().length > 0) {
    koc_session = " " + this.getKoCSessionCookieName() + "=" + this.getSession();
  }
  var options = {
    url: this.getKoCHost() + '/' + page,
    method: method,
    headers: {
      'Cookie': "country=XO;" + koc_session,
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',//'Node-KoC',
      'Referer': this.getKoCHost() + '/' + page
    },
    followAllRedirects: true
  };
  if (xhr === true) {
    options.headers["X-Requested-With"] = "XMLHttpRequest";
    options.headers.Accept = "application/json, text/javascript, */*";
    options.headers.Origin = "http://www.kingsofchaos.com";
  }
  if (page.indexOf("recruit.img") >= 0) {
    // no encoding
    options.encoding = null;
  }
  if (params !== undefined && params !== null)
    if (method == "GET")
      options.qs = params;
    else
      options.form = params;
  return options;
};

/**
 * Update the value of KoC session id, if requeted by KoC server
 * @param {Object} headers The headers received from the server
 */
koc.prototype.updateKocSession = function (headers) {
  if (headers === undefined) return;
  var setCookie = headers['set-cookie'];
  var _koc = this;
  if (setCookie !== undefined && setCookie.length > 0) {
    setCookie.forEach(function (cookieString) {
      var cookie = cookieString.split(';')[0];
      var cookieSplit = cookie.split('=');
      var cookieName = cookieSplit[0];
      var cookieValue = cookieSplit[1] || '';
      if (cookieName == _koc.getKoCSessionCookieName())
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
koc.prototype.createRequestPromise = function (options, onSuccess) {
  var _koc = this;
  // Don't catch verify as an error if that's what we asked for!
  var catchVerify = options.url.indexOf("verify") == -1 && options.url.indexOf("signup") == -1;
  return request(options)
    .then(function (res) {
      var response = res[0];
      var body = res[1];
      _koc.location = response.request.path;
      // If not XHR, nor an image, try to parse some more information
      if (options.headers["X-Requested-With"] === undefined && options.url.indexOf("recruit.img") < 0) {
        _koc.stats = _koc.parser.parseLeftSideBox(body);
        _koc.help = _koc.parser.parseNewUserAdvisor(body);
        _koc.age = _koc.parser.guessAge(body);
        _koc.menu = _koc.parser.parseMenu(body);
      }
      _koc.updateKocSession(response.headers);
      if (response.statusCode != 200) {
        return _koc.prepareResponse({
          success: false,
          error: "Wrong response from KoC server",
          details: "Got status " + response.statusCode,
        });
      }
      if (response.request.path == "/error.php") {
        return _koc.prepareResponse({
          success: false,
          error: _koc.parser.parseErrorMessage(body)
        });
      }
      if (response.request.path == "/bansuspend.php") {
        return _koc.prepareResponse({
          success: false,
          error: _koc.parser.parseBannedMessage(body)
        });
      }
      if (catchVerify && response.request.path == "/verify.php") {
        return _koc.prepareResponse({
          success: false,
          error: "You must verify your account (e-mail) before you can play Kings of Chaos"
        });
      }
      return onSuccess(response, body);
    })
    .fail(function (error) {
      return _koc.prepareResponse({
        success: false,
        error: "A connection error occurred",
        details: error
      });
    });
};

/**
 * Create a request to KoC website and return a node request promise
 * @param {Boolean} mustBeLoggedIn whether or not the user must be logged in to load that page
 * @param {String} method HTTP method to use (GET, POST, HEAD)
 * @param {String} page KoC page to request (login.php, battlefield.php, etc...)
 * @param {Object} params Parameters for GET and POST requests
 * @param {function} onSuccess Callback to call on success
 * @param {Boolean} [xhr=false] Whether or not request through XHR (Ajax)
 * @return {Object} the HTTP request promise (use .then() and .fail() on it)
 */
koc.prototype.requestPage = function (mustBeLoggedIn, method, page, params, onSuccess, xhr) {
  // Check if we need to be logged in
  var _koc = this;
  if (mustBeLoggedIn && !_koc.hasSession()) {
    return Q(_koc.prepareResponse({
      success: false,
      error: "You must be logged in to retrieve " + page,
      user: {}
    }));
  }
  _koc.location = "/" + page;
  if (params !== undefined && params !== null && params.usrname !== undefined)
    _koc.username = params.usrname;
  // If no koc_session, need to request one first
  if (_koc.getSession() === undefined || !_koc.getSession().length) {
    // Request only headers to get a new koc_session
    _koc.location = "/";
    return request(_koc.getRequestOptions("HEAD", ""))
      .then(function (result) {
        var response = result[0];
        _koc.updateKocSession(response.headers);
        _koc.location = response.request.path;
        return _koc.createRequestPromise(_koc.getRequestOptions(method, page, params, xhr), onSuccess);
      })
      .fail(function (error) {
        return _koc.prepareResponse({
          success: false,
          error: "could not get a koc_session",
          details: error
        });
      });
  }
  return _koc.createRequestPromise(_koc.getRequestOptions(method, page, params, xhr), onSuccess);
};

/**
 * Login to KoC
 * @param {String} username
 * @param {String} password
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.login = function (username, password) {
  var _koc = this;
  return _koc.requestPage(false, "POST", "login.php", {
    'usrname': username,
    'peeword': password
  }, function (response, body) {
    // call setres.php
    _koc.requestPage(false, "GET", "setres.php", {
      width: 1280,
      height: 720,
    }, function (response2/*, body2*/) {
      // do nothing, we don't care much
      //console.log(response2);
    });
    return _koc.prepareResponse({
      success: true,
      user: _koc.parser.parseBase(body)
    });
  });
};

/**
 * Get a new ReCaptcha challenge for KoC
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.getReCaptchaChallenge = function () {
  // load recaptcha dynamic script
  var _koc = this;
  _koc.location = "captcha";
  return request({url: _koc.getKoCReCaptchaUrl()})
    .then(function (result) {
      var response = result[0];
      if (response.statusCode != 200) {
        return _koc.prepareResponse({
          success: false,
          error: "Wrong response from the server",
          details: "Got status " + response.statusCode
        });
      }
      var body = result[1];
      // get the challenge & server
      var reChallenge = /challenge\s*:\s*'([^']+)',/gmi;
      var reServer = /server\s*:\s*'([^']+)',/gmi;
      var mChallenge = reChallenge.exec(body);
      var mServer = reServer.exec(body);
      if (mChallenge === null || mServer === null) {
        return _koc.prepareResponse({
          success: false,
          error: "Failed to read challenge or server",
          details: {
            challenge: mChallenge,
            server: mServer
          }
        });
      }
      var server = mServer[1];
      var challenge = mChallenge[1];
      return _koc.prepareResponse({
        success: true,
        image: _koc.getRecaptchaImage(server, challenge),
        server: server,
        challenge: challenge
      });
    })
    .fail(function (error) {
      return _koc.prepareResponse({
        success: false,
        error: "Error getting the captcha",
        details: error
      });
    });
};

/**
 * Register a new user to KoC
 * @param {String} race Humans, Dwarves, Elves, Undead, Orcs
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @param {String} challenge
 * @param {String} challenge_response
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.register = function (race, username, password, email, challenge, challenge_response) {
  this.location = "register";
  var _koc = this;
  if (!helpers.validateEmail(email)) {
    return Q(_koc.prepareResponse({
      success: false,
      error: "Invalid e-mail",
      details: {
        email: email
      }
    }));
  }
  return this.verify(username, password, password).then(function (result) {
    if (!result.success || (!result.username.length && !result.password.length)) {
      // we need a turing
      return _koc.requestPage(false, "GET", "index.php", null, function (response, body) {
        // get the turing
        var turing = _koc.parser.getTuring(body);
        if (turing.length) {
          return _koc.requestPage(false, "POST", "signup.php", {
            'race': race,
            'username': username,
            'password': password,
            'password2': password,
            'turing': turing,
            'recaptcha_challenge_field': challenge,
            'recaptcha_response_field': challenge_response
          }, function (/*response, body*/) {
            // Send the mail
            return _koc.requestPage(false, "POST", "verify.php", {
              activation_email: email
            }, function (response2/*, body2*/) {
              if (response2.request.path == '/verify.php?sent=true') {
                return _koc.prepareResponse({
                  success: true,
                  message: "You should receive an e-mail shortly to validate your account"
                });
              }
              else {
                var message = "Account created but issue sending the verification mail";
                if (response2.request.path == "/verify.php?invalid=true") {
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
 * @param {String} username
 * @param {String} password
 * @param {String} password2 when asked to enter twice the password
 * @return {Object} Promise of the HTTP request which should return an object
 *                  containing "success" and "session" fields at least. Use
 *                  .then() and .fail() to catch the promise result
 */
koc.prototype.verify = function (username, password, password2) {
  var _koc = this;
  return _koc.requestPage(false, "POST", "signup.php", {
    username: username,
    password: password,
    password2: password2
  }, function (response, body) {
    try {
      var result = JSON.parse(body);
      result.success = result.username !== undefined && result.password !== undefined;
      return _koc.prepareResponse(result);
    } catch (e) {
      return _koc.prepareResponse({
        success: false,
        error: "Error parsing response",
        details: body
      });
    }
  }, true);
};

koc.prototype.verifyEmail = function (email) {
  this.location = "verify";
  var _koc = this;
  if (!helpers.validateEmail(email)) {
    return Q(_koc.prepareResponse({
      success: false,
      error: "Invalid e-mail",
      details: {
        email: email
      }
    }));
  }
  return _koc.requestPage(true, "POST", "verify.php", {activation_email: email}, function (response, body) {
    var path = response.request.req.path;
    var errorMessage = _koc.parser.parseVerifyEmailError(body);
    if (path == "/verify.php?sent=true") {
      return {
        success: true,
        message: 'Email sent! You should receive an activation link within 1 hour',
      };
    }
    else if (path == "verify.php?invalid=true") {
      return {
        success: false,
        error: errorMessage,
      };
    }
    else {
      return {
        success: !errorMessage.length,
        error: errorMessage
      };
    }
  });
};

/**
 * Get user info. You need to be logged in and have a session already.
 * @return {Object} Return an object with 'success', 'error', 'session' and 'user'
 */
koc.prototype.getUserInfo = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "base.php", null, function (response, body) {
    return _koc.prepareResponse({
      success: true,
      user: _koc.parser.parseBase(body)
    });
  });
};

/**
 * Get the races information
 * @return {Object} A promise to the races information
 */
koc.prototype.getRacesInformation = function () {
  var _koc = this;
  return _koc.requestPage(false, "GET", "index.php", null, function (response, body) {
    return _koc.prepareResponse({
      success: true,
      races: _koc.parser.parseRacesInfo(body),
      kocHost: _koc.getKoCHost()
    });
  });
};

/** Toggle the New User Advisor on the KoC Account
 * @return {Object} A promise which will contain user stats if succeed
 */
koc.prototype.toggleAdvisor = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "toggle_advisor.php", null, function (/*response, body*/) {
    return _koc.prepareResponse({
      success: true
    });
  });
};

/** Change the race
 * @param {String} new_race the race to change to
 * @return {Object} A promise which will eventually succeed and parse the base
 */
koc.prototype.changeRace = function (new_race) {
  var _koc = this;
  return _koc.requestPage(true, "POST", "base.php", {
      change_race: "Go",
      change_race_to: new_race
    },
    function (response, body) {
      return _koc.prepareResponse({
        success: true,
        user: _koc.parser.parseBase(body)
      });
    });
};

koc.prototype.getLeftMenuInfo = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "base.php", null,
    function (response, body) {
      return _koc.prepareResponse({
        success: true,
        user: _koc.parser.parseBase(body),
        menu: _koc.parser.parseMenu(body),
      });
    });
};

/**
 * Get the number of times we can change the commander
 * and the statement to copy (image)
 * @return {Object} A promise which if succeed returns an object with
 * 'success', 'nbTimesCanChange', 'errorMessage' and 'statement' properties
 */
koc.prototype.getChangeCommanderInfo = function () {
  var _koc = this;
  // get commander_change.php
  return _koc.requestPage(true, "GET", "commander_change.php", null,
    function (response, body) {
      // Parse number of times and statement image
      return _koc.prepareResponse({
        success: true,
        commanderChange: _koc.parser.parseCommanderChange(body),
        kocHost: _koc.getKoCHost()
      });
    });
};

koc.prototype.changeCommander = function (new_commander_id, password, statement) {
  var _koc = this;
  if (statement === null || statement === undefined || !statement.length)
    statement = this.getDefaultCommanderChangeStatement();
  // post commander_change.php
  return _koc.requestPage(true, "POST", "commander_change.php", {
      new_commander_id: new_commander_id.toString(),
      statement: statement,
      oldpass: password,
      hash: ""
    },
    function (response, body) {
      // if still on commander_change.php, something went wrong
      if (response.request.path.indexOf("commander_change.php") >= 0) {
        // Check the error msg
        var commanderChangeInfo = _koc.parser.parseCommanderChange(body);
        return _koc.prepareResponse({
          success: false,
          error: commanderChangeInfo.errorMessage,
          details: commanderChangeInfo
        });
      }
      else {
        // Should be alright and we should be on base
        if (response.request.path.indexOf("base.php") >= 0) {
          return _koc.prepareResponse({
            success: true,
            user: _koc.parser.parseBase(body)
          });
        }
        // Not sure if it went alright or not...
        return _koc.prepareResponse({
          success: false,
          error: 'An unknown error has occurred, not sure if changing commander worked'
        });
      }
    });
};

koc.prototype.ditchCommander = function (password, statement) {
  return this.changeCommander(0, password, statement);
};

koc.prototype.getHelp = function () {
  // Just a raw object now as it's not easy/maintainable to parse it
  return require('./help');
};

koc.prototype.forgotPass = function (username, email) {
  var _koc = this;
  if (( username === undefined || username === null || !username.length ) && ( email === undefined || email === null || !email.length ))
    return Q(_koc.prepareResponse({
      success: false,
      error: "Please enter a username or email"
    }));
  if (email.length && !helpers.validateEmail(email))
    return Q(_koc.prepareResponse({
      success: false,
      error: "Invalid EMail"
    }));
  return _koc.requestPage(false, "POST", "forgotpass.php", {
      email: email,
      username: username,
      hash: ""
    },
    function (response, body) {
      // Check the error msg, if any
      var forgotPassMessage = _koc.parser.parseForgotPass(body);
      if (forgotPassMessage.indexOf("emailed to you") >= 0)
        return _koc.prepareResponse({
          success: true,
          message: forgotPassMessage
        });
      return _koc.prepareResponse({
        success: false,
        error: forgotPassMessage
      });
    });
};

koc.prototype.logout = function () {
  var _koc = this;
  return _koc.requestPage(false, "GET", "logout.php", null,
    function (response, body) {
      // Check the error msg, if any
      if (body.indexOf('<input class="login_input" type="submit" value="Login"') >= 0)
        return _koc.prepareResponse({
          success: true,
          message: "Logged out successfully"
        });
      return _koc.prepareResponse({
        success: false,
        error: "Maybe not logged off properly",
        details: response
      });
    });
};

koc.prototype.getQuickStats = function (id) {
  var _koc = this;
  if (!isFinite(id))
    return Q(_koc.prepareResponse({
      success: false,
      error: "Specify an user id which is a number",
      user: {}
    }));
  return _koc.requestPage(true, "GET", "stats.php", {id: id}, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseQuickStats(body));
  }, true);
};

koc.prototype.getFullStats = function (id) {
  var _koc = this;
  if (!isFinite(id))
    return Q(_koc.prepareResponse({
      success: false,
      error: "Specify an user id which is a number",
      user: {}
    }));
  return _koc.requestPage(true, "GET", "stats.php", {id: id}, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseFullStats(body));
  });
};

koc.prototype.getArmory = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "armory.php", null, function (response, body) {
    return _koc.prepareResponse({
      success: true,
      armory: _koc.parser.parseArmory(body)
    });
  });
};

/**
 * Buy weapons. Use getArmory() to find out the turing and inputNameValue.
 * @param {String} turing The turing of the last armory page you visited
 * @param {Object} inputNameValue example: { "buy_weapon[62]": 1, "buy_weapon[25]: 14 }
 */
koc.prototype.buyWeapons = function (turing, inputNameValue) {
  var _koc = this;
  var data = inputNameValue;
  data.turing = turing;
  data.hash = "";
  return _koc.requestPage(true, "POST", "armory.php", data, function (response, body) {
    return _koc.prepareResponse({
      success: true,
      armory: _koc.parser.parseArmory(body)
    });
  });
};

koc.prototype.getTraining = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "train.php", null, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseTraining(body));
  });
};

koc.prototype.train = function (turing, inputNameValue) {
  var _koc = this;
  var data = inputNameValue;
  data.turing = turing;
  data.hash = "";
  return _koc.requestPage(true, "POST", "train.php", data, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseTraining(body));
  });
};

koc.prototype.getMercenaries = function () {
  var _koc = this;
  return _koc.requestPage(true, "GET", "mercs.php", null, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseMercenaries(body));
  });
};

koc.prototype.hireMercenaries = function (turing, inputNameValue) {
  var _koc = this;
  var data = inputNameValue;
  data.turing = turing;
  data.hash = "";
  return _koc.requestPage(true, "POST", "mercs.php", data, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseMercenaries(body));
  });
};

var handleRecruit = function (koc, html) {
  var parsedResponse = koc.parser.parseRecruit(html);
  var p;
  if (!parsedResponse.success && parsedResponse.error == "Invalid Selection") {
    // we need to get the captcha
    koc.setKoCReCaptchaUrl(parsedResponse.challenge_url);
    p = koc.getReCaptchaChallenge()
      .then(function (captchaResponse) {
        // extend parseResponse
        for (var attrname in captchaResponse) {
          //noinspection JSUnfilteredForInLoop
          parsedResponse[attrname] = captchaResponse[attrname];
        }
        return parsedResponse;
      })
      .fail(function (/*captchaError*/) {
        parsedResponse.success = false;
        parsedResponse.error = "Error retrieving the captcha";
        return parsedResponse;
      });
  }
  else if (parsedResponse.success === true && parsedResponse.image !== undefined && parsedResponse.image !== null && parsedResponse.image.length) {
    // add koc host and load it with correct session
    parsedResponse.image = koc.getKoCHost() + parsedResponse.image;
    p = koc.requestPage(true, "GET", parsedResponse.image, {}, function (response, img) {
      parsedResponse.imageData = img.toString("base64");
      return koc.prepareResponse(parsedResponse);
    });
  }
  else {
    p = Q(koc.prepareResponse(parsedResponse));
  }
  return p;
};

var recruit = function (koc, page, data) {
  var p;
  if (data === undefined || data === null || data == {}) {
    // GET the recruit page
    p = koc.requestPage(true, "GET", page, {}, function (response, body) {
      return handleRecruit(koc, body);
    });
  }
  else {
    // POST the recruit page
    if (data.hash === undefined) data.hash = "";
    // if(data.image_click_number===undefined) data.image_click_number = "";
    // if(data.image_click_value ===undefined) data.image_click_value  = "";
    p = koc.requestPage(true, "POST", page, data, function (response, body) {
      return handleRecruit(koc, body);
    });
  }
  return p;
};

koc.prototype.recruit = function (data) {
  return recruit(this, "recruit.php", data);
};

koc.prototype.clicker = function (data) {
  return recruit(this, "clicker.php", data);
};

// Attack Log
// b_start: by you
// o_start: on you
koc.prototype.attackLog = function (b_start, o_start) {
  var _koc = this;
  if (b_start === undefined || !isFinite(Number(b_start)))
    b_start = 0;
  if (o_start === undefined || !isFinite(Number(o_start)))
    o_start = 0;
  return _koc.requestPage(true, "GET", "attacklog.php", {
    b_start: b_start,
    o_start: o_start,
  }, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseAttackLog(body));
  }, true);
};

// Spy Log (Intelligence)
// b_start: files start
// o_start: intercepted start
koc.prototype.intelligence = function (files_start, intercepted_start) {
  var _koc = this;
  if (files_start === undefined || !isFinite(Number(files_start)))
    files_start = 0;
  if (intercepted_start === undefined || !isFinite(Number(intercepted_start)))
    intercepted_start = 0;
  return _koc.requestPage(true, "GET", "intel.php", {
    b_start: files_start,
    o_start: intercepted_start,
  }, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseIntelligence(body));
  }, true);
};

// Attack
koc.prototype.attack = function() {
  var _koc = this;
  return _koc.requestPage(true, "GET", "attack.php", null, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseBattlefield(body));
  }, false);
};

// Battlefield
koc.prototype.battlefield = function (page) {
  var _koc = this;
  if (page === undefined || !isFinite(Number(page)))
    page = 1;
  var start = (Number(page) - 1) * 20;
  if (start < 0)
    start = 0;
  return _koc.requestPage(true, "GET", "battlefield.php", {
    start: start,
    search: '',
    search_type: '',
    buddy_type: 'none',
  }, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseBattlefield(body));
  }, true);
};

// Battle Report
koc.prototype.battleReport = function (attack_id) {
  var _koc = this;
  return _koc.requestPage(true, "GET", "detail.php", {attack_id: attack_id}, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseBattleReport(body));
  });
};

// Intel File
/**
 * Retrieve the intelligence files for the given asset_id
 * @param asset_id usually same as the user_id
 */
koc.prototype.intelFile = function (asset_id) {
  var _koc = this;
  return _koc.requestPage(true, "GET", "intelfile.php", {asset_id: asset_id}, function (response, body) {
    return _koc.prepareResponse(_koc.parser.parseIntelFile(body));
  });
};

/**
 * Retrieve the spy report for given report_id
 * @param report_id
 * @returns {Object}
 */
koc.prototype.intelDetail = function (report_id) {
  var _koc = this;
  return _koc.requestPage(true, "GET", "inteldetail.php", {report_id: report_id}, function (response, body) {
    var intelDetail = _koc.parser.parseIntelDetail(body, response.request.path);
    return _koc.prepareResponse(intelDetail);
  });
};

/**
 * Retrieve the index
 * @returns {Object}
 */
koc.prototype.index = function() {
  var _koc = this;
  return _koc.requestPage(false, "GET", "index.php", null, function () {
    return _koc.prepareResponse({});
  });
};

/**
 * Spy the given user and return the intel detail in case of success
 * @param userid {number} userid of the defender
 * @param turing {string=} turing of this page
 * @returns {Object}
 */
koc.prototype.recon = function(userid, turing) {
  var _koc = this;

  // If turing is not passed, get it from stats.php?id=userid
  if( turing === undefined || turing === null || !turing.length ) {
    return _koc.getQuickStats(userid)
      .then(function (quickStats) {
        if (quickStats.result !== undefined
          && quickStats.result.turing !== undefined
          && quickStats.result.turing !== null
          && quickStats.result.turing.length) {
          return _koc.recon(userid, quickStats.result.turing); // recurse with the turing
        }
        return _koc.prepareResponse({
          success: false,
          error: "Failed to get the turing from the quick stats",
          details: quickStats,
        });
      })
      .fail(function (error) {
        return _koc.prepareResponse({
          success: false,
          error: "Failed to get thequick stats",
          details: error,
        });
      });
  }
  else {
    var data = {
      turing: turing,
      mission_type: 'recon',
      defender_id: userid,
    };
    if( _koc.reconData === undefined ) {
      // That's the first time we're called, setup our reconData
      // in case we need to recurse with a new turing
      _koc.reconData = {
        attemptNb: 0,
        userid: userid,
      }
    }
    _koc.reconData.attemptNb++;
    return _koc.requestPage(true, "POST", "attack.php", data, function (response, body) {
      // If we're on the intel detail, it's all good, we can parse it and return it
      if( response.request.uri.pathname == '/inteldetail.php' ) {
        var intelDetail = _koc.parser.parseIntelDetail(body, response.request.path);
        return _koc.prepareResponse(intelDetail);
      }
      // If we have the wrong turing, we are redirected to attack.php
      // We can try to get the new turing and try again
      if( response.request.uri.pathname == '/attack.php' ) {
        if(_koc.reconData.attemptNb > 3) {
          return _koc.prepareResponse({
            success: false,
            error: "Failed after 3 attempts",
          });
        }
        // Get the new turing
        var newTuring = _koc.parser.getTuring(body);
        // Call itself
        return _koc.recon(_koc.reconData.userid, newTuring);
      }
      return _koc.prepareResponse({
        success: false,
        error: "I don't know how to handle " + response.request.path,
      });
    });
  }
};

// TODO: Attack
// TODO: Sab


module.exports = koc;