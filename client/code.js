const flUseLocalServer = false;

var myWordpress;

var appPrefs = {
	ctMinutesRunning: 0,
	whenLastMinute: new Date (0), 
	localTime: "",
	currentSlogan: ""
	};
const fnamePrefs = "demo/prefs.json";
var flPrefsChanged = false;

function logOffWordpress () {
	confirmDialog ("Log off WordPress.com?", function () {
		myWordpress.logOffWordpress ();
		});
	}

function addToolTip (theObject, tipText, placement="right") { //8/24/22 by DW
	$(theObject).attr ("data-container", "body"); //10/23/22 by DW
	$(theObject).attr ("data-toggle", "tooltip");
	$(theObject).attr ("data-placement", placement);
	$(theObject).attr ("title", tipText);
	$(theObject).click (function () { //11/1/22 by DW
		$(theObject).tooltip ("hide");
		});
	return (theObject);
	}
function activateToolTips () { //8/28/22 by DW
	$("[data-toggle=\"tooltip\"]").tooltip ();
	}
function getFeedlandTimeString (when, flLongStrings=false) {
	const options = {
		flBriefYearDates: true,
		nowString: "now"
		};
	var s = getFacebookTimeString (when, flLongStrings, options);
	return (s);
	}
function userInteracted () { //5/17/21 by DW
	}

function prefsChanged () {
	flPrefsChanged = true;
	}
function readPrefs (callback) {
	const whenstart = new Date ();
	myWordpress.readUserDataFile (fnamePrefs, true, function (err, theSavedPrefs) {
		if (err) {
			}
		else {
			var thePrefs = new Object (), flJsonError = false;
			try {
				thePrefs = JSON.parse (theSavedPrefs.filecontents);
				}
			catch (err) {
				console.log ("readPrefs: err.message == " + err.message);
				flJsonError = true;
				}
			if (!flJsonError) {
				for (var x in thePrefs) {
					appPrefs [x] = thePrefs [x];
					}
				}
			console.log ("readPrefs: " + secondsSince (whenstart) + " secs");
			}
		if (callback !== undefined) {
			callback (err, theSavedPrefs);
			}
		});
	}
function savePrefs (callback) {
	const jsontext = jsonStringify (appPrefs), whenstart = new Date ();
	myWordpress.writeUniqueFile (fnamePrefs, jsontext, "application/json", true, function (err, data) {
		if (err) {
			console.log ("savePrefs: err.message == " +  err.message);
			}
		else {
			console.log ("savePrefs: " + secondsSince (whenstart) + " secs");
			}
		if (callback !== undefined) {
			callback (err, data);
			}
		});
	}

function sortSiteList (theSites, sortBy="name", flReverseSort=false) {
	theSites.sort (function (a, b) {
		switch (sortBy) {
			case "name":
				var alower = a.name.toLowerCase (), val;
				var blower = b.name.toLowerCase ();
				if (flReverseSort) { //7/11/22 by DW
					let tmp = alower;
					alower = blower;
					blower = tmp;
					}
				if (alower.length == 0) {
					return (1);
					}
				if (blower.length == 0) {
					return (-1);
					}
				if (alower == blower) {
					val = 0;
					}
				else {
					if (blower > alower) {
						val = -1;
						}
					else {
						val = 1;
						}
					}
				return (val);
			}
		});
	}
