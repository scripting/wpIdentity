
var wordpressMemory = {
	accessToken: undefined
	};

function getServerAddress () {
	return ("https://wpidentity.scripting.com/");
	}

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

function userIsLoggedIn () {
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
function startup () {
	console.log ("startup");
	
	const accessToken = getURLParameter ("accesstoken");
	
	if (accessToken != "null") {
		wordpressMemory.accessToken = base64UrlDecode (accessToken);
		localStorage.wordpressMemory = jsonStringify (wordpressMemory);
		const newHref = stringNthField (location.href, "?", 1);
		location.href = newHref;
		}
	
	if (localStorage.wordpressMemory !== undefined) {
		wordpressMemory = JSON.parse (localStorage.wordpressMemory);
		}
	
	console.log ("wordpressMemory == " + jsonStringify (wordpressMemory));
	
	if (userIsLoggedIn ()) {
		$(".divLogonButton").css ("display", "none");
		$(".divLoggedInMessage").css ("display", "block");
		}
	else {
		$(".divLogonButton").css ("display", "block");
		$(".divLoggedInMessage").css ("display", "none");
		}
	
	}
