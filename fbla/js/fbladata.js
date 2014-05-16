// FBLA Data File Manager
// This is a library that will handle all interaction with stored datafile

// ECMAScript 5 Strict Mode
// This -helps- to ensure proper programming practices
"use strict";

// Imports
var os = require("os");
var fs = require("fs");
var sqlite3 = require("sqlite3");

// Data files
// I use this array to shorten code
// 0 - conferences
// 1 - type
// 2 - participants
// 3 - workshops
// 4 - workshop registrations
var dataFiles = [ 
	'data/CONFERENCES.txt',
	'data/TYPE.txt',
	'data/PARTICIPANTS.txt',
	'data/WORKSHOPS.txt',
	'data/WKSHP_REGISTRATIONS.txt'
];

// In order to simply everything, I decided to move the contents of the data files
// into a sqlite database. The database is stored in memory and will be erased when
// the application closes. Before the application closes, it will save the contents
// of the database to the data files. This operation replaces all existing data in the
// data files. 
var fblaDatabase = {};
fblaDatabase.db = null;
fblaDatabase.open = function() {
	fblaDatabase.db = new sqlite3.Database(":memory:");
};
fblaDatabase.createTables = function() {
	var db = fblaDatabase.db;
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS conferences (id TEXT, location TEXT, startTime TEXT, endTime TEXT)");
		db.run("CREATE TABLE IF NOT EXISTS types (id TEXT, description TEXT)");
		db.run("CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY ASC, conference TEXT, type TEXT, firstName TEXT, lastName TEXT, chapterNumber INTEGER)");
		db.run("CREATE TABLE IF NOT EXISTS workshops (id INTEGER PRIMARY KEY ASC, conference TEXT, name TEXT, description TEXT, date TEXT, time TEXT)");
		db.run("CREATE TABLE IF NOT EXISTS wkshpRegistrations (id INTEGER, participantID INTEGER)");	
	});
};

exports.setupDatabase = function() {
	fblaDatabase.open();
	fblaDatabase.createTables();
	return fblaDatabase.db;
};
// This adds the contents of all data files to our local database
exports.setupTables = function() {
	// Check if our static data files exist
	if (!fs.existsSync("data/CONFERENCES.txt")) { createConferences(); }
	if (!fs.existsSync("data/TYPE.txt")) { createTypes(); }
	if (!fs.existsSync("data/WORKSHOPS.txt")) { createWorkshops(); }
	for (var i = 0; i < dataFiles.length; i++) {
		dataFileToSQL(i);
	}
};

exports.getDB = function() {
	return fblaDatabase.db;
}

// Check for write permission
exports.writePermission = function() {
	try {
		fs.writeFileSync("tmp", "tmp", "utf8");
	} catch (e) {
		return false;
	} finally {
		// BUG - This doesn't delete the file for some reason..
		fs.unlinkSync("tmp");
		return true;
	}
};

// Create data folder
// Returns true if successfully created, or throws exception with error
exports.createDataFolder = function() {
	fs.mkdirSync("data");
	return true;
};

