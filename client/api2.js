function wordpress (userOptions, callback) {
	var wordpressMemory = { //saved in localstorage
		accessToken: undefined,
		sitelist: undefined
		};
	var options = {
		serverAddress: undefined,
		flMarkdownProcess: true,
		maxCtUserDraftFiles: 100
		};
	if (userOptions !== undefined) { //allow caller to override defaults
		for (x in userOptions) {
			if (userOptions [x] !== undefined) {
				options [x] = userOptions [x];
				}
			}
		}
	
	function saveWordpressMemory () {
		localStorage.wordpressMemory = jsonStringify (wordpressMemory);
		}
	function handleAccesstoken () { //10/3/23 by DW
		function gotToken (accessToken) {
			wordpressMemory.accessToken = base64UrlDecode (accessToken);
			saveWordpressMemory ();
			var newHref = stringNthField (location.href, "?", 1);
			newHref = stringNthField (newHref, "#", 1);
			location.href = newHref;
			}
		const accessToken = getURLParameter ("wordpressaccesstoken");
		if (accessToken != "null") {
			gotToken (accessToken);
			}
		else {
			if (location.hash.length > 0) {
				let hash = location.hash;
				if (beginsWith (hash, "#?")) {
					hash = stringDelete (hash, 1, 2);
					const allparams = getAllUrlParams (hash);
					if (allparams.wordpressaccesstoken !== undefined) {
						gotToken (allparams.wordpressaccesstoken);
						}
					}
				}
			}
		}
	
	handleAccesstoken ();
	
	if (localStorage.wordpressMemory !== undefined) {
		let jstruct = JSON.parse (localStorage.wordpressMemory);
		for (var x in jstruct) {
			wordpressMemory [x] = jstruct [x];
			}
		}
	
	function getServerAddress () {
		return (options.serverAddress); 
		}
	function markdownProcess (mdtext) {
		const replacetable = {
			"\\.": ".",
			"\\_": "_",
			"\\*": "*"
			};
		mdtext = multipleReplaceAll (mdtext, replacetable, false); 
		const md = new Markdown.Converter ();
		const htmltext = md.makeHtml (mdtext);
		return (htmltext);
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
	function userIsSignedIn () {
		return (wordpressMemory.accessToken !== undefined);
		}
	function getUserInfo (callback) { //8/26/23 by DW
		wpServerCall ("wordpressgetuserinfo", undefined, true, callback);
		}
	function getUserSites (callback) { //8/26/23 by DW
		wpServerCall ("wordpressgetusersites", undefined, true, callback);
		}
	function initUserInfo (callback) {
		if (wordpressMemory.userinfo === undefined) {
			getUserInfo (function (err, userinfo) {
				if (err) {
					callback (err);
					}
				else {
					wordpressMemory.userinfo = userinfo;
					saveWordpressMemory ();
					console.log ("initUserInfo: wordpressMemory.userinfo == " + jsonStringify (wordpressMemory.userinfo));
					callback ();
					}
				});
			}
		else {
			callback ();
			}
		}
	function initSitelist (callback) {
		if (wordpressMemory.sitelist === undefined) {
			function getAbbreviatedList (theSitelist) {
				const theList = new Array ();
				theSitelist.forEach (function (item) {
					theList.push ({
						idSite: item.idSite, 
						urlSite: item.urlSite,
						name: item.name,
						description: item.description,
						whenCreated: item.whenCreated
						});
					});
				return (theList);
				}
			getUserSites (function (err, theSitelist) {
				if (err) {
					callback (err);
					}
				else {
					theSitelist.forEach (function (item) { //4/12/24 by DW
						try {
							item.whenCreated = new Date (item.whenCreated);
							}
						catch (err) {
							}
						});
					wordpressMemory.sitelist = theSitelist;
					saveWordpressMemory ();
					console.log ("initSitelist: wordpressMemory.sitelist == " + jsonStringify (wordpressMemory.sitelist));
					callback (undefined);
					}
				});
			}
		else {
			callback ();
			}
		}
	
	function wpServerPost (path, params, flAuthenticated, filedata, callback, urlServer=getServerAddress ()) { //3/24/24 by DW
		var whenstart = new Date ();
		if (!$.isPlainObject (filedata) && (typeof (filedata) != "string")) { //8/2/21 by DW
			filedata = filedata.toString ();
			}
		if (params === undefined) {
			params = new Object ();
			}
		if (flAuthenticated) {
			params.token = base64UrlEncode (wordpressMemory.accessToken);
			}
		var url = urlServer + path + "?" + buildParamList (params, false);
		$.post (url, filedata) //5/9/24 by DW
			.done (function (data, textStatus) {
				if (callback !== undefined) {
					callback (undefined, data);
					}
				})
			.fail (function (jqXHR, textStatus, errorThrown) {
				if (callback !== undefined) {
					let err = {
						message: textStatus
						}
					callback (err);
					}
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
		httpRequest (url, undefined, headers, function (err, jsontext) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, JSON.parse (jsontext));
				}
			});
		}
	function readUserDataFile (relpath, flPrivate, callback, options) { //3/25/24 by DW
		console.log ("readUserDataFile");
		const whenstart = new Date ();
		var params = {
			relpath
			}
		if (flPrivate) {
			params.flprivate = true;
			}
		if (options !== undefined) { //4/5/24 by DW
			for (var x in options) {
				if (options [x] !== undefined) {
					params [x] = options [x];
					}
				}
			}
		wpServerCall ("wordpressreadwholefile", params, true, callback);
		}
	function writeUserDataFile (relpath, filedata, type, flPrivate, callback, options) { //3/24/24 by DW
		const whenstart = new Date ();
		var params = {
			relpath, type
			}
		if (flPrivate) {
			params.flprivate = true;
			}
		
		if (options !== undefined) { //4/5/24 by DW
			for (var x in options) {
				if (options [x] !== undefined) {
					params [x] = options [x];
					}
				}
			}
		
		wpServerPost ("wordpresswritewholefile", params, true, filedata, callback);
		}
	function writeUniqueFile (relpath, filedata, type, flPrivate, callback, options) { //5/12/24 by DW
		var params = {
			relpath, type
			}
		if (flPrivate) {
			params.flprivate = true;
			}
		
		if (options !== undefined) { //4/5/24 by DW
			for (var x in options) {
				if (options [x] !== undefined) {
					params [x] = options [x];
					}
				}
			}
		
		wpServerPost ("wordpresswriteuniquefile", params, true, filedata, callback);
		}
	
	this.getUserInfo = function (callback) {
		callback (undefined, wordpressMemory.userinfo);
		}
	this.getUserSites = getUserSites;
	this.getSitePosts = function (idsite, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetsiteposts", {idsite}, true, callback);
		}
	this.getSiteUsers = function (idsite, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetsiteusers", {idsite}, true, callback);
		}
	this.getSiteInfo = function (idsite, callback) { //8/29/23 by DW
		var flfound = false;
		wordpressMemory.sitelist.forEach (function (item) {
			if (item.idSite == idsite) {
				callback (undefined, item);
				flfound = true;
				}
			});
		if (!flfound) {
			wpServerCall ("wordpressgetsiteinfo", {idsite}, true, callback);
			}
		}
	this.getSiteMedialist = function (idsite, callback) { //8/29/23 by DW
		wpServerCall ("wordpressgetsitemedialist", {idsite}, true, callback);
		}
	this.getPost = function (idsite, idpost, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetpost", {idsite, idpost}, true, callback);
		}
	this.addPost = function (idsite, thepost, callback) { //8/29/23 by DW
		if (options.flMarkdownProcess) {
			thepost.content = markdownProcess (thepost.content);
			}
		const jsontext = JSON.stringify (thepost);
		wpServerCall ("wordpressaddpost", {idsite, jsontext}, true, callback);
		}
	this.updatePost = function (idsite, idpost, thepost, callback) { //8/29/23 by DW
		if (options.flMarkdownProcess) {
			thepost.content = markdownProcess (thepost.content);
			}
		const jsontext = JSON.stringify (thepost);
		wpServerCall ("wordpressupdatepost", {idsite, idpost, jsontext}, true, callback);
		}
	this.deletePost = function (idsite, idpost, callback) { //9/4/23 by DW
		wpServerCall ("wordpressdeletepost", {idsite, idpost}, true, callback);
		}
	this.getSubscriptions = function (callback) { //9/5/23 by DW
		wpServerCall ("wordpressgetsubscriptions", undefined, true, callback);
		}
	this.getRecentUserDrafts = function (idsite, callback) { //4/27/24 by DW
		var params = {
			maxdrafts: options.maxCtUserDraftFiles,
			};
		if (idsite !== undefined) { //4/30/24 by DW
			params.idsite = idsite;
			}
		wpServerCall ("wordpressgetrecentuserdrafts", params, true, function (err, theList) {
			if (err) {
				callback (err);
				}
			else {
				theList.forEach (function (item) {
					item.whenCreated = new Date (item.whenCreated);
					});
				callback (undefined, theList);
				}
			});
		}
	this.getUserFileInfo = function (callback) { //5/16/24 by DW
		var params = {
			maxfiles: options.maxCtUserDraftFiles,
			};
		wpServerCall ("wordpressgetuserfileinfo", params, true, function (err, theList) {
			if (err) {
				callback (err);
				}
			else {
				callback (undefined, theList);
				}
			});
		}
	
	this.readUserDataFile = readUserDataFile;
	this.writeUserDataFile = writeUserDataFile;
	this.writeUniqueFile = writeUniqueFile; //5/12/24 by DW
	
	this.readUserJsonFile = function (relpath, flPrivate, callback, options) { //4/10/24 by DW
		readUserDataFile (relpath, flPrivate, function (err, theFileData) {
			if (err) {
				callback (err);
				}
			else {
				var theJsonData = new Object (), flJsonError = false;
				try {
					theJsonData = JSON.parse (theFileData.filecontents);
					}
				catch (err) {
					callback (err);
					flJsonError = true;
					}
				if (!flJsonError) {
					callback (undefined, theJsonData);
					}
				}
			}, options);
		}
	
	this.deleteUserDataFile = function (relpath, flPrivate, callback) { //3/26/24 by DW
		console.log ("deleteUserDataFile");
		const whenstart = new Date ();
		var params = {
			relpath
			}
		if (flPrivate) {
			params.flprivate = true;
			}
		wpServerCall ("wordpressdeletefile", params, true, callback);
		}
	this.getSiteList = function () {
		return (wordpressMemory.sitelist);
		}
	this.markdownProcess = markdownProcess;
	
	this.testPost = function  () { //5/9/24 by DW -- trying to figure out why POST ops don't return
		const jstruct = {
			instruction: "Smile for the camera honey"
			};
		const jsontext = jsonStringify (jstruct);
		wpServerPost ("testpost", undefined, true, jsontext, function (err, data) {
			if (err) {
				console.log (err.message);
				}
			else {
				console.log (jsonStringify (data));
				}
			});
		},
	
	this.userIsSignedIn = userIsSignedIn;
	this.connectWithWordpress = function () {
		const url = getServerAddress () + "connect?urlapphomepage=" + encodeURIComponent (location.href); //9/4/23 by DW
		console.log ("connectWithWordpress: url == " + url);
		location.href = url;
		}
	this.logOffWordpress = function () {
		delete localStorage.wordpressMemory;
		location.reload ();
		}
	this.startup = function (callback) {
		if (userIsSignedIn ()) {
			initSitelist (function (err) {
				initUserInfo (function (err) {
					callback ();
					});
				});
			}
		else {
			callback (undefined);
			}
		}
	}
