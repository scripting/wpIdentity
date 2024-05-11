var myProductName = "wpidentity", myVersion = "0.5.1";

exports.start = start; 
exports.handleHttpRequest = handleHttpRequest; 
exports.getUserInfo = getUserInfo; //3/23/24 by DW

const fs = require ("fs");
const utils = require ("daveutils"); 
const request = require ("request");
const davehttp = require ("davehttp");
const wpcom = require ("wpcom"); //8/26/23 by DW
const davesql = require ("davesql"); //3/24/24 by DW
const emoji = require ("node-emoji");  //4/15/24 by DW
const marked = require ("marked");  //4/18/24 by DW
const rss = require ("daverss"); //4/29/24 by DW

var config = { 
	myRandomNumber: utils.random (1, 1000000000),
	urlMyHomePage: "http://scripting.com/code/wpidentity/client/",
	
	urlRequestToken: "https://public-api.wordpress.com/oauth2/token",
	urlAuthorize: "https://public-api.wordpress.com/oauth2/authorize",
	urlAuthenticate: "https://public-api.wordpress.com/oauth2/authenticate",
	urlRedirect: "http://localhost:1408/callbackFromWordpress",
	
	scope: "global", //default -- 8/27/23 by DW
	
	mysqlVersion: undefined, //3/24/24 by DW
	flStorageEnabled: false, //3/24/24 by DW
	
	ctUsernameCacheSecs: 60, //3/25/24 by DW
	maxCtDrafts: 100, //4/27/24 by DW
	
	
	flServePublicUserFiles: false //4/30/24 by DW
	};

var usernameCache = new Object ();
var whenLastUsernameCacheStart = new Date ();

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
function convertDate (theDate) {
	if (theDate === undefined) {
		return (undefined);
		}
	else {
		const d = new Date (theDate);
		if (isNaN (d)) {
			return (undefined);
			}
		return (d);
		}
	}
function convertString (theString) {
	if (theString === undefined) {
		return (undefined);
		}
	if (theString.length == 0) {
		return (undefined);
		}
	else {
		return (s);
		}
	}
function convertPost (item) { //convert a post received from WordPress to the struct defined by our API -- 9/12/23 by DW
	function getCatArray () {
		var catarray = new Array ();
		for (var x in item.categories) {
			catarray.push (x);
			}
		return (catarray);
		}
	function getCatstring () {
		var catstring = "";
		for (var x in item.categories) {
			catstring += "," + x;
			}
		if (catstring.length > 0) {
			catstring = utils.stringDelete (catstring, 1, 1);
			}
		return (catstring);
		}
	return ({
		idPost: item.ID,
		idSite: item.site_ID,
		title: item.title,
		guid: item.guid,
		content: item.content,
		type: item.type,
		categories: getCatArray (),
		url: item.URL,
		urlShort: item.short_URL,
		whenCreated: convertDate (item.date),
		author: {
			id: item.author.ID,
			username: item.author.login,
			name: item.author.name
			}
		});
	}
function convertUser (theUser) {
	return ({
		idUser: theUser.ID,
		name: theUser.display_name,
		username: theUser.username,
		email: theUser.email,
		idPrimaryBlog: theUser.primary_blog,
		urlPrimaryBlog: theUser.primary_blog_url,
		whenStarted: convertDate (theUser.date),
		ctSites: theUser.site_count
		});
	}
function convertSite (theSite) {
	return ({
		idSite: theSite.ID,
		urlSite: theSite.URL,
		description: theSite.description,
		name: theSite.name,
		whenCreated: convertDate (theSite.options.created_at),
		ctPosts: theSite.options.post_count
		});
	}
function convertSubscription (theSubscription) {
	return ({
		id: theSubscription.ID,
		idWpBlog: (theSubscription.blog_ID == "0") ? undefined : theSubscription.blog_ID,
		feedUrl: theSubscription.URL, 
		whenSubscribed: convertDate (theSubscription.date_subscribed)
		});
	}
function convertMediaObject (theObject) {
	return ({
		id: theObject.ID,
		url: theObject.URL,
		whenCreated: theObject.date,
		idPost: theObject.post_ID,
		idAuthor: theObject.author_ID,
		type: theObject.mime_type,
		title: theObject.title,
		description: convertString (theObject.description),
		alt: convertString (theObject.alt),
		height: theObject.height,
		width: theObject.width
		});
	}
