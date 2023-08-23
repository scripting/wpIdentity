
var wordpressMemory = {
	accessToken: undefined
	};
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
		wordpressMemory.accessToken = accessToken;
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
