var fs = require("fs");
// This library is imported so we can detect the system's newline character
var os = require("os");
// We have to check for write permissions to the directory this program is in
$(document).ready(function() {
	var conferences = {};
	var participantTypes = {};
	var workshops = {};
	// Create a temporary file
	fs.writeFile("tmp", "tmp", function(err) {
		if (err) {
			// We don't have permission
			// Inform the user to check their permissions
			$("#idxRow").prepend("<div class=\"col-md-4\" style=\"color:#ff0000\"><h4>No Write Permission</h4><p>You will not be able to submit new registrations or register for workshops. Check your permissions</p></div>");			
			// Disable the registration buttons
			$("#btnNFLC").attr("disabled", "disabled");
			$("#btnWorkshop").attr("disabled", "disabled");
			return;
		}
		// We have permission
		// Delete the temporary file
		fs.unlinkSync("tmp");

		// Now we're going to save the contents of conferences.txt and type.txt to the session storage
		// Why? Because we don't have to keep making file io requests and I'm lazy
		fs.readFile("data/CONFERENCES.txt", function(err, data) {
                if (err) {
                        // The file does not exist

                        // This text will be inserted into the new file
                        // I like writing multiline strings using arrays because it's cleaner
                        var confText =
                                ['"WASH","Washington D.C.","November 7","November 8"',
                                 '"MINN","Minneapolis MN","November 14","November 15"',
                                 '"NEWO","New Orleans LA","November 21","November 22"'
                                ].join(os.EOL);
                        // We are assuming the data folder does not exist
                        fs.mkdir("data", function(err) {
                                if (err) alert("Could not create data folder. Error: " + err);
                                // Write the file
                                fs.writeFile("data/CONFERENCES.txt", confText, function(err) {
                                        if (err) alert("Could not create the conferences data file. Error: " + err);
                                        //if (debug) console.log("Created conferences.txt");
                                });
                        });
                        return;
                }

                // Populate the conferences object
                // Split the returned data by line
                var conArray = data.toString().split(os.EOL);
                for (i in conArray) {
                        // Split each line by comma.
                        var linArray = conArray[i].toString().split(",");
                        // Remove double quotes left over from the text file
                        for (ix in linArray) {
                                linArray[ix] = replaceAll(linArray[ix],"\"","");
                        }
                        // Place each line into the conferences object.
                        // Example: "WASH": {location:"Washington D.C.",startDate:"November 7",endDate:"November 8"}
                        conferences[linArray[0]] = {
                                location: linArray[1],
                                startDate: linArray[2],
                                endDate: linArray[3]
                        };
                }
		// Add conferences to session storage
		sessionStorage.setItem("conferences", JSON.stringify(conferences));
        	});

		fs.readFile("data/TYPE.txt", function(err, data) {
                if (err) {
                        var typeText =
                                ['"M","Member"',
                                 '"A","Advisor"',
                                 '"G","Guest"'
                                ].join(os.EOL);
                        fs.writeFile("data/TYPE.txt", typeText, function(err) {
                                if (err) alert("Could not create the types data file. Error: " + err);
                                
                        });
                        return;
                }
		fs.readFile("data/WORKSHOPS.txt", function(err, data) {
                if (err) {
                        var workshopsText = [
                                '"3942","WASH","Emotional Intelligence","This workshop provides an introduction to the five key competencies of emotional intelligence","November 7","10:00AM"',
                                '"4954","NEWO","Campaigning in Action","Learn fun innovative tips on running for office","November 14","12:00PM"',
                                '"1104","NEWO","Conflict Management","Find out how to resolve conflict in this informative and interactive workshop","November 21","3:00PM"',
                                '"9831","WASH","Career Competitiveness","Learn how social media competition, and the economy are changing your career path","November 8","10:00AM"'
                        ].join(os.EOL);
                        fs.writeFile("data/WORKSHOPS.txt", workshopsText, function(err) {
                                if (err) alert("Could not create the workshops data file. Error: " + err); return;
                                location.reload();
                                return;
                        });
                }
                var workArray = data.toString().split(os.EOL);
                for (var i in workArray) {
                        var linArray = workArray[i].toString().split(",");
                        for (var ix in linArray) {
                                linArray[ix] = replaceAll(linArray[ix],"\"","");
                        }
                        workshops[linArray[0]] = {
                                name: linArray[2],
                                date: linArray[4],
                                time: linArray[5]
                        }
                }
		sessionStorage.setItem("workshops", JSON.stringify(workshops));
        	});
                var conArray = data.toString().split(os.EOL);
                for (i in conArray) {
                        var linArray = conArray[i].toString().split(",");
                        for (ix in linArray) {
                                linArray[ix] = replaceAll(linArray[ix],"\"","");
                        }
                        participantTypes[linArray[0]] = {
                                description: linArray[1]
                        }
                }
		// Add participant types to session storage
		sessionStorage.setItem("participantTypes", JSON.stringify(participantTypes));
        	});
	});
});

// This function replaces ALL occurrances of the specified string
function replaceAll(str, search, replacement) {
        return str.split(search).join(replacement);
}
