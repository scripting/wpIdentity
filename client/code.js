const flUseLocalServer = false;

var wordpressMemory = {
	accessToken: undefined,
	sitelist: undefined
	};

function saveWordpressmemory () {
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
//api glue
	function base64UrlEncode (data) {
		let base64 = btoa (unescape (encodeURIComponent (data)));
		return base64.replace ('+', '-').replace ('/', '_').replace (/=+$/, '');
		}
	function base64UrlDecode (theData) {
		theData = theData.replace ('-', '+').replace ('_', '/');
		while (theData.length % 4) {
			theData += '=';
			}
		return (decodeURIComponent (escape (atob (theData))));
		}
	function httpRequest (url, timeout, headers, callback) { 
		timeout = (timeout === undefined) ? 30000 : timeout;
		var jxhr = $.ajax ({ 
			url: url,
			dataType: "text", 
			headers,
			timeout
			}) 
		.success (function (data, status) { 
			callback (undefined, data);
			}) 
		.error (function (status) { 
			var message;
			try { //9/18/21 by DW
				message = JSON.parse (status.responseText).message;
				}
			catch (err) {
				message = status.responseText;
				}
			if ((message === undefined) || (message.length == 0)) { //7/22/22 by DW & 8/31/22 by DW
				message = "There was an error communicating with the server.";
				}
			var err = {
				code: status.status,
				message
				};
			callback (err);
			});
		}
	function servercall (path, params, flAuthenticated, callback, urlServer=getServerAddress ()) {
		const whenstart = new Date ();
		var headers = undefined;
		if (params === undefined) {
			params = new Object ();
			}
		if (flAuthenticated) {
			params.token = base64UrlEncode (wordpressMemory.accessToken);
			}
		var url = urlServer + path + "?" + buildParamList (params, false);
		console.log ("servercall: url == " + url);
		httpRequest (url, undefined, headers, function (err, jsontext) {
			if (err) {
				console.log ("servercall: url == " + url + ", err.message == " + err.message);
				callback (err);
				}
			else {
				callback (undefined, JSON.parse (jsontext));
				}
			});
		}
	function getUserInfo (callback) { //8/26/23 by DW
		servercall ("getuserinfo", undefined, true, callback);
		}
	function getUserSites (callback) { //8/26/23 by DW
		servercall ("getusersites", undefined, true, callback);
		}
	function getSitePosts (idsite, callback) { //8/28/23 by DW
		servercall ("getsiteposts", {idsite}, true, callback);
		}
	function getSiteUsers (idsite, callback) { //8/28/23 by DW
		servercall ("getsiteusers", {idsite}, true, callback);
		}
	function getPost (idsite, idpost, callback) { //8/28/23 by DW
		servercall ("getpost", {idsite, idpost}, true, callback);
		}
	function getSiteInfo (idsite, callback) { //8/29/23 by DW
		servercall ("getsiteinfo", {idsite}, true, callback);
		}
	function getSiteMedialist (idsite, callback) { //8/29/23 by DW
		servercall ("getsitemedialist", {idsite}, true, callback);
		}
	function addPost (idsite, thepost, callback) { //8/29/23 by DW
		const jsontext = JSON.stringify (thepost);
		servercall ("addpost", {idsite, jsontext}, true, callback);
		}
	function updatePost (idsite, idpost, thepost, callback) { //8/29/23 by DW
		const jsontext = JSON.stringify (thepost);
		servercall ("updatepost", {idsite, idpost, jsontext}, true, callback);
		}
	function testGetUserInfo () {
		getUserInfo (function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetUserSites () {
		getUserSites (function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetSitePosts (idsite) {
		getSitePosts (idsite, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetSiteUsers (idsite) {
		getSiteUsers (idsite, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetPost (idsite, idpost) {
		getPost (idsite, idpost, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetSiteInfo (idsite, idpost) {
		getSiteInfo (idsite, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testGetSiteMedialist (idsite, idpost) {
		getSiteMedialist (idsite, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function getRandomContent () {
		var theContent = "";
		for (var i = 1; i <= 10; i++) {
			theContent += getRandomSnarkySlogan () + "\n";
			}
		return (theContent);
		}
	function testAddPost (idsite) {
		const thePost = {
			title: "Some random snarky slogans",
			content: getRandomContent (),
			status: "publish",
			date: new Date ().toGMTString (),
			format: "standard",
			categories: ["Testing", "Nonsense", "Snark", "Slogans"],
			comment_status: "open"
			};
		addPost (idsite, thePost, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		}
	function testUpdatePost (idsite, idpost) {
		const thePost = {
			content: getRandomContent (),
			status: "publish",
			};
		updatePost (idsite, idpost, thePost, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
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
			sortTheList ();
			theList.sites.forEach (function (item) {
				divSitelist.append (getRow (item));
				});
			whereToAppend.append (divSitelist);
			}
		});
	}


var appPrefs = { //needed for the outline routines
	};

function viewSitelistAsOutline (urlOpml, callback) {
	var whenstart = new Date ();
	opInitOutliner (initialOpmltext, true, true);
	getSitelist (function (err, theList) {
		if (err) {
			alertDialog (err.message);
			}
		else {
			theList.sites.forEach (function (item) {
				opInsert (item.name, down);
				opSetOneAtt ("type", "wpsite");
				opSetOneAtt ("icon", "wordpress-simple");
				});
			opFirstSummit ();
			opDeleteLine ();
			$(".node-icon").removeClass ("far")
			$(".node-icon").addClass ("fab")
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
	wordpressMemory.accessToken = undefined;
	localStorage.wordpressMemory = jsonStringify (wordpressMemory);
	location.href = location.href;
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
		viewSitelistAsOutline ("http://scripting.com/code/sallyreader/hellosally.opml");
		
		activateToolTips ();
		}
	
	self.setInterval (everySecond, 1000); 
	}
