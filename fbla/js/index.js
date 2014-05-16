"use strict";
// Node.js file system library
var fs = require("fs");
var os = require("os");
// Provides some useful async functions
var async = require("async");
// This library handles all interaction with the data files
var fbladata = require("./js/fbladata.js");
// Node-webkit window library
// Allows us to capture window related events
var gui = require("nw.gui");
var win = gui.Window.get();
// We have to check for write permissions to the directory this program is in
$(document).ready(function() {
	if (!fbladata.writePermission()) {
			// We don't have permission
			// Inform the user to check their permissions
			$("#idxRow").prepend("<div class=\"col-md-4\" style=\"color:#ff0000\"><h4>No Write Permission</h4><p>You will not be able to submit new registrations or register for workshops. Check your permissions</p></div>");			
			// Disable the registration buttons
			$("#btnNFLC").attr("disabled", "disabled");
			$("#btnWorkshop").attr("disabled", "disabled");
			return;
	}

	
});
win.on("close", function() {
	// Have we already saved?
	if (sessionStorage.getItem("saved") == "true") { this.close(true); return; }
	var c = confirm("Would you like to save changes made to the data files? Press OK to save and Cancel to not save");
	// User does not want to save.
	if (!c) { this.close(true); return; }
	// Hide the window while we clean up
	this.hide();
	// Merge the SQL database with the local data files
	// We will overwrite all of them
	var db = fbladata.getDB();
	db.serialize(function() {
		async.parallel([
			function(callback) {
				fs.openSync("data/PARTICIPANTS.txt", "w");
				db.each("SELECT * FROM participants", function (err, row) {
					var data = '"' + row.id + '","' + row.conference + '","' + 
						row.type + '","' + row.firstName + '","' + row.lastName +
						'","' + row.chapterNumber + '"' + os.EOL;	
					fs.appendFileSync("data/PARTICIPANTS.txt", data, "utf8");
				}, function() {
					callback();	
				});
			},
			function(callback) {
				fs.openSync("data/WKSHP_REGISTRATIONS.txt", "w");
				db.each("SELECT * FROM wkshpRegistrations", function(err, row) {
					var data = '"' + row.id + '","' + row.participantID + '"' + os.EOL;
					fs.appendFileSync("data/WKSHP_REGISTRATIONS.txt", data, "utf8");
				}, function() {
					callback();	
				});	
			}

			], function(err) {;
				win.close(true);	
			});
		});	
});
