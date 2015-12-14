# node-koc

Node library to parse data from the online MMORPG Kings of Chaos <br />
This library is the 'core', or server-side / parser of a set of 3 libraries as shown in the diagram below

[koc-ionic](../../../koc-ionic)<br />
[koc-api](../../../koc-api)<br />
[node-koc](../../../node-koc)<br />

![Relations between the libraries](http://i.imgur.com/pbDEWd2.png "Relations between the libraries")

### Install

`npm install koc`

### Use

Check [lib/koc.js](lib/koc.js) for the available functions.

#### Examples (non exhaustive):

##### Create the main object
<pre><code>var KoC = require('koc');
var koc = new KoC();
</code></pre>

##### Login
<pre><code>koc.login( 'username', 'password' );</code></pre>

##### Get your own user info (Command Center)
<pre><code>koc.getUserInfo();</code></pre>

##### Get the light stats of a given user
Note: as what you see when clicking on a user from the battlefield
<pre><code>koc.getQuickStats( 3512693 );</code></pre>

##### Get the full stats of a given user
Note: as what you see on the user's stats page
<pre><code>koc.getFullStats( 3512693 );</code></pre>

##### Get your armory
Note: this also returns the 'turing' needed for example when buying weapons
<pre><code>koc.getArmory();</code></pre>

##### Buy weapons
Note: you need the turing provided by the getArmory() call<br />
Note: the second argument is the list of weapons as retrieved in the `koc.getArmory()` call prior to buy
<pre><code>koc.buyWeapons( 'turing', { "buy_weapon[62]": 1, "buy_weapon[25]": 14 } );</code></pre>

##### See your training center
<pre><code>koc.getTraining();</code></pre>

##### Train your soldiers
Note: turing and soldiers to train as returned in the `koc.getTraining()` call prior to train
<pre><code>koc.train( 'turing', { ... } );</code></pre>

##### See your mercenaries
<pre><code>koc.getMercenaries();</code></pre>

##### Hire mercenaries
Note: turing and mercenaries to hire as returned in the `koc.getMercenaries(`) call prior to hire
<pre><code>koc.hireMercenaries( 'turing', { ... } );</code></pre>

##### Get the Attack Log
Example to retrieve the most recent 20 attacks by you and on you
<pre><code>koc.attackLog();
koc.attackLog(0,0); // equivalent as above</code></pre>
Example to retrieve the attack log, starting on the 21st most recent attack by you (20) and the 41st most recent attack on you (40)
<pre><code>koc.attackLog(20,40)</code></pre>

##### Get the Intelligence Log
Example to retrieve the most recent 20 reports of users you have recon and spies you intercepted
<pre><code>koc.intelligence();
koc.intelligence(0,0); // equivalent as above</code></pre>
Example to retrieve the intelligence log starting from the 21st most recent recon by you (20) and the 41st most recent intercepted report (40)
<pre><code>koc.intelligence(20,40)</code></pre>

##### Attack
Retrieves the info in the page on the battlefield where you are listed (same as when you click 'Attack').
<pre><code>koc.attackField()</code></pre>

##### Battlefield
Retrieves the info on the battlefield for the given page<br />
Note: Depending on your spy level, you can see the Gold of some users
<pre><code>koc.battlefield(1); // first page
koc.battlefield(50); // 50th page</code></pre>

##### Battle Report
Retrieve the given battle report
<pre><code>koc.battleReport( 1234 );</code></pre>

##### Intel File
Retrieves the intelligence files you have for the given user
<pre><code>koc.intelFile( 3512693 );</code></pre>

##### Intel Detail
Gives you the detail of a single spy from the list of reports given by `koc.intelFile( userid )`
<pre><code>koc.intelDetail( 1234 );</code></pre>

##### Spy
Spy your enemies!
<pre><code>koc.recon( 3512693 );</code></pre>
Note: If you have the turing given by `koc.getFullStats()` or `koc.getQuickStats()` prior to spy, you can specify it:
<pre><code>koc.recon( 3512693, turing );</code></pre>

##### Attack/Raid
Conquer your enemies!
<pre><code>koc.attackOrRaid( 'attack', 3512693 );</code></pre>
Note: If you have the turing given by `koc.getFullStats()` or `koc.getQuickStats()` prior to spy, you can specify it:
<pre><code>koc.attackOrRaid( 'raid', 3512693, turing );</code></pre>

Shortcuts exist (also with optional `turing`):
<pre><code>koc.attack( 3512693 );
koc.raid( 3512693 );</code></pre>

##### Sab
TODO! Please contribute :)
