var myProductName = "wpidentity", myVersion = "0.4.1";

const fs = require ("fs");
const utils = require ("daveutils"); 
const request = require ("request");
const davehttp = require ("davehttp");
const wpcom = require ("wpcom"); //8/26/23 by DW

var config = { 
	port: process.env.PORT || 1408,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true, //for davehttp
	
	myRandomNumber: utils.random (1, 1000000000),
	urlMyHomePage: "http://scripting.com/code/wpidentity/client/",
	
	urlRequestToken: "https://public-api.wordpress.com/oauth2/token",
	urlAuthorize: "https://public-api.wordpress.com/oauth2/authorize",
	urlAuthenticate: "https://public-api.wordpress.com/oauth2/authenticate",
	urlRedirect: "http://localhost:1408/callbackFromWordpress",
	
	scope: "global" //default -- 8/27/23 by DW
	};

function base64UrlEncode (theData) {
	var base64 = Buffer.from (theData).toString ('base64');
	return (base64.replace ('+', '-').replace ('/', '_').replace (/=+$/, ''));
	}
function base64UrlDecode (theData) {
	theData = theData.replace ('-', '+').replace ('_', '/');
	while (theData.length % 4) {
		theData += '=';
		}
	return (Buffer.from (theData, 'base64').toString ('utf-8'));
	}

function readConfig (f, config, callback) {
	fs.readFile (f, function (err, jsontext) {
		if (!err) {
			try {
				var jstruct = JSON.parse (jsontext);
				for (var x in jstruct) {
					config [x] = jstruct [x];
					}
				}
			catch (err) {
				console.log ("Error reading " + f);
				}
			}
		callback ();
		});
	}

function getWordpressAuthorizeUrl (urlAppHomePage=config.urlMyHomePage) {
	function getState () { //9/4/23 by DW
		const state = {
			url: urlAppHomePage,
			num: config.myRandomNumber
			};
		const jsontext = JSON.stringify (state);
		return (jsontext);
		}
	var params = {
		client_id: config.clientId,
		redirect_uri: config.urlRedirect,
		response_type: "code",
		scope: config.scope,
		state: getState (), //9/4/23 by DW
		};
	const url = config.urlAuthorize + "?" + utils.buildParamList (params);
	return (url);
	}
function requestTokenFromWordpress (theCode, callback) {
	var theRequest = {
		method: "POST",
		url: config.urlRequestToken,
		form: {
			client_id: config.clientId,
			client_secret: config.clientSecret,
			redirect_uri: config.urlRedirect,
			code: theCode,
			grant_type: "authorization_code"
			}
		};
	request (theRequest, function (err, response, body) {
		if (err) {
			callback (err);
			}
		else {
			try {
				const data = JSON.parse (body);
				callback (undefined, data);
				}
			catch (err) {
				callback (err);
				}
			}
		});
	}

function getUserInfo (accessToken, callback) { //8/26/23 by DW
	console.log ("getUserInfo: accessToken == " + accessToken);
	const wp = wpcom (accessToken);
	wp.me ().get (callback);
	}
function getUserSites (accessToken, callback) { //8/26/23 by DW
	console.log ("getUserSites: accessToken == " + accessToken);
	const wp = wpcom (accessToken);
	wp.me ().sites (callback);
	}
function getSitePosts (accessToken, idSite, callback) { //8/28/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.postsList (callback);
	}
function getSiteUsers (accessToken, idSite, callback) { //8/28/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.usersList (callback);
	}
function getSiteInfo (accessToken, idSite, callback) { //8/29/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.get (callback);
	}
function getSiteMedialist (accessToken, idSite, callback) { //8/29/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.mediaList (callback);
	}
function getObjectFromJsontext (jsontext, callback) {
	var theObject;
	try {
		theObject = JSON.parse (jsontext);
		}
	catch (err) {
		const message = "Can't add or update the post because the JSON text is not valid.";
		callback ({message});
		return (undefined);
		}
	return (theObject);
	}
function addPost (accessToken, idSite, jsontext, callback) { //8/29/23 by DW
	
	const thePost = getObjectFromJsontext (jsontext, callback);
	if (thePost === undefined) {
		return;
		}
	
	
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.addPost (thePost, callback);
	}
function getPost (accessToken, idSite, idPost, callback) { //8/28/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	post.get (callback);
	}
function updatePost (accessToken, idSite, idPost, jsontext, callback) { //8/29/23 by DW
	const thePost = getObjectFromJsontext (jsontext, callback);
	if (thePost === undefined) {
		return;
		}
	
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	post.update (thePost, callback);
	}
function deletePost (accessToken, idSite, idPost, callback) { //9/4/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	post.delete (callback);
	}
function getSubscriptions (accessToken, callback) { //9/5/23 by DW
	const wp = wpcom (accessToken);
	wp.req.get ("/read/following/mine", {}, callback);
	}