function getUserInfo (accessToken, callback) { //8/26/23 by DW
	const wp = wpcom (accessToken);
	wp.me ().get (function (err, theInfo) {
		if (err) {
			callback (err);
			}
		else {
			callback (undefined, convertUser (theInfo));
			}
		});
	}
function getUserSites (accessToken, callback) { //8/26/23 by DW
	const wp = wpcom (accessToken);
	wp.me ().sites (function (err, theSiteList) {
		if (err) {
			callback (err);
			}
		else {
			var theList = new Array ();
			theSiteList.sites.forEach (function (item) {
				theList.push (convertSite (item));
				});
			callback (undefined, theList);
			}
		});
	}
function getSitePosts (accessToken, idSite, callback) { //9/12/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.postsList (function (err, thePosts) { //9/12/23 by DW
		if (err) {
			callback (err);
			}
		else {
			var theList = new Array ();
			thePosts.posts.forEach (function (item) {
				theList.push (convertPost (item));
				});
			callback (undefined, theList);
			}
		});
	}
function getSiteUsers (accessToken, idSite, callback) { //8/28/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.usersList (function (err, theUsers) {
		if (err) {
			callback (err);
			}
		else {
			var theList = new Array ();
			theUsers.users.forEach (function (item) {
				theList.push (convertUser (item));
				});
			callback (undefined, theList);
			}
		});
	}
function getSiteInfo (accessToken, idSite, callback) { //8/29/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.get (function (err, theInfo) {
		if (err) {
			callback (err);
			}
		else {
			callback (undefined, convertSite (theInfo));
			}
		});
	}
function getSiteMedialist (accessToken, idSite, callback) { //8/29/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	site.mediaList (function (err, theMedialist) {
		if (err) {
			callback (err);
			}
		else {
			var theList = new Array ();
			theMedialist.media.forEach (function (item) {
				theList.push (convertMediaObject (item));
				});
			callback (undefined, theList);
			}
		});
	}
function getPost (accessToken, idSite, idPost, callback) { //9/12/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	post.get (function (err, thePost) { //9/12/23 by DW
		if (err) {
			callback (err);
			}
		else {
			callback (undefined, convertPost (thePost));
			}
		});
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

function getSpecialDataFile (token, fname, callback) {
	getUsername (token, function (err, username) {
		if (err) {
			callback (err);
			}
		else {
			const flprivate = true;
			readUserFile (username, fname, flprivate, 0, 0, function (err, theFile) {
				if (err) {
					callback (err);
					}
				else {
					var flerror = false;
					try {
						theData = JSON.parse (theFile.filecontents);
						}
					catch (err) {
						callback (err);
						flerror = true;
						}
					if (!flerror) {
						callback (undefined, theData);
						}
					}
				});
			}
		});
	}
function emojiProcess (s) {
	function addSpan (code, name) {
		return ("<span class=\"spEmoji\">" + code + "</span>");
		}
	return (emoji.emojify (s, undefined, addSpan));
	}
function markdownProcess (s) {
	return (s);
	}
function processPostText (token, theText, callback) {
	theText = emojiProcess (theText); //4/15/24 by DW
	theText = markdownProcess (theText); //4/18/24 by DW
	getSpecialDataFile (token, "glossary.json", function (err, theGlossary) {
		if (err) {
			callback (err);
			}
		else {
			theText = utils.multipleReplaceAll (theText, theGlossary, false);
			callback (undefined, theText);
			}
		});
	}

function addPost (accessToken, idSite, jsontext, callback) { //8/29/23 by DW
	const jstruct = getObjectFromJsontext (jsontext, callback);
	if (jstruct === undefined) {
		return;
		}
	
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	
	const thePost = {
		title: jstruct.title,
		content: jstruct.content,
		status: "publish",
		date: new Date ().toGMTString (),
		format: "standard",
		comment_status: "open"
		};
	console.log ("addPost: thePost == " + utils.jsonStringify (thePost)); //5/8/24 by DW
	site.addPost (thePost, function (err, theNewPost) {
		if (err) {
			console.log ("addPost: err.message == " + err.message); //5/8/24 by DW
			callback (err);
			}
		else {
			console.log ("addPost: theNewPost == " + utils.jsonStringify (theNewPost)); //5/8/24 by DW
			callback (undefined, convertPost (theNewPost));
			}
		});
	}
