var myProductName = "wpapp", myVersion = "0.4.1";

const fs = require ("fs");
const utils = require ("daveutils");
const wpidentity = require ("wpidentity");
const davehttp = require ("davehttp");

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

const config = {
	port: process.env.PORT || 1408,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true,
	flPostEnabled: true, //3/24/24 by DW
	};

readConfig ("config.json", config, function ()  {
	console.log ("config == " + utils.jsonStringify (config));
	wpidentity.start (config, function () {
		davehttp.start (config, wpidentity.handleHttpRequest);
		});
	});