function viewSitelist (whereToAppend) {
	console.log ("viewSitelist");
	var options = {
		sortBy: "name",
		flReverseSort: false
		}
	function getRow (item) {
		const theRow = $("<tr></tr>");
		function getSiteName () {
			const theCell = $("<td></td>");
			const shortenedname = maxStringLength (item.name, 25, true, true);
			const theName = $("<span class=\"spSitename\">" + shortenedname + "</span>");
			addToolTip (theName, item.description);
			theCell.append (theName);
			return (theCell);
			}
		function getDateValue (when, meaning) {
			const theCell = $("<td></td>");
			const whenstring = getFeedlandTimeString (when);
			const theDate = $("<span class=\"spSitedate\">" + whenstring + "</span>");
			addToolTip (theDate, "When the site was " + meaning + ".");
			theCell.append (theDate);
			return (theCell);
			}
		theRow.append (getSiteName ());
		theRow.append (getDateValue (item.whenCreated, "created"));
		return (theRow);
		}
	if (whereToAppend === undefined) {
		whereToAppend = $(".divSitelistContainer");
		}
	
	
	myWordpress.getUserSites (function (err, theList) {
		if (err) {
			alertDialog (err.message);
			}
		else {
			function sortTheList () {
				theList.sites.sort (function (a, b) {
					switch (options.sortBy) {
						case "name":
							var alower = a.name.toLowerCase (), val;
							var blower = b.name.toLowerCase ();
							if (options.flReverseSort) { //7/11/22 by DW
								let tmp = alower;
								alower = blower;
								blower = tmp;
								}
							if (alower.length == 0) {
								return (1);
								}
							if (blower.length == 0) {
								return (-1);
								}
							if (alower == blower) {
								val = 0;
								}
							else {
								if (blower > alower) {
									val = -1;
									}
								else {
									val = 1;
									}
								}
							return (val);
						}
					});
				}
			const divSitelist = $("<div class=\"divSitelist\"></div>");
			sortSiteList (theList, options.sortBy, options.flReverseSort);
			theList.forEach (function (item) {
				divSitelist.append (getRow (item));
				});
			whereToAppend.append (divSitelist);
			activateToolTips ();
			}
		});
	
	
	}
function reloadSitelist (callback) { //9/3/23 by DW
	$(".divSitelistContainer").empty ();
	viewSitelist ();
	}

function viewUserInfo (callback) { //9/3/23 by DW
	myWordpress.getUserInfo (function (err, theUserInfo) {
		if (err) {
			alertDialog (err.message);
			}
		else {
			console.log ("viewUserInfo: theUserInfo == " + jsonStringify (theUserInfo));
			var htmltext = "";
			function addLine (label, value) {
				htmltext += "<p>" + label + " = " + value + ".</p>";
				}
			addLine ("Username", theUserInfo.username);
			addLine ("Human name", theUserInfo.name);
			addLine ("User since", new Date (theUserInfo.whenStarted).toLocaleString ());
			alertDialog (htmltext);
			if (callback !== undefined) {
				callback ();
				}
			}
		});
	}
function userIsSignedIn () {
	return (myWordpress.userIsSignedIn ());
	}
function updateForLogin (flConnected=userIsSignedIn ()) {
	var idActive, idOther;
	if (flConnected) {
		idActive = "#idSignedOn";
		idOther = "#idSignedOff";
		}
	else {
		idActive = "#idSignedOff";
		idOther = "#idSignedOn";
		}
	if ($(idActive).css ("display") != "block") {
		$(idActive).css ("display", "block")
		}
	if ($(idOther).css ("display") != "none") {
		$(idOther).css ("display", "none")
		}
	}

function startTestPrefs () { //4/13/24 by DW
	var ct = 0, maxMinutes = 5;
	function testOnce () {
		appPrefs.ctMinutesRunning++;
		appPrefs.whenLastMinute = new Date ();
		appPrefs.currentSlogan = getRandomSnarkySlogan ();
		appPrefs.localTime= new Date ().toLocaleString ();
		prefsChanged ();
		console.log ("testPrefs: appPrefs == " + jsonStringify (appPrefs));
		}
	function everyMinute () {
		if (ct++ < maxMinutes) {
			testOnce ();
			}
		}
	testOnce (); 
	runEveryMinute (everyMinute);
	}

function everySecond () {
	updateForLogin ();
	if (flPrefsChanged) { //4/12/24 by DW
		flPrefsChanged = false;
		savePrefs ();
		}
	}
function startup () {
	console.log ("startup");
	const wpOptions = {
		serverAddress: (flUseLocalServer) ? "http://localhost:1408/" : "https://wpidentity.scripting.com/",
		urlChatLogSocket: (flUseLocalServer) ? "ws://localhost:1408/" : "wss://wpidentity.scripting.com/",
		flWebsocketEnabled: true
		}
	myWordpress = new wordpress (wpOptions);
	myWordpress.startup (function (err) {
		if (err) {
			alertDialog ("Can't run the app because there was an error starting up.");
			}
		else {
			updateForLogin (); 
			if (userIsSignedIn ()) {
				readPrefs (function () { //4/12/24 by DW
					viewSitelist ();
					self.setInterval (everySecond, 1000); 
					startTestPrefs (); //12/23/24 by DW
					});
				}
			}
		});
	}