function updatePost (accessToken, idSite, idPost, jsontext, callback) { //8/29/23 by DW
	const jstruct = getObjectFromJsontext (jsontext, callback);
	if (jstruct === undefined) {
		return;
		}
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	
	processPostText (accessToken, jstruct.content, function (err, theProcessedContent) {
		if (!err) {
			}
		const thePost = {
			title: jstruct.title,
			content: theProcessedContent,
			status: "publish"
			};
		post.update (thePost, function (err, theNewPost) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, convertPost (theNewPost));
				}
			});
		});
	}
function deletePost (accessToken, idSite, idPost, callback) { //9/4/23 by DW
	const wp = wpcom (accessToken);
	const site = wp.site (idSite);
	const post = site.post (idPost);
	post.delete (function (err, theDeletedPost) {
		if (err) {
			callback (err);
			}
		else {
			callback (undefined, convertPost (theDeletedPost));
			}
		});
	}
function getSubscriptions (accessToken, callback) { //9/5/23 by DW
	const wp = wpcom (accessToken);
	wp.req.get ("/read/following/mine", {}, function (err, theSubscriptionList) {
		if (err) {
			callback (err);
			}
		else {
			var theList = new Array ();
			theSubscriptionList.subscriptions.forEach (function (item) {
				theList.push (convertSubscription (item));
				});
			callback (undefined, theList);
			}
		});
	}
function getUsername (token, callback) { //3/24/24 by DW
	if (utils.secondsSince (whenLastUsernameCacheStart) > config.ctUsernameCacheSecs) {
		usernameCache = new Object ();
		}
	if (usernameCache [token] !== undefined) {
		callback (undefined, usernameCache [token]);
		}
	else {
		getUserInfo (token, function (err, theUser) {
			if (err) {
				callback (err);
				}
			else {
				const username = theUser.username;
				usernameCache [token] = username;
				callback (undefined, username);
				}
			});
		}
	}

function startStorage (theDatabase, callback) { //3/24/24 by DW
	function getMysqlVersion (callback) {
		const sqltext = "select version () as version;";
		davesql.runSqltext (sqltext, function (err, result) {
			var theVersion = undefined;
			if (!err) {
				if (result.length > 0) {
					theVersion = result [0].version;
					console.log ("getMysqlVersion: theVersion == " + theVersion);
					}
				}
			callback (undefined, theVersion);
			});
		}
	davesql.start (config.database, function () {
		getMysqlVersion (function (err, mysqlVersion) { //11/18/23 by DW, 2/1/24; 11:22:16 AM by DW
			config.flStorageEnabled = true;
			config.mysqlVersion = mysqlVersion;
			if (callback !== undefined) {
				callback (undefined, config);
				}
			});
		});
	}
function readUserFile (username, relpath, flprivate, idsite, idpost, callback) {
	const privateval = (flprivate) ? 1 : 0;
	var sqltext = "select * from wpstorage where username = " + davesql.encode (username) + " and relpath = " + davesql.encode (relpath) + " and flprivate = " + davesql.encode (privateval)
	if (idsite !== undefined) { //4/5/24 by DW
		sqltext += " and idsite = " + davesql.encode (idsite);
		}
	if (idpost !== undefined) {
		sqltext += " and idpost = " + davesql.encode (idpost);
		}
	sqltext += ";";
	
	davesql.runSqltext (sqltext, function (err, result) {
		if (err) {
			callback (err);
			}
		else {
			if (result.length == 0) {
				const message = "Can't find the file " + relpath + " for the user " + username + ".";
				callback ({message});
				}
			else {
				const theFileRec = result [0];
				callback (undefined, theFileRec);
				}
			}
		});
	}
function readWholeFile (token, relpath, flprivate, idsite, idpost, callback) { //3/24/24 by DW
	getUsername (token, function (err, username) {
		if (err) {
			callback (err);
			}
		else {
			readUserFile (username, relpath, flprivate, idsite, idpost, callback);
			}
		});
	}
