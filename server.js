// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var sqlite = require('sqlite');

// Using libraries to create obejcts for communication
var app = express();
var server = http.Server(app);
var io = socketIO(server);

// Set the web server port to 80
app.set('port', 80);
app.use(express.json())
app.use('/scripts', express.static(__dirname + '/scripts'));

// Routing the url at path '/' to the index.html file in the html folder
app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/index.html'));
});
app.get('/login', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/login.html'));
});
// Routing the url at path '/login' when user submits a form
app.post('/login', function (request, response) {
	// response.sendFile(path.join(__dirname, 'html/login.html'));
	response.send("Thanks for your data my dog!\n")
	console.log(request.query, request.body)
	response.end(request.body)

});

app.get('/db', function (request, response) {
	response.send("yo dog lemme get you some data from the database.");

	try {
		const dbPromise = Promise.resolve()
			.then(() => sqlite.open('./database.sqlite', {
				Promise
			}))
			.then((db) => {
				// interact with the database somehow
				response.end("Some shit from the db: \n");
			}).catch(() => {
				throw Error("Oopsie woopsie i couldnt open the database and get my data properly so sorry senpai");
			});

	} catch (error) {
		console.log("We made a little fucksie wucksie:\n" + error);
		response.send("We made a little fucksie wucksie:\n" + error);
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