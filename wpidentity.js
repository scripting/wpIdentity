var myProductName = "wpidentity", myVersion = "0.5.23"; 

exports.start = start; 
exports.handleHttpRequest = handleHttpRequest; 
exports.getUserInfo = getUserInfo; //3/23/24 by DW
exports.callWithUsername = callWithUsernameForClient; //3/12/25 by DW

const fs = require ("fs");
const utils = require ("daveutils"); 
const request = require ("request");
const davehttp = require ("davehttp");
const wpcom = require ("wpcom"); //8/26/23 by DW
const davesql = require ("davesql"); //3/24/24 by DW
const emoji = require ("node-emoji");  //4/15/24 by DW
const marked = require ("marked");  //4/18/24 by DW
const rss = require ("daverss"); //4/29/24 by DW
const websocket = require ("ws"); //4/28/25 by DW
const log = require ("sqllog"); //12/21/24 by DW

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
	maxCtDrafts: 1000, //4/27/24 by DW & 10/31/24 by DW
	
	
	flServePublicUserFiles: false, //4/30/24 by DW
	urlPublicUserFiles: "https://wordland.social/", //5/16/24 by DW
	maxCtFiles: 100, //5/16/24 by DW
	
	flWebsocketEnabled: true, //5/24/24 by DW
	websocketPort: 1622,
	urlSocketServer: "wss://wordland.social/",
	
	flUseWhitelist: false, //10/24/24 by DW
	authorizedAccounts: new Array (),
	authorizedAccountsPath: "data/authorizedAccounts.json", //11/18/24 by DW
	
	flDeleteTempFiles: true, //11/13/24 by DW
	flConvertImagesToGutenberg: false, //11/16/24 by DW & 11/18/24 by DW
	
	flLogInstalled: false, //12/21/24 by DW
	
	sysopUsername: undefined, //2/24/25 by DW
	
	homePagetable: undefined //3/14/25 by DW
	};