function writeWholeFile (token, relpath, type, flprivate, filecontents, idsite, idpost, iddraft, callback) { 
	const now = new Date ();
	getUsername (token, function (err, username) {
		if (err) {
			callback (err);
			} 
		else {
			function getEncodedValues (jstruct) {
				var values = davesql.encodeValues (jstruct);
				values = utils.stringMid (values, 1, values.length - 1); //remove extraneous semicolon at the end
				return (values);
				}
			function getValuesForUpdating (theValues) { //this could go into the davesql package
				var s = "";
				for (var x in theValues) {
					if (s.length > 0) {
						s += ", ";
						}
					s += x + "=" + davesql.encode (theValues [x]);
					}
				return (s);
				}
			const privateval = (flprivate) ? 1 : 0;
			var fileRec = {
				username, 
				relpath, 
				type,
				flprivate: privateval,
				filecontents,
				whenUpdated: now
				};
			if (idsite !== undefined) {
				fileRec.idSite = idsite;
				}
			if (idpost !== undefined) {
				fileRec.idPost = idpost;
				}
			
			if (iddraft !== undefined) { //5/11/24 by DW
				const sqltext = "update wpstorage set " + getValuesForUpdating (fileRec) + ", ctSaves = ctSaves + 1 where id = " + davesql.encode (iddraft) + ";";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						if (result.affectedRows == 0) {
							const message = "Can't update the file because there is no record with id == " + iddraft;
							callback ({message});
							}
						else {
							fileRec.id = iddraft;
							callback (undefined, fileRec);
							}
						}
					});
				}
			else {
				fileRec.whenCreated = now;
				fileRec.ctSaves = 1;
				const onDuplicatePart = "on duplicate key update type = values (type), filecontents = values (filecontents), whenUpdated = " + davesql.encode (now) + ", ctSaves = ctSaves + 1";
				const sqltext = "insert into wpstorage " + getEncodedValues (fileRec) + " " + onDuplicatePart + ";";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						fileRec.id = result.insertId;
						callback (undefined, fileRec);
						}
					});
				}
			}
		});
	}
function deleteFile (token, relpath, flprivate, callback) { //3/26/24 by DW
	const now = new Date ();
	getUsername (token, function (err, username) {
		if (err) {
			callback (err);
			}
		else {
			const privateval = (flprivate) ? 1 : 0;
			const sqltext = "delete from wpstorage where username = " + davesql.encode (username) + " and relpath = " + davesql.encode (relpath) + " and flprivate = " + davesql.encode (privateval) + ";";
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					if (result.length == 0) {
						const message = "Can't find the file " + relpath + " for the user " + username + ".";
						callback ({message});
						}
					else {
						callback (undefined, true);
						}
					}
				});
			}
		});
	}
function getRecentUserDrafts (token, maxCtDraftsParam, idSiteParam, callback) { //4/27/24 by DW
	const now = new Date ();
	getUsername (token, function (err, username) {
		if (err) {
			callback (err);
			}
		else {
			var sitepart = "";
			if (idSiteParam !== undefined) {
				sitepart = " and idsite = " + davesql.encode (idSiteParam) + " ";
				}
			const maxCtDrafts = Math.min (config.maxCtDrafts, maxCtDraftsParam);
			const sqltext = "select * from wpstorage where relpath = 'draft.json' " +  sitepart + "order by whenUpdated desc limit " + maxCtDrafts + ";";
			console.log ("\ngetRecentUserDrafts: sqltext == " + sqltext + "\n");
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					var theArray = new Array ();
					result.forEach (function (item) {
						const jstruct = JSON.parse (item.filecontents);
						theArray.push (jstruct);
						});
					callback (undefined, theArray);
					}
				});
			}
		});
	}