function handleHttpRequest (theRequest) {
	const params = theRequest.params;
	function returnRedirect (url, code) { //9/30/20 by DW
		var headers = {
			location: url
			};
		if (code === undefined) {
			code = 302;
			}
		theRequest.httpReturn (code, "text/plain", code + " REDIRECT", headers);
		}
		
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnError (err) {
		theRequest.httpReturn (503, "text/plain", err.message);
		}
	function returnData (jstruct) {
		theRequest.httpReturn (200, "application/javascript", utils.jsonStringify (jstruct));
		}
	function httpReturn (err, data) {
		if (err) {
			returnError (err);
			}
		else {
			returnData (data);
			}
		}
	function returnHtml (err, htmltext) {
		if (err) {
			returnError (err);
			}
		else {
			theRequest.httpReturn (200, "text/html", htmltext);
			}
		}
	function tokenRequired (callback) {
		const token = (params.token === undefined) ? undefined : base64UrlDecode (params.token);
		if (token === undefined) {
			const message = "Can't get the info because the user must be logged in.";
			returnError ({message});
			}
		else {
			callback (token);
			}
		}
	function unpackState (jsontext) { //9/4/23 by DW
		var jstruct;
		try {
			jstruct = JSON.parse (jsontext);
			return (jstruct);
			}
		catch (err) {
			console.log ("unpackState: Error parsing JSON text for state record. jsontext == " + jsontext);
			return (undefined);
			}
		}
	switch (theRequest.lowerpath) {
		case "/now":
			theRequest.httpReturn (200, "text/plain", new Date ().toUTCString ());
			return;
		case "/connect": 
			returnRedirect (getWordpressAuthorizeUrl (params.urlapphomepage));
			return;
		case "/callbackfromwordpress":
			const state = unpackState (params.state);
			if (state === undefined) {
				const message = "Can't connect the user because there was an error in the state returned from the server.";
				returnError ({message});
				}
			else {
				if (state.num != config.myRandomNumber) {
					const message = "Can't connect the user because the secret code doesn't match the one we sent.";
					returnError ({message});
					}
				else {
					const urlAppHomePage = (state.url === undefined) ? config.urlMyHomePage : state.url; //9/4/23 by DW
					requestTokenFromWordpress (params.code, function (err, tokenData) {
						if (err) {
							console.log ("requestTokenFromWordpress: err.message == " + err.message);
							returnError (err);
							}
						else {
							const urlRedirect = urlAppHomePage + "?accesstoken=" + base64UrlEncode (tokenData.access_token);
							returnRedirect (urlRedirect);
							}
						});
					}
				}
			
			
			return;
		case "/getuserinfo": //8/26/23 by DW
			tokenRequired (function (token) {
				getUserInfo (token, httpReturn);
				});
			return;
		case "/getusersites": //8/26/23 by DW
			tokenRequired (function (token) {
				getUserSites (token, httpReturn);
				});
			return;
		case "/getsiteposts": //8/28/23 by DW
			tokenRequired (function (token) {
				getSitePosts (token, params.idsite, httpReturn);
				});
			return;
		case "/getsiteusers": //8/28/23 by DW
			tokenRequired (function (token) {
				getSiteUsers (token, params.idsite, httpReturn);
				});
			return;
		case "/getsiteinfo": //8/29/23 by DW
			tokenRequired (function (token) {
				getSiteInfo (token, params.idsite, httpReturn);
				});
			return;
		case "/getsitemedialist": //8/29/23 by DW
			tokenRequired (function (token) {
				getSiteMedialist (token, params.idsite, httpReturn);
				});
			return;
		case "/getpost": //8/28/23 by DW
			tokenRequired (function (token) {
				getPost (token, params.idsite, params.idpost, httpReturn);
				});
			return;
		case "/addpost": //8/29/23 by DW
			tokenRequired (function (token) {
				addPost (token, params.idsite, params.jsontext, httpReturn);
				});
			return;
		case "/updatepost": //8/29/23 by DW
			tokenRequired (function (token) {
				updatePost (token, params.idsite, params.idpost, params.jsontext, httpReturn);
				});
			return;
		case "/deletepost": //9/4/23 by DW
			tokenRequired (function (token) {
				deletePost (token, params.idsite, params.idpost, httpReturn);
				});
			return;
		case "/getsubscriptions": //9/5/23 by DW
			tokenRequired (function (token) {
				getSubscriptions (token, httpReturn);
				});
			return;
		default:
			theRequest.httpReturn (404, "text/plain", "Not found.");
			return;
		}
	}

readConfig ("config.json", config, function ()  {
	console.log ("config == " + utils.jsonStringify (config));
	davehttp.start (config, handleHttpRequest);
	});