var stats = {
	ctHits: 0,
	whenLastHit: undefined,
	whenFirstHit: undefined,
	userAgents: {
		}
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
function addToLog (eventName, err, eventData, callback) { //12/21/24 by DW
	if (config.flLogInstalled) {
		log.addToLog (eventName, err, eventData, callback);
		}
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
function callWithUsernameForClient (theRequest, callback) { //3/12/25 by DW -- special function for apps that include wpidentity
	const params = theRequest.params;
	function returnError (err) {
		theRequest.httpReturn (503, "text/plain", err.message);
		}
	function isUserWhitelisted (token, callback) {
		callback (undefined, true);
		}
	function tokenRequired (callback) {
		const token = (params.token === undefined) ? undefined : base64UrlDecode (params.token);
		if (token === undefined) {
			const message = "Can't get the info because the user must be logged in.";
			returnError ({message});
			}
		else {
			isUserWhitelisted (token, function (err, flWhitelisted) { //10/24/24 by DW
				if (err) {
					returnError (err);
					}
				else {
					callback (token);
					}
				});
			}
		}
	tokenRequired (function (token) {
		getUsername (token, function (err, username) {
			if (err) {
				returnError (err);
				} 
			else {
				callback (username);
				}
			});
		});
	}

//wordpress
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
			urlAvatar: theUser.avatar_URL, //3/17/25 by DW
			urlPrimaryBlog: theUser.primary_blog_url,
			urlProfile: theUser.profile_URL, //3/17/25 by DW
			whenStarted: convertDate (theUser.date),
			ctSites: theUser.site_count
			});
		}
	function convertSite (theSite) {
		const flDeleted = theSite.is_deleted; //1/24/25 by DW
		var whenCreated = undefined, ctPosts = undefined; //4/28/25 by DW
		if (!flDeleted) {
			if (theSite.options !== undefined) { //4/28/25 by DW
				whenCreated = convertDate (theSite.options.created_at);
				ctPosts = theSite.options.post_count;
				}
			}
		return ({
			idSite: theSite.ID,
			urlSite: theSite.URL,
			description: theSite.description,
			name: theSite.name,
			whenCreated, //4/28/25 by DW
			flDeleted, //1/24/25 by DW
			ctPosts //4/28/25 by DW
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
			file: theObject.file, //11/13/24 by DW
			guid: theObject.guid, //11/13/24 by DW
			description: convertString (theObject.description),
			alt: convertString (theObject.alt),
			height: theObject.height,
			width: theObject.width
			});
		}
	function convertCategory (theCategory) { //10/20/24 by DW
		return ({
			id: theCategory.ID, //a number
			slug: theCategory.slug, //it's a unique identifier that's text, derived from the name of the category
			name: theCategory.name,
			description: theCategory.description,
			feedUrl: theCategory.feed_url,
			idParent: (theCategory.parent == 0) ? undefined : theCategory.parent,
			ctPosts: theCategory.post_count
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
					if (!item.is_deleted) { //1/24/25 by DW
						theList.push (convertSite (item));
						}
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
	function getCategoriesObject (jstruct) {
		if (jstruct.categories === undefined) {
			return (undefined);
			}
		else {
			var catstruct = new Object ();
			jstruct.categories.forEach (function (item, ix) {
				catstruct [item] = {
					ID: ix + 1
					};
				});
			return (catstruct);
			}
		}
	function getSiteCategories (accessToken, idSite, callback) { //10/19/24 by DW
		const wp = wpcom (accessToken);
		const site = wp.site (idSite);
		const catsPerPage = 100; 
		var returnedCats = new Array ();
		function nextPage (ixCat) {
			const options = {
				number: catsPerPage,
				offset: ixCat
				};
			site.categoriesList (options, function (err, data) { 
				if (err) {
					callback (err);
					}
				else {
					data.categories.forEach (function (item) {
						if (item.slug != "uncategorized") { //10/21/24 by DW
							returnedCats.push (convertCategory (item));
							}
						});
					if (data.categories.length === catsPerPage) {
						nextPage (ixCat + catsPerPage);
						}
					else {
						callback (undefined, returnedCats);
						}
					}
				});
			}
		nextPage (0);
		}
	function addSiteCategory (accessToken, idSite, jsontext, callback) { //3/15/25 by DW
		const jstruct = getObjectFromJsontext (jsontext, callback);
		if (jstruct === undefined) {
			return;
			}
		const wp = wpcom (accessToken);
		
		const theRequest = {
			method: "POST",
			path: `/sites/${idSite}/categories/new`,
			body: jstruct
			}
		wp.req.post (theRequest, function (err, theCategory) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, convertCategory (theCategory));
				}
			});
		}
	function deleteSiteCategory (accessToken, idSite, slug, callback) { //3/15/25 by DW
		const theRequest = {
			url: `https://public-api.wordpress.com/rest/v1.1/sites/${idSite}/categories/slug:${slug}/delete`,
			method: "POST",
			headers: {
				'Authorization': `Bearer ${accessToken}`
				},
			json: true
			};
		request (theRequest, function (err, response, body) {
			if (err) {
				callback (err);
				}
			else {
				if ((response.statusCode >= 200) && (response.statusCode <= 299)) {
					callback (undefined, body);
					}
				else {
					const message = "Couldn't read HTML page because status code == " + response.statusCode;
					callback ({message});
					}
				}
			});
		}
	function updateSiteCategory (accessToken, idSite, slug, jsontext, callback) { //5/11/25 by DW
		const jstruct = getObjectFromJsontext (jsontext, callback);
		if (jstruct === undefined) {
			return;
			}
		const wp = wpcom (accessToken);
		const theRequest = {
			method: "POST",
			path: `/sites/${idSite}/categories/slug:${slug}`,
			body: jstruct
			}
		wp.req.post (theRequest, function (err, theCategory) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, convertCategory (theCategory));
				}
			});
		}
	function uploadImage (accessToken, base64Data, filename, mimeType, idSite, callback) { //11/10/24 by DW
		
		if ((idSite == undefined) || (idSite == "undefined")) { //3/26/25 by DW
			const message = "Can't upload the image because no site was specified.";
			callback ({message});
			return;
			}
		
		const wp = wpcom (accessToken);
		const site = wp.site (idSite);
		
		const imageBuffer = Buffer.from (base64Data, "base64");
		
		function writeBufferToTempFile (callback) {
			const f = "data/tmp/" + idSite + "/" + filename;
			utils.sureFilePath (f, function () {
				fs.writeFile (f, imageBuffer, function (err) {
					if (err) {
						callback (err);
						}
					else {
						callback (undefined, f);
						}
					});
				});
			}
		
		writeBufferToTempFile (function (err, relpath) {
			if (err) {
				callback (err);
				}
			else {
				const fileStream = fs.createReadStream (relpath);
				fileStream.on ("close", function () {
					if (config.flDeleteTempFiles) {
						fs.unlink (relpath, function (err) {
							});
						}
					});
				const theImage = {
					file: fileStream,
					filename,
					"Content-Type": mimeType
					};
				site.addMediaFiles (theImage, function (err, data) {
					if (err) {
						callback (err);
						}
					else {
						if (data.media.length == 0) {
							const message = "No media files were uploaded.";
							callback ({message});
							}
						else {
							callback (undefined, convertMediaObject (data.media [0]));
							}
						}
					});
				}
			});
		}
