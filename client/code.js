const flUseLocalServer = false;

var wordpressMemory = {
	accessToken: undefined,
	sitelist: undefined
	};

var whenLastUserAction = new Date ();

function saveWordpressmemory () {
	console.log ("saveWordpressmemory");
	localStorage.wordpressMemory = jsonStringify (wordpressMemory);
	}
function getServerAddress () {
	if (flUseLocalServer) {
		return ("http://localhost:1408/");
		}
	else {
		return ("https://wpidentity.scripting.com/");
		}
	}

//misc
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
		whenLastUserAction = new Date ();
		}
	function decodeHtmlEntities (htmltext) {
		var textarea = document.createElement ("textarea");
		textarea.innerHTML = htmltext;
		return (textarea.value);
		}

function getSitelist (callback) {
	if (wordpressMemory.sitelist === undefined) {
		getUserSites (function (err, theSitelist) {
			if (err) {
				callback (err);
				}
			else {
				wordpressMemory.sitelist = theSitelist;
				saveWordpressmemory ();
				callback (undefined, theSitelist);
				}
			});
		}
	else {
		callback (undefined, wordpressMemory.sitelist);
		}
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
		theRow.append (getDateValue (item.options.created_at, "created"));
		theRow.append (getDateValue (item.options.updated_at, "last updated"));
		return (theRow);
		}
	console.log ("viewSitelist");
	if (whereToAppend === undefined) {
		whereToAppend = $(".divSitelistContainer");
		}
	getSitelist (function (err, theList) {
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
		if (err) {
			alertDialog (err.message);
			}
		else {
			const divSitelist = $("<div class=\"divSitelist\"></div>");
			sortSiteList (theList.sites, options.sortBy, options.flReverseSort);
			theList.sites.forEach (function (item) {
				divSitelist.append (getRow (item));
				});
			whereToAppend.append (divSitelist);
			}
		});
	}

function reloadSitelist (callback) { //9/3/23 by DW
	$(".divSitelistContainer").empty ();
	wordpressMemory.sitelist = undefined;
	viewSitelist ();
	}

function viewUserInfo (callback) { //9/3/23 by DW
	getUserInfo (function (err, theUserInfo) {
		if (err) {
			alertDialog (err.message);
			}
		else {
			var htmltext = "";
			function addLine (label, value) {
				htmltext += "<p>" + label + " = " + value + ".</p>";
				}
			addLine ("Username", theUserInfo.username);
			addLine ("Human name", theUserInfo.display_name);
			addLine ("User since", new Date (theUserInfo.date).toLocaleString ());
			alertDialog (htmltext);
			if (callback !== undefined) {
				callback ();
				}
			}
		});
	}
function userIsSignedIn () {
	return (wordpressMemory.accessToken !== undefined);
	}
function connectWithWordpress () {
	location.href = "https://wpidentity.scripting.com/connect";
	}
function logOffWordpress () {
	confirmDialog ("Log off WordPress.com?", function () {
		wordpressMemory.accessToken = undefined;
		delete localStorage.wordpressMemory;
		location.href = location.href;
		});
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
function everySecond () {
	updateForLogin ();
	}
function startup () {
	console.log ("startup");
	const accessToken = getURLParameter ("accesstoken");
	if (accessToken != "null") {
		wordpressMemory.accessToken = base64UrlDecode (accessToken);
		saveWordpressmemory ();
		const newHref = stringNthField (location.href, "?", 1);
		location.href = newHref;
		}
	if (localStorage.wordpressMemory !== undefined) {
		wordpressMemory = JSON.parse (localStorage.wordpressMemory);
		}
	
	updateForLogin ();
	if (userIsSignedIn ()) {
		viewSitelist ();
		activateToolTips ();
		self.setInterval (everySecond, 1000); 
		}
	
	}
