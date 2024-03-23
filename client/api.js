//9/4/23 by DW -- This code can be used in client apps to talk to a server.

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
function wpServerCall (path, params, flAuthenticated, callback, urlServer=getServerAddress ()) {
	const whenstart = new Date ();
	var headers = undefined;
	if (params === undefined) {
		params = new Object ();
		}
	if (flAuthenticated) {
		params.token = base64UrlEncode (wordpressMemory.accessToken);
		}
	var url = urlServer + path + "?" + buildParamList (params, false);
	console.log ("wpServerCall: url == " + url);
	httpRequest (url, undefined, headers, function (err, jsontext) {
		if (err) {
			console.log ("wpServerCall: url == " + url + ", err.message == " + err.message);
			callback (err);
			}
		else {
			callback (undefined, JSON.parse (jsontext));
			}
		});
	}
function getUserInfo (callback) { //8/26/23 by DW
	wpServerCall ("wordpressgetuserinfo", undefined, true, callback);
	}
function getUserSites (callback) { //8/26/23 by DW
	wpServerCall ("wordpressgetusersites", undefined, true, callback);
	}
function getSitePosts (idsite, callback) { //8/28/23 by DW
	wpServerCall ("wordpressgetsiteposts", {idsite}, true, callback);
	}
function getSiteUsers (idsite, callback) { //8/28/23 by DW
	wpServerCall ("wordpressgetsiteusers", {idsite}, true, callback);
	}
function getSiteInfo (idsite, callback) { //8/29/23 by DW
	wpServerCall ("wordpressgetsiteinfo", {idsite}, true, callback);
	}
function getSiteMedialist (idsite, callback) { //8/29/23 by DW
	wpServerCall ("wordpressgetsitemedialist", {idsite}, true, callback);
	}
function getPost (idsite, idpost, callback) { //8/28/23 by DW
	wpServerCall ("wordpressgetpost", {idsite, idpost}, true, callback);
	}
function addPost (idsite, thepost, callback) { //8/29/23 by DW
	const jsontext = JSON.stringify (thepost);
	wpServerCall ("wordpressaddpost", {idsite, jsontext}, true, callback);
	}
function updatePost (idsite, idpost, thepost, callback) { //8/29/23 by DW
	const jsontext = JSON.stringify (thepost);
	wpServerCall ("wordpressupdatepost", {idsite, idpost, jsontext}, true, callback);
	}
function deletePost (idsite, idpost, callback) { //9/4/23 by DW
	wpServerCall ("wordpressdeletepost", {idsite, idpost}, true, callback);
	}
function getSubscriptions (callback) { //9/5/23 by DW
	wpServerCall ("wordpressgetsubscriptions", undefined, true, callback);
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
function testAddPost (idsite) {
	function getRandomContent () {
		var theContent = "";
		for (var i = 1; i <= 10; i++) {
			theContent += getRandomSnarkySlogan () + "\n";
			}
		return (theContent);
		}
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
function testDeletePost (idsite, idpost) {
	deletePost (idsite, idpost, function (err, data) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (data));
			}
		});
	}
function testGetSubscriptions () {
	getSubscriptions (function (err, data) {
		if (err) {
			console.log (err.message);
			}
		else {
			console.log (jsonStringify (data));
			}
		});
	}