//storage
	var usernameCache = new Object ();
	var whenLastUsernameCacheStart = new Date ();
	
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
		s = marked (s);
		return (s);
		}
	function processMarkdownImages (markdowntext) { //11/16/24 by DW
		if (config.flConvertImagesToGutenberg) {
			const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
			function processOneImage (alttext, url) {
				const templatetext = "<!-- wp:image {\"id\":4375, \"sizeSlug\": \"large\"} -->\n<figure class=\"wp-block-image size-large is-resized\"><a href=\"[%url%]\"><img src=\"[%url%]\" alt=\"[%alttext%]\" class=\"wp-image-4375\" style=\"width:86px;height:auto\"/></a></figure>\n<!-- /wp:image -->"
				const newtext = utils.multipleReplaceAll (templatetext, {alttext, url}, false, "[%", "%]");
				return (newtext);
				}
			const newMarkdowntext = markdowntext.replace (imageRegex, function (match, altText, url) {
				return (processOneImage (altText, url));
				});
			return (newMarkdowntext);
			}
		else {
			return (markdowntext);
			}
		}
	function processPostText (token, theText, callback) {
		theText = emojiProcess (theText); //4/15/24 by DW
		theText = processMarkdownImages (theText); //11/16/24 by DW
		theText = markdownProcess (theText); //4/18/24 by DW
		getSpecialDataFile (token, "glossary.json", function (err, theGlossary) {
			if (!err) {
				theText = utils.multipleReplaceAll (theText, theGlossary, false);
				}
			callback (undefined, theText);
			});
		}
	function logPublish (verb, theData) { //2/23/25 by DW
		const eventData = {
			title: theData.title,
			author: theData.author.username,
			url: theData.url,
			};
		addToLog (verb + "Post", undefined, eventData);
		}
	
	function addPost (accessToken, idSite, jsontext, callback) { //8/29/23 by DW
		const jstruct = getObjectFromJsontext (jsontext, callback);
		if (jstruct === undefined) {
			return;
			}
		
		const wp = wpcom (accessToken);
		const site = wp.site (idSite);
		
		processPostText (accessToken, jstruct.content, function (err, theProcessedContent) { //5/13/24 by DW
			const thePost = {
				title: jstruct.title,
				content: theProcessedContent, //5/13/24 by DW
				categories: jstruct.categories, //10/21/24 by DW
				
				excerpt: jstruct.excerpt, //3/22/25 by DW
				featured_image: jstruct.idFeaturedImage, //3/22/25 by DW
				
				status: "publish",
				date: new Date ().toGMTString (),
				format: "standard",
				comment_status: "open"
				};
			site.addPost (thePost, function (err, theNewPost) {
				if (err) {
					console.log ("addPost: err.message == " + err.message); //5/8/24 by DW
					callback (err);
					}
				else {
					var theConvertedPost = convertPost (theNewPost); //5/17/24 by DW
					theConvertedPost.whenPublished = new Date ();
					console.log ("addPost: theConvertedPost == " + utils.jsonStringify (theConvertedPost)); //5/8/24 by DW
					logPublish ("add", theConvertedPost); //2/23/25 by DW
					callback (undefined, theConvertedPost);
					}
				});
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
			const thePost = {
				title: jstruct.title,
				content: theProcessedContent,
				categories: jstruct.categories, //10/21/24 by DW
				
				excerpt: jstruct.excerpt, //3/22/25 by DW
				featured_image: jstruct.idFeaturedImage, //3/22/25 by DW
				
				status: "publish"
				};
			post.update (thePost, function (err, theNewPost) {
				if (err) {
					callback (err);
					}
				else {
					var theConvertedPost = convertPost (theNewPost); //5/17/24 by DW
					theConvertedPost.whenPublished = new Date ();
					console.log ("updatePost: theConvertedPost == " + utils.jsonStringify (theConvertedPost)); //5/8/24 by DW
					logPublish ("update", theConvertedPost); //2/23/25 by DW
					callback (undefined, theConvertedPost);
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
	function convertStorageItem (item) { //5/16/24 by DW -- convert database item to the item struct defined by the API
		if (item.idSite == 0) {
			item.idSite = undefined;
			}
		if (item.idPost == 0) {
			item.idPost = undefined;
			}
		return (item);
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
					const code = 404; //2/22/25 by DW
					callback ({message, code});
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
				function setUrlpublic () { //5/16/24 by DW
					if (!flprivate) { //5/16/24 by DW
						if (idsite !== undefined) {
							fileRec.urlPublic = config.urlPublicUserFiles + username + "/" + idsite + "/" + relpath
							}
						}
					}
				function logWrite (verb) { //12/21/24 by DW
					const eventData = {
						username, relpath, iddraft
						};
					addToLog (verb + "File", undefined, eventData);
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
								setUrlpublic (); //5/16/24 by DW
								logWrite ("update"); //12/21/24 by DW
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
							setUrlpublic (); //5/16/24 by DW
							logWrite ("create"); //12/21/24 by DW
							callback (undefined, fileRec);
							}
						});
					}
				}
			});
		}
	function writeUniqueFile (token, relpath, type, flprivate, filecontents, idsite, idpost, callback) { //5/12/24 by DW
		readWholeFile (token, relpath, flprivate, idsite, idpost, function (err, theOriginalFile) {
			const id = (err) ? undefined : theOriginalFile.id; //if id is undefined, treat it as a new file
			writeWholeFile (token, relpath, type, flprivate, filecontents, idsite, idpost, id, callback);
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
				const sqltext = "select * from wpstorage where relpath = 'draft.json' and username = " + davesql.encode (username) +  sitepart + " order by whenUpdated desc limit " + maxCtDrafts + ";"; //10/26/24 by DW
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						var theArray = new Array ();
						result.forEach (function (item) {
							const jstruct = JSON.parse (item.filecontents);
							
							jstruct.idDraft = item.id; //copy data from database for use in the app -- 5/12/24 by DW
							jstruct.whenCreated = new Date (item.whenCreated);
							jstruct.whenUpdated = new Date (item.whenUpdated); 
							jstruct.ctSaves = item.ctSaves; 
							
							theArray.push (jstruct);
							});
						callback (undefined, theArray);
						}
					});
				}
			});
		}
	function getUserFileInfo (token, maxFiles, callback) { //5/16/24 by DW
		getUsername (token, function (err, username) { 
			if (err) {
				callback (err);
				}
			else {
				const maxCtFiles = Math.min (config.maxCtFiles, maxFiles);
				const sqltext = "select * from wpstorage where username = " + davesql.encode (username) + " order by id asc limit " + maxCtFiles + ";";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						var theArray = new Array ();
						result.forEach (function (item) {
							theArray.push (convertStorageItem (item));
							});
						callback (undefined, theArray);
						}
					});
				}
			});
		}
	
	function readDraft (token, iddraft, callback) { //5/29/24 by DW
		getUsername (token, function (err, username) {
			if (err) {
				callback (err);
				} 
			else {
				const sqltext = "select * from wpstorage where username = " + davesql.encode (username) + " and id = " + davesql.encode (iddraft) + ";";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						if (result.length == 0) { //10/17/24 by DW
							const message = "Can't get the file because there is no record with id == " + iddraft;
							callback ({message});
							}
						else {
							callback (undefined, result [0]);
							}
						}
					});
				}
			});
		}
	function deleteDraft (token, iddraft, callback) { //5/29/24 by DW
		getUsername (token, function (err, username) {
			if (err) {
				callback (err);
				} 
			else {
				const sqltext = "delete from wpstorage where username = " + davesql.encode (username) + " and id = " + davesql.encode (iddraft) + ";";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						callback (undefined, true);
						}
					});
				}
			});
		}
	function getNextDraft (token, id, flPrev, callback) { //10/29/24 by DW
		getUsername (token, function (err, username) {
			if (err) {
				callback (err);
				} 
			else {
				const chCompare = (flPrev) ? " < " : " > ";
				const ascendOrDescend = (flPrev) ? " desc " : " asc ";
				const sqltext = "select *  from wpstorage  where username = " + davesql.encode (username) + " and relpath = " + davesql.encode ("draft.json") + " and id " + chCompare + davesql.encode (id) + " order by id " + ascendOrDescend + " limit 1;";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						if (result.length == 0) {
							const which = (flPrev) ? "previous" : "next";
							const message = "Can't get the next draft because there is no " + which + " draft.";
							callback ({message});
							}
						else {
							const jsontext = result [0].filecontents;
							const draftInfo = JSON.parse (jsontext);
							callback (undefined, draftInfo);
							}
						}
					});
				}
			});
		}
	function getNextPrevArray (token, callback) { //11/1/24 by DW
		getUsername (token, function (err, username) {
			if (err) {
				callback (err);
				} 
			else {
				const relpath = "draft.json";
				const sqltext = "select id  from wpstorage  where username = " + davesql.encode (username) + " and relpath = " + davesql.encode (relpath) + " order by id  asc;";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						if (result.length == 0) {
							const message = "Can't get the next/prevs because the user \"" + username + "\" has no drafts.";
							callback ({message});
							}
						else {
							const theArray = new Array ();
							result.forEach (function (item) {
								theArray.push (item.id);
								});
							callback (undefined, theArray);
							}
						}
					});
				}
			});
		}
	function isUserWhitelisted (token, callback) { //10/24/24 by DW
		if (config.flUseWhitelist) {
			getUsername (token, function (err, username) {
				if (err) {
					callback (err);
					}
				else {
					var flWhitelisted = false;
					config.authorizedAccounts.forEach (function (item) {
						if (item == username) {
							flWhitelisted = true;
							}
						});
					callback (undefined, flWhitelisted);
					}
				});
			}
		else {
			callback (undefined, true); //if not using whitelist, everyone is whitelisted
			}
		}
	
	function isUserSysop (username, callback) { 
		if (config.sysopUsername === undefined) { //2/24/25 by DW
			return (true); //everyone is authorized
			}
		if (username == config.sysopUsername) {
			return (true); 
			}
		else {
			const message = "Can't get this information because you are not authorized.";
			callback ({message});
			return (false);
			}
		}
	
	function getTopUsers (username, callback) { //12/23/24 by DW
		if (isUserSysop (username, callback)) {
			const sqltext = "select id, username, whenCreated, whenUpdated, ctSaves from wpstorage where relpath = 'wordland/prefs.json' order by ctSaves desc limit 100;";
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					var theList = new Array ();
					result.forEach (function (item) {
						theList.push ({
							username: item.username,
							ctConnects: item.ctSaves,
							whenFirstConnect: item.whenCreated,
							whenLastConnect: item.whenUpdated
							});
						});
					callback (undefined, theList);
					}
				});
			}
		}
	function getNewPosts (username, callback) { //2/24/25 by DW
		if (isUserSysop (username, callback)) {
			const sqltext = `
				select l.*
				from log l
				join (
					select json_extract(eventData, '$.url') as postUrl, max(whenCreated) as latestWhenCreated
					from log
					where eventName in ('addPost', 'updatePost')
					group by json_extract(eventData, '$.url')
					order by latestWhenCreated desc
					limit 100
					) latest
				on json_extract(l.eventData, '$.url') = latest.postUrl
				and l.whenCreated = latest.latestWhenCreated
				order by l.whenCreated desc
				limit 100;
				`;
			davesql.runSqltext (sqltext, function (err, result) {
				if (err) {
					callback (err);
					}
				else {
					var theList = new Array ();
					result.forEach (function (item) {
						const jstruct = JSON.parse (item.eventData);
						theList.push ({
							id: item.id,
							title: (jstruct.title === undefined) ? "" : jstruct.title,
							url: jstruct.url,
							author: jstruct.author,
							when: item.whenCreated,
							event: item.eventName
							});
						});
					callback (undefined, theList);
					}
				});
			}
		}
	
	function getPublicFile (username, relpath, callback) { //1/9/25 by DW
		const sqltext = "select * from  wpstorage where username = " + davesql.encode (username) + " and relpath = " + davesql.encode (relpath) + " and flprivate = 0;";
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				if (result.length == 0) {
					const message = "Can't find the file " + relpath + " for the user " + username + ", or it may not be public.";
					callback ({message});
					}
				else {
					const theFile = result [0];
					callback (undefined, JSON.parse (theFile.filecontents));
					}
				}
			});
		}
	
	function getAllDraftsForUser (token, callback) { //3/19/25 by DW
		getUsername (token, function (err, username) {
			if (err) {
				callback (err);
				} 
			else {
				const relpath = "draft.json";
				const sqltext = "select *  from wpstorage  where username = " + davesql.encode (username) + " and relpath = " + davesql.encode (relpath) + " order by id  asc;";
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						callback (err);
						}
					else {
						if (result.length == 0) {
							const message = "Can't get the next/prevs because the user \"" + username + "\" has no drafts.";
							callback ({message});
							}
						else {
							const theArray = new Array ();
							result.forEach (function (item) {
								const jstruct = JSON.parse (item.filecontents)
								theArray.push (jstruct);
								});
							callback (undefined, theArray);
							}
						}
					});
				}
			});
		}
	
	
	
	
	
