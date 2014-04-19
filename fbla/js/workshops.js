// Debug mode
var debug = true;

// Import file system library
var fs = require("fs");
var os = require("os");
// This code will run when the page has finished loading
$(document).ready(function() {
	var participants = {};
	var workshops = JSON.parse(sessionStorage.getItem("workshops"));
	fs.readFile("data/PARTICIPANTS.txt", function(err, data) {
		if (err) alert("No participants were found. Please go back to the home page and enter some.");
		var conArray = data.toString().split(os.EOL);
		for (var i in conArray) {
			var linArray = conArray[i].toString().split(",");
			for (var ix in linArray) {
				linArray[ix] = replaceAll(linArray[ix],"\"","");
			}
			participants[linArray[0]] = {
				firstName: linArray[3],
				lastName: linArray[4]
			};
			$("#participantSelect").append("<option value=\"" + linArray[0] + "\">" + participants[linArray[0]].firstName + " " + participants[linArray[0]].lastName + "</option>");
		}
	});
	for (var i in workshops) {
		if (workshops.hasOwnProperty(i)) {
			$("#workshopSelect").append("<option value=\"" + i + "\">" + workshops[i].name + " - " + workshops[i].date + " - " + workshops[i].time + "</option>");
		}
	}
	// This event fires when the user clicks the submit button and all data is valid
	$("#frmWkshps").submit(function() {
		$("#success").remove();
		// Now we need to save the data
		var data = "\""+$("#workshopSelect").val()+"\",\""+$("#participantSelect").val()+"\""+os.EOL;
		fs.exists("data/WKSHP_REGISTRATIONS.txt", function(exists) {
			if (exists) {
				fs.appendFile("data/WKSHP_REGISTRATIONS.txt", data, function(err) {
					if (err) { alert("Could not save data. Error: " + err); return; } 
					else {
						// Let the user know their data was saved successfully
						$("#frmWkshps").before("<p id=\"success\" class=\"bg-success\">Your data was successfully saved!</p>");
						// Clear the form so it is ready for more input
						$("#frmWkshps")[0].reset();
					}
				});
			} else {
				fs.writeFile("data/WKSHP_REGISTRATIONS.txt", data, function(err) {
					if (err) { alert("Could not save data. Error: " + err); return; } 
					else {
						// Let the user know their data was saved successfully
						$("#frmWkshps").before("<p class=\"bg-success\">Your data was successfully saved!</p>");
						// Clear the form so it is ready for more input
						$("#frmWkshps")[0].reset();
					}
				});
			}
		});
		// Prevent the page from reloading
		return false;
	});
});
// This function replaces ALL occurrances of the specified string
function replaceAll(str, search, replacement) {
        return str.split(search).join(replacement);
}
