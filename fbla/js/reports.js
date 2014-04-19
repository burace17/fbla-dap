// This file contains a lot of code may be overly complicated
// This is due to the fact that I've never coded someting like this before
// and am not really sure of the best way to do it. 
// I'm trying my best not to write extremely dirty code ..but
// ..there's still a lot here.

var fs = require("fs");
var os = require("os");
// Begin (evil) global variables
// Get the objects in session storage
var conferences = JSON.parse(sessionStorage.getItem("conferences"));
var participantTypes = JSON.parse(sessionStorage.getItem("participantTypes"));
var workshops = JSON.parse(sessionStorage.getItem("workshops"));

// These variables deal with the conference participants report
var chapterNumber = 0;
var participants = [];
var validChapterNumbers = [];
var chapterNumberIndex = 0;
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
	$("#linkCParts").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		// Clear drop down menu
		$("#confSelect").empty();
		// Clear table
		$("#confPartTable").remove();
		// Populate the conferences drop down menu, works just like the one on the registration page
		for (var i in conferences) {
			if (conferences.hasOwnProperty(i)) {
				$("#confSelect").append("<option value=\"" + i + "\">" + conferences[i].location + "</option>");
			}
		}
		fs.readFile("data/PARTICIPANTS.txt", function(err, data) {
			if (err) {
				// The file does not exist
				$("#confSelect").after("<p class=\"bg-danger frmError\">No participants found</p>");
				return;
			}
			$(".frmError").remove();
			// Now we need to populate the participants object, just like we populated the conferences object in index.js
			var dataArray = data.toString().split(os.EOL);
			for (var i in dataArray) {
				// Split each line by comma
				var linArray = dataArray[i].toString().split(",");
				// Remove double quotes left over from the text file
				for (var ix in linArray) {
					linArray[ix] = replaceAll(linArray[ix],"\"","");
				}
				
				// Now to place each line into the participants array
				
				// The code gets crazy from here on out.
				// This is a multidimensional array. I use the first array's index as sort of a primary key
				// so I can find all of the participants from each chapter
				// Then I push an object that contains each participants' information
				if (participants[linArray[5]] == null) participants[linArray[5]] = [];
				participants[linArray[5]].push({
					num: linArray[0],
					confCode: linArray[1],
					type: linArray[2],
					firstName: linArray[3],
					lastName: linArray[4] 
				});
				// I'm not proud of this, but the only way I could think of to keep track of all of the 
				// chapter numbers was to create a separate array, which is a list of the valid ones.
				// This is why I shouldn't code late at night.
				if (linArray[5] != null || linArray[5] != undefined) {
					validChapterNumbers.push(linArray[5]);
				}
			}
			// This removes any duplicates from the new array
			validChapterNumbers = removeDuplicates(validChapterNumbers);
			// Now we populate the table. Beware: populateTable() is scary.
			populateTable();
		});	
		// Show the page
		$("#viewCParts").show();
	});
	$("#linkWkspParts").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		for (var i in workshops) {
			if (workshops.hasOwnProperty(i)) {
				$("#workSelect").append("<option value=\"" + i + "\">" + workshops[i].name + "</option>");
			}
		}
				$("#workSelect").after("<p class=\"bg-danger frmError\">No registrations found</p>");
		$("#viewWkspParts").show();
	});
	$("#linkPartSchedule").click(function() {
		hideViews();
		$(this.parentNode).addClass("active");
		$("#viewPartSchedule").show();
	});	
	// Event handlers for the buttons
	$("#btnNextChapter").click(function() {
		chapterNumber = validChapterNumbers[chapterNumberIndex + 1];
		populateTable();
	});
	$("#btnPrevChapter").click(function() {
		chapterNumber = validChapterNumbers[chapterNumberIndex - 1];
		populateTable();
	});
	// Update table when drop down is changed
	$("#confSelect").change(function() {
		chapterNumberIndex = 0;
		chapterNumber = validChapterNumbers[0];
		populateTable();
	});
});
function populateTable() {
	// I'll try to explain this mess
	var shouldContinue = false;
	// We start out by iterating over all of the valid chapters
	for (var i = 0; i < validChapterNumbers.length; i++) {
		shouldContinue = false;
		// Enable the buttons if needed
		$("#btnPrevChapter").removeAttr("disabled");
		$("#btnNextChapter").removeAttr("disabled");
		// Debug stuff
		//console.log("i: " + i);
		//console.log("cn: " +chapterNumber);
		//console.log("index: " +chapterNumberIndex);
		//console.log(validChapterNumbers);
		// If this is our first time, disable the previous chapter button
		if (chapterNumber == 0) {
			// Set chapter number to the first item in the valid array
			chapterNumber = validChapterNumbers[i];
			$("#btnPrevChapter").attr("disabled", "disabled");
		}
		// These don't work quite right and I don't have time to figure out why.
		// You'll see when you run the program. They work sometimes.
		// They are supposed to disable and enable the buttons when necessary
		if (validChapterNumbers[chapterNumberIndex + 1] == null) {
			$("#btnNextChapter").attr("disabled", "disabled");
		}
		if (validChapterNumbers[chapterNumberIndex - 1] == null) {
			$("#btnPrevChapter").attr("disabled", "disabled");
		}
		// Is this the chapter we are looking for?
		if (chapterNumber == validChapterNumbers[i]) {
			chapterNumberIndex = i;
			// This loop handles multiple entries per chapter
			for (var ix = 0; ix < participants[validChapterNumbers[i]].length; ix++) {
				//console.log(participants[validChapterNumbers[i]][ix].confCode);
				// Is this the right conference?
				if ($("#confSelect").val() == participants[validChapterNumbers[i]][ix].confCode) {
					// Yep, append to the table
					$("#confPartTable").append("<tr>" +
						"<td>"+validChapterNumbers[i]+"</td>" +
						"<td>"+participantTypes[participants[validChapterNumbers[i]][ix].type].description+"</td>" + 
						"<td>"+participants[validChapterNumbers[i]][ix].lastName+"</td></tr>");
				} else {
					// Nope, wrong conference. Keep looping until we hit a good one.
					shouldContinue = true;
					break;
				}
			}
			if (shouldContinue) { /* Loop again */ chapterNumberIndex++; chapterNumber = validChapterNumbers[chapterNumberIndex]; continue; }
			if (!shouldContinue) { 
				// We're done
				// Sort the table and get out
				// TODO: fix the sorting..
				$("td").sortElements(function(a,b) {
					return parseInt($(a).text(), 10) & parseInt($(b).text(), 10) ? 1 : -1;
				});
				return; 
			}
		}
	}
	
}
// This removes duplicates from arrays
function removeDuplicates(arr) {
	var i;
      	var len = arr.length;
        var out = [];
        var obj = {};
	for (var i = 0; i < len; i++) {
    		obj[arr[i]] = 0;
  	}
  	for (i in obj) {
    		out.push(i);
  	}
  	return out;
}
function hideViews() {
	// Clear the active sidebar item
	$("li").removeClass("active");
	$("#viewHome").hide();
	$("#viewCParts").hide();
	$("#viewWkspParts").hide();
	$("#viewPartSchedule").hide();
}

// This function replaces ALL occurrances of the specified string
function replaceAll(str, search, replacement) {
        return str.split(search).join(replacement);
}
// Sort plugin for jquery
jQuery.fn.sortElements = (function() {
	var sort = [].sort;
	return function(comparator, getSortable) {
		getSortable = getSortable || function() { return this; };
		var placements = this.map(function() {
			var sortElement = getSortable.call(this);
			var parentNode = sortElement.parentNode;
			nextSibling = parentNode.insertBefore(document.createTextNode(''),sortElement.nextSibling);
			return function() {
				if (parentNode === this) { alert("An error occurred while sorting"); }
				parentNode.insertBefore(this, nextSibling);
				parentNode.removeChild(nextSibling);
			}
		});
	};
})();