//sockets -- 5/24/24 by DW
	var theWsServer = undefined;
	
	function getWsProtocol () { //2/8/23 by DW
		const protocol = (utils.getBoolean (config.flSecureWebsocket)) ? "wss://" : "ws://";
		return (protocol);
		}
	function notifySocketSubscribers (verb, payload, flPayloadIsString, callbackToQualify) {
		if (theWsServer !== undefined) {
			var ctUpdates = 0, now = new Date (), ctTotalSockets = 0;
			if (payload !== undefined) { 
				if (!flPayloadIsString) {
					payload = utils.jsonStringify (payload);
					}
				}
			theWsServer.clients.forEach (function (conn, ix) {
				ctTotalSockets++;
				if (conn.appData !== undefined) { //it's one of ours
					var flnotify = true;
					if (callbackToQualify !== undefined) {
						flnotify = callbackToQualify (conn);
						}
					if (flnotify) {
						try {
							conn.sendText (verb + "\r" + payload);
							conn.appData.whenLastUpdate = now;
							conn.appData.ctUpdates++;
							ctUpdates++;
							}
						catch (err) {
							console.log ("notifySocketSubscribers: socket #" + i + ": error updating");
							}
						}
					}
				});
			}
		}
	function checkWebSocketCalls () { //expire timed-out calls
		}
	function countOpenSockets () {
		if (theWsServer === undefined) { //12/18/15 by DW
			return (0);
			}
		else {
			return (theWsServer.clients.length);
			}
		}
	function getOpenSocketsArray () { //return an array with data about open sockets
		var theArray = new Array ();
		theWsServer.clients.forEach (function (conn, ix) {
			if (conn.appData !== undefined) { //it's one of ours
				theArray.push ({
					arrayIndex: ix,
					lastVerb: conn.appData.lastVerb,
					urlToWatch: conn.appData.urlToWatch,
					domain: conn.appData.domain,
					whenStarted: utils.viewDate (conn.appData.whenStarted),
					whenLastUpdate: utils.viewDate (conn.appData.whenLastUpdate)
					});
				}
			});
		return (theArray);
		}
	function handleWebSocketConnection (conn) { 
		var now = new Date ();
		console.log ("handleWebSocketConnection");
		conn.appData = { //initialize
			whenStarted: now,
			ctUpdates: 0,
			whenLastUpdate: new Date (0),
			lastVerb: undefined,
			urlToWatch: undefined,
			domain: undefined
			};
		
		function logToConsole (conn, verb, value) {
			}
		function kissOtherLogonsGoodnight (username, theNewConnection) {
			theWsServer.clients.forEach (function (conn, ix) {
				if (conn.appData !== undefined) { //it's one of ours
					if (conn != theNewConnection) { //it's not the new one
						if (conn.appData.wordpressUserInfo !== undefined) { //2/23/25 by DW
							if (conn.appData.wordpressUserInfo.username == username) {
								console.log ("kissOtherLogonsGoodnight: \"" + conn.appData.wordpressUserInfo.username + "\" = \"" + username + "\""); 
								conn.send ("goodnight");
								}
							}
						}
					}
				});
			}
		
		conn.on ("message", function (theMessage) {
			const s = theMessage.toString ();
			var words = s.split (" ");
			if (words.length > 1) { //new protocol as of 11/29/15 by DW
				conn.appData.whenLastUpdate = now;
				conn.appData.lastVerb = words [0];
				switch (words [0]) {
					case "greetings": 
						let accessToken = utils.trimWhitespace (words [1]);
						getUserInfo (accessToken, function (err, theUserInfo) {
							if (!err) {
								conn.appData.accessToken = accessToken;
								conn.appData.wordpressUserInfo = theUserInfo;
								console.log ("handleWebSocketConnection: conn.appData == " + utils.jsonStringify (conn.appData));
								
								const eventData = { //12/21/24 by DW
									email: theUserInfo.email, 
									name: theUserInfo.name, 
									username: theUserInfo.username
									}
								addToLog ("connect", undefined, eventData);
								
								kissOtherLogonsGoodnight (theUserInfo.username, conn);
								}
							});
						break;
					
					}
				}
			else {
				conn.close ();
				}
			});
		conn.on ("close", function () {
			});
		conn.on ("error", function (err) {
			});
		}
	function webSocketStartup () {
		if (config.flWebsocketEnabled) {
			try {
				console.log ("webSocketStartup: config.websocketPort == " + config.websocketPort);
				theWsServer = new websocket.Server ({port: config.websocketPort});
				theWsServer.on ("connection", handleWebSocketConnection);
				theWsServer.on ("error", function (err) {
					console.log ("webSocketStartup: server error == " + err.message);
					});
				console.log ("webSocketStartup: websocket server successfully listening on port " + config.websocketPort);
				}
			catch (err) {
				console.log ("webSocketStartup: err.message == " + err.message);
				}
			}
		}
