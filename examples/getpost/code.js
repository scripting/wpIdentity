function viewJsontext (theObject) {
	console.log ("viewJsontext");
	function formatJsonWithTabs (theObject) {
		var jsontext = JSON.stringify (theObject, null, '\t');
		jsontext = jsontext.replace (/^(\t*)\}/gm, '$1\t}'); //move closing braces to align with content inside (add one more tab)
		return (jsontext);
		}
	const jsontext = formatJsonWithTabs (theObject);
	$(".divJsonTextarea").text (jsontext);
	
	const titlestring = (theObject.title === undefined) ? "&nbsp" : maxStringLength (theObject.title, 60, false, true);
	$(".divTitle").text (titlestring);
	
	
	}
function getPostDialog () { 
	const defaultString = (localStorage.lastGetPostValue === undefined) ? "237777565, 7581" : localStorage.lastGetPostValue;
	askDialog ("Enter id's for a WordPress post: idSite, idPost:", defaultString, "", function (idsString, flcancel) {
		if (!flcancel) {
			const whenstart = new Date ();
			
			localStorage.lastGetPostValue = idsString;
			
			console.log (idsString); //like this -- 250464612, 89
			const splits = idsString.split (",");
			const idSite = Number (trimWhitespace (splits [0]));
			const idPost = Number (trimWhitespace (splits [1]));
			console.log ("idSite == " + idSite + ", idPost == " + idPost);
			
			
			
			myWordpress.getPost (idSite, idPost, function (err, thePost) {
				if (err) {
					alertDialog (err.message);
					}
				else {
					console.log (secondsSince (whenstart) + " secs.");
					console.log (jsonStringify (thePost));
					viewJsontext (thePost);
					}
				});
			}
		});
	}
function startup () {
	console.log ("startup");
	const options = {
		serverAddress: "https://wpidentity.scripting.com/",
		urlChatLogSocket:  "wss://wpidentity.scripting.com/",
		flWebsocketEnabled: false
		}
	myWordpress = new wordpress (options);
	myWordpress.startup (function (err) {
		if (err) {
			alertDialog ("Can't run the app because there was an error starting up.");
			}
		else {
			getPostDialog ();
			}
		});
	}
