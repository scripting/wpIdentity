function wordpress (userOptions, callback) {
	var wordpressMemory = { //saved in localstorage
		accessToken: undefined,
		sitelist: undefined
		};
	var options = {
		serverAddress: undefined,
		flMarkdownProcess: false, //11/15/25 by DW -- changed to false
		maxCtUserDraftFiles: 1000, //10/31/24 by DW
		flWebsocketEnabled: true, //5/24/24 by DW
		urlChatLogSocket: "ws://localhost:1622/",
		flWatchSocketForOtherCopies: true,
		goodnightDialogMsg: "WordLand is running in another tab. Click OK to reload this tab, or you can safely close it without losing any work.", //12/22/24 by DW
		ctDraftsPerPage: 250 //8/5/25 by DW
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
	function getUsername () { //8/29/25 by DW
		return (wordpressMemory.userinfo.username);
		}
	function getFeedUrl (username, idsite) { //5/15/25 by DW
		username = (username === undefined) ? getUsername () : username;  //8/29/25 by DW
		const feedUrl = options.serverAddress +  username + "/" + idsite + "/rss.xml"; //https://wordland.social/scripting/237777565/rss.xml
		return (feedUrl);
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
	function arrayBufferToBase64 (buffer) { //11/13/24 by DW
		const bytes = new Uint8Array (buffer);
		let binary = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode (bytes [i]);
			}
		return (btoa (binary));
		}
	function getDateForSorting (theDate) { //6/3/23 by DW
		if (theDate === undefined) {
			return (new Date (0));
			}
		else {
			return (new Date (theDate));
			}
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
	function getUserInfoFromServer (callback) { //8/26/23 by DW
		wpServerCall ("wordpressgetuserinfo", undefined, true, callback);
		}
	function getUserSites (callback) { //8/26/23 by DW
		wpServerCall ("wordpressgetusersites", undefined, true, callback);
		}
	function initUserInfo (callback) {
		getUserInfoFromServer (function (err, userinfo) { //3/17/25 by DW
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
	function initSitelist (callback) {
		const whenstart = new Date ();
		getUserSites (function (err, theSitelist) {
			if (!err) {
				theSitelist.forEach (function (item) { //4/12/24 by DW
					try {
						item.whenCreated = new Date (item.whenCreated);
						}
					catch (err) {
						}
					});
				wordpressMemory.sitelist = theSitelist;
				saveWordpressMemory ();
				}
			});
		callback (undefined); //we're not waiting for this to complete
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
						message: jqXHR.responseText || textStatus //3/26/25 by DW
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
	function readDraft (id, callback) { //5/29/24 by DW
		wpServerCall ("wordpressreaddraft", {id}, true, callback);
		}
	function deleteDraft (id, callback) { //5/29/24 by DW
		wpServerCall ("wordpressdeletedraft", {id}, true, callback);
		}
	function draftExists (id, callback) { //10/17/24 by DW
		readDraft (id, function (err, data) {
			callback (err === undefined);
			});
		}
	function getNextDraft (id, callback) { //10/29/24 by DW
		wpServerCall ("wordpressgetnextdraft", {id}, true, callback);
		}
	function getPrevDraft (id, callback) { //10/29/24 by DW
		wpServerCall ("wordpressgetprevdraft", {id}, true, callback);
		}
	function getNextPrevArray (callback) { //11/1/24 by DW
		wpServerCall ("wordpressgetnextprevarray", undefined, true, callback);
		}
	function getAllDraftsForUser (callback) { //3/19/25 by DW
		wpServerCall ("wordpressgetalldraftsforuser", undefined, true, callback);
		}
	
	var idLowestInLastPage = undefined; //8/5/25 by DW
	var flAllDraftsLoaded = false;
	
	function getNextRangeOfDraftsForUser (callback) { //8/5/25 by DW
		if (flAllDraftsLoaded) {
			callback (undefined, new Array ());
			}
		else {
			var params = {
				ct: options.ctDraftsPerPage
				}
			if (idLowestInLastPage !== undefined) {
				params.idlowestinlastpage = idLowestInLastPage;
				}
			wpServerCall ("wordpressgetrangeofdraftsforuser", params, true, function (err, theDrafts) {
				if (err) {
					callback (err);
					}
				else {
					if (theDrafts.length == 0) {
						flAllDraftsLoaded = true;
						}
					var idLowest = (idLowestInLastPage === undefined) ? Infinity : idLowestInLastPage;
					theDrafts.forEach (function (theDraft) {
						if (theDraft.idDraft < idLowest) {
							idLowest = theDraft.idDraft;
							}
						});
					idLowestInLastPage = idLowest;
					callback (undefined, theDrafts);
					}
				});
			}
		}
	function uploadImageFile (idsite, callback) { //11/11/24 by DW
		console.log ("uploadImageFile");
		const theInput = $("<input type=\"file\" id=\"idImageFileInput\" accept=\"image/*\" style=\"display: none;\">");
		$("body").append (theInput);
		theInput.on ("change", function () {
			const theFile = this.files [0];
			if (theFile === undefined) { //no file selected
				theInput.remove ();
				}
			else {
				const reader = new FileReader ();
				reader.onload = function (ev) {
					const params = {
						name: theFile.name,
						type: theFile.type, 
						idsite
						}
					const filedata = arrayBufferToBase64 (ev.target.result);
					wpServerPost ("wordpressuploadimage", params, true, filedata, function (err, data) {
						theInput.remove ();
						callback (err, data);
						});
					}
				reader.readAsArrayBuffer (theFile);
				}
			});
		theInput.click ();
		}
	function addCategory (idsite, theCategory, callback) { //3/15/25 by DW
		const jsontext = JSON.stringify (theCategory);
		wpServerCall ("wordpressaddcategory", {idsite, jsontext}, true, callback);
		}
	function deleteCategory (idsite, slug, callback) { //3/15/25 by DW
		wpServerCall ("wordpressdeletecategory", {idsite, slug}, true, callback);
		}
	function updateCategory (idsite, slug, theCategory, callback) { //5/11/25 by DW
		const jsontext = JSON.stringify (theCategory);
		wpServerCall ("wordpressupdatecategory", {idsite, slug, jsontext}, true, callback);
		}
	function addPost (idsite, thepost, callback) { //3/24/25 by DW
		if (options.flMarkdownProcess) {
			thepost.content = markdownProcess (thepost.content);
			}
		const jsontext = JSON.stringify (thepost);
		wpServerPost ("wordpressaddpost", {idsite}, true, jsontext, callback);
		}
	function updatePost (idsite, idpost, thepost, callback) { //3/24/25 by DW
		if (options.flMarkdownProcess) {
			thepost.content = markdownProcess (thepost.content);
			}
		const jsontext = JSON.stringify (thepost);
		wpServerPost ("wordpressupdatepost", {idsite, idpost}, true, jsontext, callback);
		}
	
	function wsConnectUserToServer () { //5/24/24 by DW
		var ctRetries = 0, idSocketChecker;
		const ctSecsBetwRetries = 10;
		const maxRetries = 100; 
		const initialCheckTimeout = 100; //5/4/25 by DW
		
		var flGoodnightDialogShowing = false; 
		if (options.flWebsocketEnabled) { //2/8/23 by DW
			var mySocket = undefined;
			function handleGoodnightMessage () {
				if (options.flWatchSocketForOtherCopies) { //12/20/21 by DW
					if (!flGoodnightDialogShowing) {
						flGoodnightDialogShowing = true;
						mySocket.close (1000, "Received goodnight message."); //1000 is the code for normal closure
						alertDialog (options.goodnightDialogMsg, function () {
							location.reload (true);
							});
						}
					}
				}
			function checkConnection () {
				if ((mySocket === undefined) && (!flGoodnightDialogShowing)) { //5/25/24 by  DW -- don't reopen socket after being told to go away
					mySocket = new WebSocket (options.urlChatLogSocket); 
					mySocket.onopen = function (evt) {
						ctRetries = 0; //5/1/25 by DW -- we got through
						if (userIsSignedIn ()) { //2/8/23 by DW
							const msg = "greetings " + wordpressMemory.accessToken;
							console.log ("wsConnectToServer: connection open, sending greetings to wpIdentity server.");
							mySocket.send (msg);
							}
						};
					mySocket.onmessage = function (evt) {
						if (evt.data !== undefined) { //no error
							console.log ("wsConnectToServer: evt.data == " + evt.data);
							switch (evt.data) {
								case "goodnight":
									handleGoodnightMessage (); 
									break;
								}
							}
						};
					mySocket.onclose = function (evt) {
						mySocket = undefined;
						if (ctRetries++ >= maxRetries) { //5/1/25 by DW
							clearInterval (idSocketChecker);
							}
						};
					mySocket.onerror = function (evt) {
						console.log ("wsConnectToServer: socket received an error.");
						};
					}
				}
			setTimeout (function () { //5/4/25 by DW
				checkConnection ();
				idSocketChecker = setInterval (checkConnection, 1000 * ctSecsBetwRetries);
				console.log ("wsConnectToServer: idSocketChecker == " + idSocketChecker);
				}, initialCheckTimeout);
			}
		}
	function getUserInfo (callback) {
		if (wordpressMemory.userinfo === undefined) { //3/9/25 by DW
			getUserInfoFromServer (function (err, theUserInfo) {
				if (err) {
					callback (err);
					}
				else {
					wordpressMemory.userinfo = theUserInfo;
					saveWordpressMemory ();
					callback (undefined, theUserInfo);
					}
				})
			}
		else {
			callback (undefined, wordpressMemory.userinfo);
			}
		}
	function getUserInfoSync () { //10/26/24 by DW
		return (wordpressMemory.userinfo);
		}
	function getSitePosts (idsite, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetsiteposts", {idsite}, true, callback);
		}
	function getSiteUsers (idsite, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetsiteusers", {idsite}, true, callback);
		}
	function getSiteInfo (idsite, callback) { //8/29/23 by DW
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
	function getSiteInfoSync (idsite) { //8/18/25 by DW
		var siteinfo = undefined;
		wordpressMemory.sitelist.forEach (function (item) {
			if (item.idSite == idsite) {
				siteinfo = item;
				}
			});
		return (siteinfo);
		}
	function getSiteMedialist (idsite, callback) { //8/29/23 by DW
		wpServerCall ("wordpressgetsitemedialist", {idsite}, true, callback);
		}
	function getSiteCategories (idsite, callback) { //10/19/24 by DW
		wpServerCall ("wordpressgetsitecategories", {idsite}, true, callback);
		}
	function getPost (idsite, idpost, callback) { //8/28/23 by DW
		wpServerCall ("wordpressgetpost", {idsite, idpost}, true, callback);
		}
	function deletePost (idsite, idpost, callback) { //9/4/23 by DW
		wpServerCall ("wordpressdeletepost", {idsite, idpost}, true, callback);
		}
	function getSubscriptions (callback) { //9/5/23 by DW
		wpServerCall ("wordpressgetsubscriptions", undefined, true, callback);
		}
	function getRecentUserDrafts (idsite, callback) { //4/27/24 by DW
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
	function getUserFileInfo (callback) { //5/16/24 by DW
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
	
	function readUserJsonFile (relpath, flPrivate, callback, options) { //4/10/24 by DW
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
	function deleteUserDataFile (relpath, flPrivate, callback) { //3/26/24 by DW
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
	function isUserWhitelisted (callback) { //10/24/24 by DW
		wpServerCall ("wordpressuseriswhitelisted", undefined, true, callback);
		}
	function getAccessToken () { //12/24/24 by DW
		const theToken = base64UrlEncode (wordpressMemory.accessToken);
		return (theToken);
		}
	function getSiteList () {
		return (wordpressMemory.sitelist);
		}
	function getTopUsers (callback) { //12/23/24 by DW
		wpServerCall ("wordpressgettopusers", undefined, true, callback);
		}
	function getNewPosts (callback) { //2/24/25 by DW
		wpServerCall ("wordpressgettnewposts", undefined, true, callback);
		}
	function countUserHit (callback) { //2/26/25 by DW
		wpServerCall ("wordpresscounthit", undefined, true, callback);
		}
	
	function getEdges (idsite, idpost, callback) { //12/4/25 by DW
		wpServerCall ("wordpressgetedges", {idsite, idpost}, undefined, function (err, edges) {
			if (err) {
				callback (err);
				}
			else {
				const flReverseSort = true;
				edges.sort (function (a, b) { //reverse chronologic sort
					var adate = getDateForSorting (a.whenCreated);
					var bdate = getDateForSorting (b.whenCreated);
					if (flReverseSort) {
						const tmp = adate;
						adate = bdate;
						bdate = tmp;
						}
					return (bdate - adate);
					});
				callback (undefined, edges);
				}
			});
		}
	
	function connectWithWordpress () {
		const url = getServerAddress () + "connect?urlapphomepage=" + encodeURIComponent (location.href); //9/4/23 by DW
		console.log ("connectWithWordpress: url == " + url);
		location.href = url;
		}
	function logOffWordpress () {
		delete localStorage.wordpressMemory;
		location.reload ();
		}
	function startup (callback) {
		if (userIsSignedIn ()) {
			initSitelist (function (err) {
				initUserInfo (function (err) {
					wsConnectUserToServer (); //5/24/24 by DW
					callback ();
					});
				});
			}
		else {
			callback (undefined);
			}
		}
	
	this.getUserInfo = getUserInfo;
	this.getUserInfoSync = getUserInfoSync;
	this.getUserSites = getUserSites;
	this.getSitePosts = getSitePosts; //8/28/23 by DW
	this.getSiteUsers = getSiteUsers; //8/29/23 by DW
	this.getSiteInfo = getSiteInfo; //8/29/23 by DW
	this.getSiteInfoSync = getSiteInfoSync; //8/18/25 by DW
	this.getSiteMedialist = getSiteMedialist; //8/29/23 by DW
	this.getSiteCategories = getSiteCategories; //10/19/24 by DW
	this.getPost = getPost; //8/28/23 by DW
	this.deletePost = deletePost;  //9/5/23 by DW
	this.getSubscriptions = getSubscriptions;   //9/5/23 by DW
	this.getRecentUserDrafts = getRecentUserDrafts;   //4/27/24 by DW
	this.getUserFileInfo = getUserFileInfo;  //5/16/24 by DW
	this.readUserDataFile = readUserDataFile;
	this.writeUserDataFile = writeUserDataFile;
	this.writeUniqueFile = writeUniqueFile; //5/12/24 by DW
	this.readDraft = readDraft;  //5/29/24 by DW
	this.deleteDraft = deleteDraft; //5/29/24 by DW
	this.getNextDraft = getNextDraft; //10/29/24 by DW
	this.getPrevDraft = getPrevDraft; //10/29/24 by DW
	this.getNextPrevArray = getNextPrevArray; //11/1/24 by DW
	this.getAllDraftsForUser = getAllDraftsForUser; //3/19/25 by DW
	this.getNextRangeOfDraftsForUser = getNextRangeOfDraftsForUser; //8/5/25 by DW
	this.uploadImageFile = uploadImageFile; //11/11/24 by DW
	this.servercall = wpServerCall; //3/11/25 by DW
	this.serverpost = wpServerPost; //3/11/25 by DW
	this.addCategory = addCategory; //3/15/25 by DW
	this.deleteCategory = deleteCategory; //3/15/25 by DW
	this.updateCategory = updateCategory; //5/11/25 by DW
	this.addPost = addPost; //3/24/25 by DW
	this.updatePost = updatePost; //3/24/25 by DW
	this.getUsername = getUsername; //8/29/25 by DW
	this.readUserJsonFile = readUserJsonFile;  //4/10/24 by DW
	this.deleteUserDataFile = deleteUserDataFile; //3/26/24 by DW
	this.getSiteList = getSiteList;
	this.markdownProcess = markdownProcess;
	this.isUserWhitelisted = isUserWhitelisted; //10/24/24 by DW
	this.getAccessToken = getAccessToken; //12/24/24 by DW
	this.getTopUsers = getTopUsers; //12/23/24 by DW
	this.getNewPosts = getNewPosts; //2/24/25 by DW
	this.countUserHit = countUserHit; //2/26/25 by DW
	this.getFeedUrl = getFeedUrl; //5/15/25 by DW
	this.getEdges = getEdges; //12/4/25 by DW
	this.userIsSignedIn = userIsSignedIn;
	this.connectWithWordpress = connectWithWordpress;
	this.logOffWordpress = logOffWordpress;
	this.startup = startup;
	
	//testing functions, mostly commented out -- 10/24/24 by DW
	//old stuff, all commented out -- 8/18/25 by DW
	}