//users table -- 2/26/25 by DW
	
	function countUserHit (username, userAgent, callback) {
		const sqltext = `
			insert into users (username, ctHits, whenLastHit, lastBrowser)
			values (${davesql.encode (username)}, 1, current_timestamp, ${davesql.encode (userAgent)})
			on duplicate key update
				ctHits = ctHits + 1,
				whenLastHit = current_timestamp,
				lastBrowser = values(lastBrowser);
			`;
		davesql.runSqltext (sqltext, function (err, result) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, result);
				}
			});
		}
	
	
	
	
//misc -- 10/28/24 by DW
	function fixBookmarksFile () { //10/28/24 by DW
		fs.readFile ("bookmarks.opml", function (err, opmltext) {
			if (err) {
				console.log ("fixBookmarksFile: err.message == " + err.message);
				}
			else {
				const filecontents = opmltext.toString (), username = "scripting", relpath = "bookmarks.opml";
				const sqltext = "UPDATE wpstorage SET filecontents = " + davesql.encode (filecontents) + " WHERE username = " + davesql.encode (username) + " AND relpath = " + davesql.encode (relpath) + ";";
				console.log ("fixBookmarksFile: sqltext == " + sqltext);
				davesql.runSqltext (sqltext, function (err, result) {
					if (err) {
						console.log ("fixBookmarksFile: err.message == " + err.message);
						}
					else {
						console.log ("fixBookmarksFile: result == " + utils.jsonStringify (result));
						}
					});
				
				
				}
			});
		}
	function readAuthorizedAccounts () { //11/18/24 by DW
		if (config.authorizedAccountsPath !== undefined) {
			fs.readFile (config.authorizedAccountsPath, function (err, jsontext) {
				if (!err) {
					try {
						config.authorizedAccounts = JSON.parse (jsontext);
						}
					catch (err) {
						console.log ("readAuthorizedAccounts: err.message == " + err.message);
						}
					}
				});
			}
		}

