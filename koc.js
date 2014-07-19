
var koc = {};

koc.parseBattlefield = function(html) {
    var re = /<tr class="player" user_id="([0-9]+)"\s*>\s*<td[^>]*><a href="alliances\.php\?id=([^"]*)">[^<]*<\/a><\/td>\s*<td><a[^>]*>([^<]+)<\/a><\/td>[^>]*>([0-9,]+)<\/td>[^>]*>\s*([A-Za-z0-9-_]+)\s*<\/td>[^>]*>([^G]+)Gold<\/td>[^>]*>([^<]+)<\/td>/gmi;
    var players = [];
    var m;
    while ((m = re.exec(html)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        // View your result using the m-variable.
        // eg m[0] etc.
        var player = {
          userid   : m[1],
          alliance : m[2],
          username : m[3],
          armySize : m[4],
          race     : m[5],
          gold     : m[6],
          rank     : m[7]
        };
        players.push(player);
    };
    return players;
};

module.exports = koc;