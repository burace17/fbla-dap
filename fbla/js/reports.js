var fs = require("fs");
var os = require("os");
var fbladata = require("./js/fbladata.js");
var gui = require("nw.gui");
var win = gui.Window.get();
var async = require("async");

// Sorting stuff
var sortField = "chapterNumber ";
var direction = "ASC";

$(document).ready(function() {
	// We use javascript to hide these elements instead of css because jquery will save their original display values
	$("#viewCParts").hide();
	$("#viewWkspParts").hide();
	$("#viewPartSchedule").hide();

	// Now bind new click events to all of the sidebar links
	$("#linkHome").click(function() {
		hideViews();
		// Set this as the active page
		$(this.parentNode).addClass("active");
		$("#viewHome").show();
	});
	// CONFERENCE PARTICIPANTS
	$("#linkCParts").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		// Clear drop down menu
		$("#confSelect").empty();
		$("#chapSelect").empty();
		var db = fbladata.getDB();
		db.serialize(function() {
			db.each("SELECT * FROM conferences", function(err, row) {
				$("#confSelect").append("<option value=\"" + row.id + "\">" + row.location + "</option>");
			}, function() {
				$("#confSelect").prepend("<option value=\"all\">Show All</option>");	
			});
			db.each ("SELECT chapterNumber FROM participants ORDER BY chapterNumber ASC", function(err, row) {
				$("#chapSelect").append("<option value=\"" + row.chapterNumber + "\">" + row.chapterNumber + "</option>");
			}, function() {
				$("#chapSelect").prepend("<option value=\"all\">Show All</option");
				populateConfPartTable();
			});
			
		});
		// Show the page
		$("#viewCParts").show();
	});
	// WORKSHOP PARTICIPANTS
	$("#linkWkspParts").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		// Clear drop down menu
		$("#workSelect").empty();
		var db = fbladata.getDB();
		db.serialize(function() {
			db.each("SELECT id,name FROM workshops", function(err, row) {
				$("#workSelect").append("<option value=\"" + row.id + "\">" + row.name + "</option>");
			}, function() {
				populateWkspPartTable();	
			});
		});
		$("#viewWkspParts").show();
	});
	// PARTICIPANT SCHEDULES
	$("#linkPartSchedule").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		// Clear drop down menu
		$("#partSelect").empty();
		var db = fbladata.getDB();
		db.serialize(function() {
			db.each("SELECT id,firstName,lastName FROM participants ORDER BY firstName ASC", function(err, row) {
				$("#partSelect").append("<option value=\"" + row.id + "\">" + row.firstName + " " + row.lastName + "</option>");
			}, function() {
				populatePartTable();	
			});
		});
		$("#viewPartSchedule").show();
	});	
	// Update table when drop down is changed
	$("#confSelect").change(function() {
		populateConfPartTable();
	});
	$("#chapSelect").change(function() {
		populateConfPartTable();
	});
	$("#workSelect").change(function() {
		populateWkspPartTable();
	});
	$("#partSelect").change(function() {
		populatePartTable();
	});
	$("#sortChap").click(function() {
		// Don't forget to add the space
		sortField = "chapterNumber ";
		directionToggle();
		populateConfPartTable();
	});
	$("#sortPart").click(function() {
		sortField = "type ";
		directionToggle();
		populateConfPartTable();
	});
	$("#sortlName").click(function() {
		sortField = "lastName ";
		directionToggle();
		populateConfPartTable();
	});
	$("#sortfName").click(function() {
		sortField = "firstName ";
		directionToggle();
		populateConfPartTable();
	});
});
function populatePartTable() {
	// Clear the table
	$(".frmError").remove();
	$("#partTable tr").remove();
	var db = fbladata.getDB();
	db.serialize(function() {
		db.each("SELECT workshops.name,workshops.date,workshops.time FROM workshops,wkshpRegistrations " + 
			"WHERE wkshpRegistrations.participantID = '" + $("#partSelect").val() + "' AND " +
		        "workshops.id = wkshpRegistrations.id ORDER BY date,time ASC", function(err, row) {
			$("#partTable").append("<tr><td>" + row.name + "</td><td>" + row.date + "</td><td>" + row.time + "</td></tr>");
		}, function() {
			db.each("SELECT conference FROM participants WHERE id = "+$("#partSelect").val(), function(err, row) {
				if (row.conference == "WASH") {
					$("#partTable").prepend("<tr><td>Opening Session</td><td>November 7</td><td>8:00AM</td></tr>");
					$("#partTable").append("<tr><td>Closing Session</td><td>November 8</td><td>7:00PM</td></tr>");	
				}
				if (row.conference == "MINN") {
					$("#partTable").prepend("<tr><td>Opening Session</td><td>November 14</td><td>8:00AM</td></tr>");
					$("#partTable").append("<tr><td>Closing Session</td><td>November 15</td><td>7:00PM</td></tr>");
				}
				if (row.conference == "NEWO") {
					$("#partTable").prepend("<tr><td>Opening Session</td><td>November 21</td><td>8:00AM</td></tr>");
					$("#partTable").append("<tr><td>Closing Session</td><td>November 22</td><td>7:00PM</td></tr>");
				}
			});
		
		});	
	});
}
function populateConfPartTable() {
	var showAllConf = $("#confSelect").val() == "all";
	var showAllChap =  $("#chapSelect").val() == "all";
	// Clear the table
	$(".frmError").remove();
	$("#confPartTable tr").remove();
	var db = fbladata.getDB();
	db.serialize(function() {
		if (showAllConf || showAllChap) {
			if (showAllConf && showAllChap) {
				db.each("SELECT lastName,firstName,type,chapterNumber FROM participants ORDER BY " + sortField + direction, function(err, row) {
					var type = fixType(row.type);
					$("#confPartTable").append("<tr><td>" + row.chapterNumber + "</td><td>" + type + "</td><td>" + row.lastName + 
						"</td><td>" + row.firstName + "</td></tr>");
				});
			} else if (showAllConf) {
				db.each("SELECT lastName,firstName,type,chapterNumber FROM participants WHERE chapterNumber = " + 
					$("#chapSelect").val() + " ORDER BY " + sortField + direction, function(err, row) {
					var type = fixType(row.type);
					$("#confPartTable").append("<tr><td>" + row.chapterNumber + "</td><td>" + type + "</td><td>" + row.lastName + 
						"</td><td>" + row.firstName + "</td></tr>");
				});
			} else if (showAllChap) {
				db.each("SELECT lastName,firstName,type,chapterNumber FROM participants WHERE conference = '" + 
					$("#confSelect").val() + "' ORDER BY " + sortField + direction, function(err,row) {
					var type = fixType(row.type);
					$("#confPartTable").append("<tr><td>" + row.chapterNumber + "</td><td>" + type + "</td><td>" + row.lastName + 
						"</td><td>" + row.firstName + "</td></tr>");
				});	
			}
		} else {
			db.each("SELECT firstName,lastName,type,chapterNumber FROM participants WHERE chapterNumber = " + $("#chapSelect").val() +
				" AND conference = '" + $("#confSelect").val() + "' ORDER BY " + sortField + direction, function(err,row) {
				var type = fixType(row.type);
				$("#confPartTable").append("<tr><td>" + row.chapterNumber + "</td><td>" + type + "</td><td> " + row.lastName + 
					"</td><td>" + row.firstName + "</td></tr>");
			});
		}
	});
}
function populateWkspPartTable() {
	$(".frmError").remove();
	$("#workPartTable tr").remove();
	var db = fbladata.getDB();
	db.serialize(function() {
		db.each("SELECT participants.type,participants.lastName,participants.chapterNumber FROM participants,wkshpRegistrations " +
			"WHERE wkshpRegistrations.participantID = participants.id AND wkshpRegistrations.id = '" + $("#workSelect").val() + "'",
		       function(err, row) {
			       	var type = fixType(row.type);
				$("#workPartTable").append("<tr><td>" + type + "</td><td>" + row.lastName + "</td><td>" + row.chapterNumber + "</td></tr>");
		       });	       
	});
}
function hideViews() {
	// Clear the active sidebar item
	$("li").removeClass("active");
	$("#viewHome").hide();
	$("#viewCParts").hide();
	$("#viewWkspParts").hide();
	$("#viewPartSchedule").hide();
}
// This toggles the sort direction variable
function directionToggle() {
	direction = (direction == "ASC") ? "DESC" : "ASC";
}
// This function converts a type ID to a user-friendly label
function fixType(type) {
	if (type == "M") return "Member";
	if (type == "G") return "Guest";
	if (type == "A") return "Adviser";
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