//stats -- 2/27/25 by DW
	var flStatsChanged = false;
	const statsFile = "data/stats.json";
	
	function startStats (callback) {
		utils.sureFilePath (statsFile, function () {
			utils.readConfig (statsFile, stats, function () {
				if (callback !== undefined) {
					callback ();
					}
				});
			});
		}
	function statsChanged () {
		flStatsChanged = true;
		}
	function getStatsFromRequest (theRequest) {
		const now = new Date ();
		stats.ctHits++;
		stats.whenLastHit = now;
		if (stats.whenFirstHit === undefined) {
			stats.whenFirstHit = now;
			}
		
		const userAgent = theRequest.sysRequest.headers ["user-agent"];
		if (userAgent !== undefined) {
			if (stats.userAgents [userAgent] === undefined) {
				stats.userAgents [userAgent] = 1;
				}
			else {
				stats.userAgents [userAgent]++;
				}
			}
		
		statsChanged ();
		}
	function checkStats () {
		if (flStatsChanged) {
			utils.sureFilePath (statsFile, function () {
				fs.writeFile (statsFile, utils.jsonStringify (stats), function (err) {
					});
				});
			flStatsChanged = false;
			}
		}

function handleHttpRequest (theRequest, options = new Object ()) { //returns true if request was handled
	const params = theRequest.params;
	
	getStatsFromRequest (theRequest); //2/27/25 by DW
	
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
			if (err.code !== undefined) { //2/22/25 by DW -- let the caller determine the code
				theRequest.httpReturn (err.code, "text/plain", err.message);
				}
			else {
				returnError (err);
				}
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
			urlServer: config.urlServer,
			urlSocketServer: config.urlSocketServer //5/25/24 by DW
			};
		if (config.homePagetable !== undefined) { //3/14/25 by DW
			utils.mergeOptions (config.homePagetable, pagetable);
			}
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
			isUserWhitelisted (token, function (err, flWhitelisted) { //10/24/24 by DW
				if (err) {
					returnError (err);
					}
				else {
					callback (token);
					}
				});
			}
		}
	function callWithUsername (callback) { //2/24/25 by DW
		tokenRequired (function (token) {
			getUsername (token, function (err, username) {
				if (err) {
					returnError (err);
					} 
				else {
					callback (username);
					}
				});
			});
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
				case "/wordpresswriteuniquefile": //5/12/24 by DW
					tokenRequired (function (token) {
						writeUniqueFile (token, params.relpath, params.type, params.flprivate, theRequest.postBody.toString (), params.idsite, params.idpost, httpReturn);
						});
					return (true);
				case "/testpost": //5/9/24 by DW
					let teststruct = {
						hello: "hooray for hollywood"
						};
					httpReturn (undefined, teststruct);
					return (true);
				case "/wordpressuploadimage": //11/10/24 by DW
					tokenRequired (function (token) {
						uploadImage (token, theRequest.postBody, params.name, params.type, params.idsite, httpReturn);
						});
					return (true);
				
				
				case "/wordpressaddpost": //3/24/25 by DW
					tokenRequired (function (token) {
						addPost (token, params.idsite, theRequest.postBody, httpReturn);
						});
					return (true);
				case "/wordpressupdatepost": //3/24/25 by DW
					tokenRequired (function (token) {
						updatePost (token, params.idsite, params.idpost, theRequest.postBody, httpReturn);
						});
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
				case "/stats": //2/27/25 by DW
					returnPlaintext (utils.jsonStringify (stats));
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
				case "/wordpressgetsitecategories": //10/19/24 by DW
					tokenRequired (function (token) {
						getSiteCategories (token, params.idsite, httpReturn);
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
				case "/wordpressgetuserfileinfo": //5/16/24 by DW
					tokenRequired (function (token) {
						getUserFileInfo (token, params.maxfiles, httpReturn);
						});
					return (true);
				case "/wordpressreaddraft": //5/29/24 by DW
					tokenRequired (function (token) {
						readDraft (token, params.id, httpReturn);
						});
					return (true);
				case "/wordpressdeletedraft": //5/29/24 by DW
					tokenRequired (function (token) {
						deleteDraft (token, params.id, httpReturn);
						});
					return (true);
				case "/wordpressuseriswhitelisted": //10/24/24 by DW
					tokenRequired (function (token) {
						isUserWhitelisted (token, httpReturn);
						});
					return (true);
				case "/wordpressgetnextdraft": //10/29/24 by DW
					tokenRequired (function (token) {
						getNextDraft (token, params.id, false, httpReturn);
						});
					return (true);
				case "/wordpressgetprevdraft": //10/29/24 by DW
					tokenRequired (function (token) {
						getNextDraft (token, params.id, true, httpReturn);
						});
					return (true);
				case "/wordpressgetnextprevarray": //11/1/24 by DW
					tokenRequired (function (token) {
						getNextPrevArray (token, httpReturn);
						});
					return (true);
				case "/wordpressgettopusers": //12/23/24 by DW
					callWithUsername (function (username) {
						getTopUsers (username, httpReturn);
						});
					return (true);
				case "/wordpressgetpublicfile": //1/9/25 by DW
					getPublicFile (params.username, params.relpath, httpReturn);
					return (true);
				case "/wordpressgettnewposts": //2/24/25 by DW
					callWithUsername (function (username) {
						getNewPosts (username, httpReturn);
						});
					return (true);
				case "/wordpresscounthit": //2/26/25 by DW
					callWithUsername (function (username) {
						countUserHit (username, theRequest.sysRequest.headers ["user-agent"], httpReturn);
						});
					return (true);
				
				case "/wordpressaddcategory": //3/15/25 by DW
					tokenRequired (function (token) {
						addSiteCategory (token, params.idsite, params.jsontext, httpReturn);
						});
					return (true);
				case "/wordpressdeletecategory": //3/15/25 by DW
					tokenRequired (function (token) {
						deleteSiteCategory (token, params.idsite, params.slug, httpReturn);
						});
					return (true);
				case "/wordpressupdatecategory": //5/11/25 by DW
					tokenRequired (function (token) {
						updateSiteCategory (token, params.idsite, params.slug, params.jsontext, httpReturn);
						});
					return (true);
				
				case "/wordpressgetalldraftsforuser": //3/19/25 by DW
					tokenRequired (function (token) {
						getAllDraftsForUser (token, httpReturn);
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
	function startLog () { //12/21/24 by DW
		const logOptions = {
			};
		log.start (logOptions, function () {
			const eventData = {
				urlServer: config.urlServer
				}
			addToLog ("start", undefined, eventData);
			});
		}
	function everyMinute () {
		readAuthorizedAccounts (); //11/18/24 by DW
		}
	function everySecond () { //2/27/25 by DW
		checkStats ();
		}
	console.log ("wpIdentity.start: options == " + utils.jsonStringify (options));
	if (options !== undefined) {
		for (var x in options) {
			if (options [x] !== undefined) {
				config [x] = options [x];
				}
			}
		if (options.database !== undefined) { //3/24/24 by DW
			startStorage (options.database, function () {
				});
			startLog (); //12/21/24 by DW
			}
		webSocketStartup (); //5/24/24 by DW
		startStats (); //2/27/25 by DW
		setInterval (everySecond, 1000);  //2/27/25 by DW
		everyMinute (); //11/18/24 by DW
		utils.runEveryMinute (everyMinute); //11/18/24 by DW
		if (callback !== undefined) {
			callback ();
			}
		}
	}