// Create CONFERENCES.txt
function createConferences() {
	var confText = 
		['"WASH","Washington D.C.","November 7","November 8"',
                 '"MINN","Minneapolis MN","November 14","November 15"',
                 '"NEWO","New Orleans LA","November 21","November 22"'
                ].join(os.EOL);
	fs.writeFileSync("data/CONFERENCES.txt", confText, "utf8");
	return true;
};
// TODO Change these comments
// This function parses data retrieved from a data file
// The 'type' argument informs the function of what file it is parsing
// It returns an object
function dataFileToSQL(file) {
	// If the data file doesn't exist, we can assume it's either for
	// the participants or workshop registrations. They will be 
	// created later on.
	if (!fs.existsSync(dataFiles[file])) { return; }
	// The dataFiles variable specifies which data file will be read
	var data = fs.readFileSync(dataFiles[file]);
	// Split the data by new line
	var conArray = data.toString().split(os.EOL);
	// The database
	var db = fblaDatabase.db;
	for (var i in conArray) {
		// Split each line by comma
		var linArray = conArray[i].toString().split(",");
		// Remove double quotes left over from the CSV file
		for (var ix in linArray) {
			linArray[ix] = replaceAll(linArray[ix],"\"","");
		}
		if (linArray[0] == null || linArray[1] == null) {
			continue;
		}
		// Each data file is different; make sure we create an object with the
		// correct format.
		switch (file) {
			case 0:
				db.serialize(function() {
					var stmt = db.prepare("INSERT INTO conferences VALUES (?, ?, ?, ?)");
					stmt.run(linArray[0],linArray[1],linArray[2],linArray[3]);
					stmt.finalize();
				});
				break;
			case 1:
				db.serialize(function() {
					var stmt = db.prepare("INSERT INTO types VALUES (?, ?)");
					stmt.run(linArray[0],linArray[1]);
					stmt.finalize();
				});
				break;
			case 2:
				db.serialize(function() {
					var stmt = db.prepare("INSERT INTO participants VALUES (?, ?, ?, ?, ?, ?)");
					stmt.run(parseInt(linArray[0]),linArray[1],linArray[2],linArray[3],linArray[4],parseInt(linArray[5]));
					stmt.finalize();
				});
				break;
			case 3:
				db.serialize(function() {
					var stmt = db.prepare("INSERT INTO workshops VALUES (?, ?, ?, ?, ?, ?)");
					stmt.run(parseInt(linArray[0]),linArray[1],linArray[2],linArray[3],linArray[4],linArray[5]);
					stmt.finalize();
				});	
				break;
			case 4:
				db.serialize(function() {
					var stmt = db.prepare("INSERT INTO wkshpRegistrations VALUES (?, ?)");
					stmt.run(parseInt(linArray[0]),parseInt(linArray[1]));
				       	stmt.finalize();	
				});
				break;
			default:
				throw "Unknown data file type " + file;
		}
	}
}
// Create TYPE.txt
function createTypesFile() {
	var typeText = 
		['"M","Member"',
                 '"A","Adviser"',
                 '"G","Guest"'
                ].join(os.EOL);
	fs.writeFileSync("data/TYPE.txt", typeText, "utf8");
	return true;
};
// Create WORKSHOPS.txt
function createWorkshopsFile() {
	var workshopsText = 
		['"0","WASH","Emotional Intelligence","This workshop provides an introduction to the five key competencies of emotional intelligence","November 7","10:00AM"',
                 '"1","NEWO","Campaigning in Action","Learn fun innovative tips on running for office","November 14","12:00PM"',
                 '"2","NEWO","Conflict Management","Find out how to resolve conflict in this informative and interactive workshop","November 21","3:00PM"',
                 '"3","WASH","Career Competitiveness","Learn how social media competition, and the economy are changing your career path","November 8","10:00AM"'
                ].join(os.EOL);
	fs.writeFileSync("data/WORKSHOPS.txt", workshopsText, "utf8");
	return true;
};


// Add a workshop registration
exports.registerWorkshop = function(workshop, participant) {
	if (workshop == null || participant == null) { throw "ArgumentError: Invalid arguments (2 required)"; }
	var db = fblaDatabase.db;
	db.serialize(function() {
		var stmt = db.prepare("INSERT INTO wkshpRegistrations VALUES (?, ?)");
		stmt.run(workshop, participant);
		stmt.finalize();
	});
};
// Register a participant
exports.registerParticipant = function(conferenceCode, participantType, firstName, lastName, chapterNumber, workshops) {
	if (!conferenceCode || !participantType || !firstName || !lastName || chapterNumber == null || workshops == null) {
		throw "ArgumentErorr: Invalid arguments (7 required)";
	}
	var db = fblaDatabase.db;
	var id;
	db.serialize(function() {
		var stmt = db.prepare("INSERT INTO participants VALUES (NULL, ?, ?, ?, ?, ?)");
		stmt.run(conferenceCode, participantType, firstName, lastName, chapterNumber);
		stmt.finalize();
		db.each("SELECT last_insert_rowid()", function(err, row) {
			id = row["last_insert_rowid()"];
		}, function() {
			if (id && workshops.length > 0) {
				for (var i = 0; i < workshops.length; i++) {
					var stmt = db.prepare("INSERT INTO wkshpRegistrations VALUES (?, ?)");
					stmt.run(workshops[i], id);
					stmt.finalize();
				}
			}	
		});
	});	
};

// This function replaces all occurrances of the specified string
function replaceAll(str, search, replacement) {
	return str.split(search).join(replacement);
}
