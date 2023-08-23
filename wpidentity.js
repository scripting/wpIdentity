var myProductName = "wpidentity", myVersion = "0.4.0";

const fs = require ("fs");
const utils = require ("daveutils"); 
const request = require ("request");
const davehttp = require ("davehttp");

var config = { 
	port: process.env.PORT || 1408,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true, //for davehttp
	
	myRandomNumber: utils.random (1, 1000000000),
	urlMyHomePage: "http://scripting.com/code/wpidentity/client/",
	
	urlRequestToken: "https://public-api.wordpress.com/oauth2/token",
	urlAuthorize: "https://public-api.wordpress.com/oauth2/authorize",
	urlAuthenticate: "https://public-api.wordpress.com/oauth2/authenticate",
	urlRedirect: "http://localhost:1408/callbackFromWordpress"
	};

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
function connectWithWordpress (callback) {
	var params = {
		response_type: "code",
		client_id: config.clientId,
		state: config.myRandomNumber,
		redirect_uri: config.urlRedirect
		};
	var apiUrl = config.urlAuthenticate + "?" + utils.buildParamList (params);
	request (apiUrl, function (err, response, body) {
		if (err) {
			console.log ("connectWithWordpress: err.message == " + err.message);
			callback (err);
			}
		else {
			callback (undefined, body);
			}
		});
	}
function requestTokenFromWordpress (theCode, callback) {
	var params = {
		client_id: config.clientId,
		client_secret: config.clientSecret,
		redirect_uri: config.urlRedirect,
		code: theCode,
		grant_type: "authorization_code",
		};
	var theRequest = {
		method: "POST",
		url: config.urlRequestToken + "?" + utils.buildParamList (params),
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
	switch (theRequest.lowerpath) {
		case "/connect": 
			connectWithWordpress (returnHtml);
			return;
		case "/callbackfromwordpress":
			if (params.state != config.myRandomNumber) {
				const message = "Can't connect the user because the secret code doesn't match the one we sent.";
				returnError ({message});
				}
			else {
				requestTokenFromWordpress (params.code, function (err, tokenData) {
					if (err) {
						console.log ("requestTokenFromWordpress: err.message == " + err.message);
						returnError (err);
						}
					else {
						console.log ("tokenData == " + utils.jsonStringify (tokenData));
						const urlRedirect = config.urlMyHomePage + "?accesstoken=" + encodeURIComponent (tokenData.access_token);
						console.log ("urlRedirect == " + urlRedirect);
						returnRedirect (urlRedirect);
						}
					});
				}
			return;
		case "/now":
			theRequest.httpReturn (200, "text/plain", new Date ().toUTCString ());
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
