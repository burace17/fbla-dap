"use strict";
// Import file system library
var fs = require("fs");
var os = require("os");
var fbladata = require("./js/fbladata.js");
var gui = require("nw.gui");
var win = gui.Window.get();
var async = require("async");

// This code will run when the page has finished loading
$(document).ready(function() {
	// Populate the combo boxes
	var db = fbladata.getDB();
	// db.parallelize runs the queries concurrently
	db.parallelize(function() {
		// Populate the conferences combo box
		db.each("SELECT * FROM conferences", function(err, row) {
			$("#confSelect").append("<option value=\"" + row.id + "\">" + row.location + "</option>");
		});
		// Populate the member types combo box
		db.each("SELECT * FROM types", function(err, row) {
			$("#partTypeSelect").append("<option value=\"" + row.id + "\">" + row.description + "</option>");	
		});
		// Add workshop checkboxes and workshop description popups
		db.each("SELECT id,name,description,date,time FROM workshops", function(err, row) {
			$("#checkboxes").append("<div class='checkbox'><label><input type='checkbox' id='_"+row.id+"'>" + row.name +
				" <a href='#' class='wkshp-info' onclick='showInfo(this)' id='"+row.id+"'>(info)</a></input></label></div>");
		});
	});	
	// This informs the user that the data they inputted is invalid
	$("input").bind("invalid", function() {
		// Show the user an error message if they inputted incorrect data
		$(this).after("<p class=\"bg-danger frmError\">Please correct this field. It contains invalid data</p>");
	});
	// This event removes all existing form errors so the user does not see one on a corrected entry
	$("#btnSubmit").click(function() {
		$(".frmError").remove();
	});
	// This event fires when the user clicks the submit button and all data is valid
	$("#frmNFLC").submit(function() {
		$("#success").remove();
		
		var conferenceCode = $("#confSelect").val();
		var participantType = $("#partTypeSelect").val();
		var firstName = $("#firstName").val();
		var lastName = $("#lastName").val();
		var chapterNumber = $("#chapterNumber").val();
		var workshops = [];
		
		// Add the id's of the checked checkboxes to the workshops array
	// That array will be used to register the participant in each workshop
		for (var i = 0; i < $("input:checked").length; i++) {
			workshops.push($("input:checked")[i].id.replace("_",""));
		}

		// Add the participant
		fbladata.registerParticipant(conferenceCode, participantType, firstName, lastName, chapterNumber,workshops);
		// We now have unsaved changes
		sessionStorage.setItem("saved", "false");

		// Reset the form
		$("#frmNFLC").before("<p id=\"success\" class=\"bg-success\">Data has been added successfully</p>");
		$("#frmNFLC")[0].reset();
		// Give the lastName field focus
		$("#lastName").focus();
		// Prevent the page from reloading
		return false;
	});
});
// This function is triggered when the user clicks on an info link for a workshop
function showInfo(caller) {
	console.log(caller.id);
	var db = fbladata.getDB();
	var workshop;
	var description;
	var date;
	var time;
	var conference;
	var w = window.open("workshop_info.html", "w", "width=500,height=300");
	db.serialize(function() {
		db.each("SELECT name,description,date,time,conference FROM workshops WHERE id = " + caller.id, function(err,row) {
			console.log(row);
			workshop = row.name;
			description = row.description;
			date = row.date;
			time = row.time;
			if (row.conference == "WASH") conference = "Washington, D.C.";
			if (row.conference == "NEWO") conference = "New Orleans, LA";
			if (row.conference == "MINN") conference = "Minneapolis, MN";
		}, function() {
			w.document.write("<link href='css/bootstrap.min.css' rel='stylesheet'><h1 style='padding:10px'>"+workshop+"</h1>"+
			"<p style='padding-left:10px;'>"+description+"<br/><b>Date:</b> "+date+"<br/><b>Time:</b> "+time+"<br/><b>Location:</b> "+conference+"</p>");
			w.document.title = workshop;
		});
	});
}
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

			], function(err) {
				win.close(true);	
			});
		});	
});