function handleHttpRequest (theRequest, options = new Object ()) { //returns true if request was handled
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
		
	function returnPlaintext (theText) {
		theRequest.httpReturn (200, "text/plain", theText);
		}
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnError (err) {
		theRequest.httpReturn (503, "text/plain", err.message);
		}
	function returnData (jstruct) {
		theRequest.httpReturn (200, "text/json", utils.jsonStringify (jstruct)); //5/9/24 by DW
		}
	function httpReturn (err, data) {
		if (err) {
			console.log ("httpReturn: err.message == " + err.message);
			returnError (err);
			}
		else {
			returnData (data);
			}
		}
	
	function servePublicFile (virtualpath, callback) { //4/30/24 by DW
		const parts = virtualpath.split ("/");
		
		if (parts.length < 4) {
			return (false);
			}
		const username = parts [1];
		if (username.length == 0) {
			return (false);
			}
		
		const idsite = parts [2];
		if (idsite.length == 0) {
			return (false);
			}
		
		var relpath = "";
		parts.forEach (function (step, ix) {
			if (ix >= 3) {
				if (relpath.length > 0) {
					relpath += "/";
					}
				relpath += step;
				}
			});
		
		const sqltext = "select * from  wpstorage where username = " + davesql.encode (username) + " and idsite = " + davesql.encode (idsite) + " and relpath = " + davesql.encode (relpath) + " and flprivate = 0;";
		console.log ("\nservePublicFile: sqltext == " + sqltext + "\n");
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				returnError (err);
				}
			else {
				if (result.length == 0) {
					theRequest.httpReturn (404, "text/plain", "Not found");
					}
				else {
					const theFile = result [0];
					theRequest.httpReturn (200, theFile.type, theFile.filecontents);
					}
				}
			});
		
		return (true); //the request was for us
		}
	
	function xmlReturn (err, xmltext) { //4/29/24 by DW
		if (err) {
			returnError (err);
			}
		else {
			theRequest.httpReturn (200, "text/xml", xmltext);
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
	function returnServerHomePage () { //3/25/24 by DW
		const pagetable = {
			urlServer: config.urlServer
			};
		function getTemplateText (callback) {
			request (config.urlServerHomePageSource, function (err, response, templatetext) {
				if (err) {
					callback (err);
					}
				else {
					if ((response.statusCode >= 200) && (response.statusCode <= 299)) {
						callback (undefined, templatetext.toString ());
						}
					else {
						const message = "HTTP error == " + response.statusCode;
						callback ({message});
						}
					}
				});
			}
		if (config.urlServerHomePageSource === undefined) { //4/13/24 by DW
			return (false); //not handled
			}
		else {
			getTemplateText (function (err, templatetext) {
				if (err) {
					returnError (err);
					}
				else {
					const pagetext = utils.multipleReplaceAll (templatetext, pagetable, false, "[%", "%]");
					returnHtml (undefined, pagetext);
					}
				});
			return (true); //handled
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
	function connectRedirect (urlAppHomePage=config.urlMyHomePage) {
		function doRedirect (state) {
			const jsontext = JSON.stringify (state);
			const params = {
				client_id: config.clientId,
				redirect_uri: config.urlRedirect,
				response_type: "code",
				scope: config.scope,
				state: jsontext
				};
			const url = config.urlAuthorize + "?" + utils.buildParamList (params);
			returnRedirect (url);
			}
		if (options.createPendingConfirmation !== undefined) { //11/14/23 by DW
			options.createPendingConfirmation (function (err, obj) {
				if (err) {
					returnError (err);
					}
				else {
					const state = {
						url: urlAppHomePage,
						num: obj.magicString
						};
					doRedirect (state);
					}
				});
			}
		else {
			const state = {
				url: urlAppHomePage,
				num: config.myRandomNumber
				};
			doRedirect (state);
			}
		}
	
	switch (theRequest.lowermethod) {
		case "post":
			switch (theRequest.lowerpath) {
				case "/wordpresswritewholefile": //3/24/24 by DW
					tokenRequired (function (token) {
						writeWholeFile (token, params.relpath, params.type, params.flprivate, theRequest.postBody.toString (), params.idsite, params.idpost, params.iddraft, httpReturn);
						});
					return (true);
				case "/testpost": //5/9/24 by DW
					let teststruct = {
						hello: "hooray for hollywood"
						};
					httpReturn (undefined, teststruct);
					return (true);
				default:
					return (false);
				}
		case "get":
			switch (theRequest.lowerpath) {
				case "/":
					return (returnServerHomePage ()); //4/13/24 by DW == return true if we handled, false otherwise
				case "/now":
					returnPlaintext (new Date ().toUTCString ());
					return (true);
				case "/connect": 
					connectRedirect (params.urlapphomepage);
					return (true);
				case "/callbackfromwordpress":
					const state = unpackState (params.state);
					if (state === undefined) {
						const message = "Can't connect the user because there was an error in the state returned from the server.";
						returnError ({message});
						}
					else {
						function finishWordpressLogin () {
							const urlAppHomePage = (state.url === undefined) ? config.urlMyHomePage : state.url; //9/4/23 by DW
							requestTokenFromWordpress (params.code, function (err, tokenData) {
								if (err) {
									console.log ("requestTokenFromWordpress: err.message == " + err.message);
									returnError (err);
									}
								else {
									if (options.useWordpressAccount !== undefined) { //10/31/23 by DW
										let token = tokenData.access_token;
										getUserInfo (token, function (err, theUserInfo) {
											if (err) {
												console.log ("getUserInfo: err.message == " + err.message);
												returnError (err);
												}
											else {
												options.useWordpressAccount (token, theUserInfo); 
												}
											});
										}
									else {
										const urlRedirect = urlAppHomePage + "?wordpressaccesstoken=" + base64UrlEncode (tokenData.access_token); //9/11/23 by DW
										returnRedirect (urlRedirect);
										}
									}
								});
							}
						if (options.checkPendingConfirmation !== undefined) {
							options.checkPendingConfirmation (state.num, function (err) {
								if (err) {
									returnError (err);
									}
								else {
									finishWordpressLogin ();
									}
								});
							}
						else {
							if (state.num != config.myRandomNumber) {
								const message = "Can't connect the user because the secret code doesn't match the one we sent.";
								returnError ({message});
								}
							else {
								finishWordpressLogin ();
								}
							}
						}
					return (true);
				case "/wordpressgetuserinfo": //8/26/23 by DW
					tokenRequired (function (token) {
						getUserInfo (token, httpReturn);
						});
					return (true);
				case "/wordpressgetusersites": //8/26/23 by DW
					tokenRequired (function (token) {
						getUserSites (token, httpReturn);
						});
					return (true);
				case "/wordpressgetsiteposts": //8/28/23 by DW
					tokenRequired (function (token) {
						getSitePosts (token, params.idsite, httpReturn);
						});
					return (true);
				case "/wordpressgetsiteusers": //8/28/23 by DW
					tokenRequired (function (token) {
						getSiteUsers (token, params.idsite, httpReturn);
						});
					return (true);
				case "/wordpressgetsiteinfo": //8/29/23 by DW
					tokenRequired (function (token) {
						getSiteInfo (token, params.idsite, httpReturn);
						});
					return (true);
				case "/wordpressgetsitemedialist": //8/29/23 by DW
					tokenRequired (function (token) {
						getSiteMedialist (token, params.idsite, httpReturn);
						});
					return (true);
				case "/wordpressgetpost": //8/28/23 by DW
					tokenRequired (function (token) {
						getPost (token, params.idsite, params.idpost, httpReturn);
						});
					return (true);
				case "/wordpressaddpost": //8/29/23 by DW
					tokenRequired (function (token) {
						addPost (token, params.idsite, params.jsontext, httpReturn);
						});
					return (true);
				case "/wordpressupdatepost": //8/29/23 by DW
					tokenRequired (function (token) {
						updatePost (token, params.idsite, params.idpost, params.jsontext, httpReturn);
						});
					return (true);
				case "/wordpressdeletepost": //9/4/23 by DW
					tokenRequired (function (token) {
						deletePost (token, params.idsite, params.idpost, httpReturn);
						});
					return (true);
				case "/wordpressgetsubscriptions": //9/5/23 by DW
					tokenRequired (function (token) {
						getSubscriptions (token, httpReturn);
						});
					return (true);
				case "/wordpressdeletefile": //3/26/24 by DW
					tokenRequired (function (token) {
						deleteFile (token, params.relpath, params.flprivate, httpReturn);
						});
					return (true);
				case "/wordpressreadwholefile": //3/25/24 by DW
					tokenRequired (function (token) {
						readWholeFile (token, params.relpath, params.flprivate, params.idsite, params.idpost, httpReturn);
						});
					return (true);
				case "/wordpresswritewholefile": //3/24/24 by DW
					tokenRequired (function (token) {
						writeWholeFile (token, params.relpath, params.type, params.flprivate, params.filedata, params.idsite, params.idpost, params.iddraft, httpReturn);
						});
					return (true);
				case "/wordpressgetrecentuserdrafts": //4/27/24 by DW
					tokenRequired (function (token) {
						getRecentUserDrafts (token, params.maxdrafts, params.idsite, httpReturn);
						});
					return (true);
				
				default:
					if (config.flServePublicUserFiles) { //4/30/24 by DW
						return (servePublicFile (theRequest.lowerpath)); 
						}
					else {
						return (false);
						}
				}
		}
	}

function start (options, callback) {
	if (options !== undefined) {
		for (var x in options) {
			if (options [x] !== undefined) {
				config [x] = options [x];
				}
			}
		if (options.database !== undefined) { //3/24/24 by DW
			startStorage (options.database, function () {
				});
			}
		if (callback !== undefined) {
			callback ();
			}
		}
	}
