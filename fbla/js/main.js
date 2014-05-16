// This is our entry point
// At the moment, this script just sets the saved variable in session storage to true
// We have to do this here because all other code could be called multiple times
// I wanted to bind this to some kind of an application launch event but apparently
// there isn't one in node-webkit
"use strict";
var fbladata = require("./js/fbladata.js");
// Setup the database
// I'm doing this because it's easier to query a database 
fbladata.setupDatabase();
fbladata.setupTables();
sessionStorage.setItem("saved", "true");
window.location = "index.html";
