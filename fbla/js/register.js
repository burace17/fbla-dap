// Import file system library
var fs = require("fs");
var os = require("os");
// This code will run when the page has finished loading
$(document).ready(function() {
	// We need to prepare the form using the data in session storage
	// These objects were stored as JSON in the browsers session storage
	// This converts them back to javascript objects
	var conferences = JSON.parse(sessionStorage.getItem("conferences"));
	var participantTypes = JSON.parse(sessionStorage.getItem("participantTypes"));
	
	// Loop through the objects' properties and populate the drop down menus
	for (var i in conferences) {
		if (conferences.hasOwnProperty(i)) {
			$("#confSelect").append("<option value=\"" + i + "\">" + conferences[i].location + "</option>");
		}
	}
	for (var i in participantTypes) {
		if (participantTypes.hasOwnProperty(i)) {
			$("#partTypeSelect").append("<option value=\"" + i + "\">" + participantTypes[i].description + "</option>");
		}
	}
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
		// Now we need to save the data
		// The format is:
		// UniqueNumber, ConferenceCode, ParticipantType, ParticipantFirstName, ParticipantLastName, ChapterNumber
		var data = "\"" + Math.floor(Math.random()*5000) + "\",\"" + $("#confSelect").val() + "\",\"" + $("#partTypeSelect").val() + "\",\"" +
			$("#firstName").val() + "\",\"" + $("#lastName").val() + "\",\"" + $("#chapterNumber").val() + "\""+os.EOL;
		// If participants.txt exists, we append to the existing file. If not, we create a new one.
		fs.exists("data/PARTICIPANTS.txt", function(exists) {
			if (exists) {
				fs.appendFile("data/PARTICIPANTS.txt", data, function(err) {
					if (err) { alert("Could not save data. Error: " + err); return; } 
					else {
						// Let the user know their data was saved successfully
						$("#frmNFLC").before("<p id=\"success\" class=\"bg-success\">Your data was successfully saved!</p>");
						// Clear the form so it is ready for more input
						$("#frmNFLC")[0].reset();
					}
				});
			} else {
				fs.writeFile("data/PARTICIPANTS.txt", data, function(err) {
					if (err) { alert("Could not save data. Error: " + err); return; } 
					else {
						// Let the user know their data was saved successfully
						$("#frmNFLC").before("<p class=\"bg-success\">Your data was successfully saved!</p>");
						// Clear the form so it is ready for more input
						$("#frmNFLC")[0].reset();
					}
				});
			}
		});
		// Prevent the page from reloading
		return false;
	});
});
