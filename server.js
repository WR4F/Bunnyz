// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
import sqlite from 'sqlite';


// Using libraries to create obejcts for communication
var app = express();
var server = http.Server(app);
var io = socketIO(server);
const dbPromise = sqlite.open('./database.sqlite', {
	Promise
});

// Set the web server port to 80
app.set('port', 80);
app.use('/scripts', express.static(__dirname + '/scripts'));

// Routing the url at path '/' to the index.html file in the html folder
app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/index.html'));
	s
});

app.get('/db', function (request, response) {
	response.send("yo dog lemme get you some data from the database.");

	try {
		const db = await dbPromise;
		response.send();

	} catch (error) {
		console.log("We made a little fucksie wucksie");
		response.send("We made a little fucksie wucksie");
	}

});

// Starts the web server at port 80
server.listen(80, function () {
	console.log('Web server is running on port 80! Check it out dog!\nhttp://127.0.0.1:80');
});





// Starts the WebSocket server
io.on('connection', function (socket) {});

// Every 2000 seconds, send "hi!" to people connected
setInterval(function () {
	io.sockets.emit('logthis', 'hi!');
}, 2000);