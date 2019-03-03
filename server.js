// Dependencies
const http = require('http');
const express = require('express');
const qs = require('querystring')
const path = require('path');
const socketIO = require('socket.io');
const sqlite = require('sqlite');
const cookieSession = require('cookie-session');

// Using libraries to create obejcts for communication
const app = express();
var server = http.Server(app);
var io = socketIO(server);

// Set the web server port to 80
app.set('port', 80);
app.use(express.json())
app.use('/scripts', express.static(__dirname + '/scripts'));


function getCookieDebug(request) {
	// console.log("Session: " + JSON.stringify(request.session))
}

function setCookie(request, response, cookie) {
	// console.log("Session: " + JSON.stringify(request.session))
	response.writeHead(200, {
		"Set-Cookie": "sessiontoken=" + cookie
	})


}


// Routing the url at path '/' to the index.html file in the html folder
app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/index.html'));
});
app.get('/login', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/login.html'));
});
app.get('/register', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/register.html'));
});
app.get('/chat', function (request, response) {

	response.sendFile(path.join(__dirname, 'html/chat.html'));
});
app.get('/debugchat', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/chat.html'));
});
// Routing the url at path '/login' when user submits a form
app.post('/login', async function (request, response) {
	// response.sendFile(path.join(__dirname, 'html/login.html'));
	getCookieDebug(request);
	request.postdata = null;
	queryData = "";
	request.on('data', async (data) => {
		queryData += data
		if (queryData.length > 1e6) {
			queryData = ""
			req.connection.destroy()
		}
		request.postdata = qs.parse(queryData)
		// response.send("Thanks for your data my dog!\n" +
		// 	"Username: " + request.postdata["user"] +
		// 	", Password: " + request.postdata["pswd"])
		console.log(request.postdata)

		// Now that we have the post data (login credentials being tried by the user)
		// ...we can check them against the database!
		const userPOST = request.postdata["user"]
		const pswdPOST = request.postdata["pswd"]

		try {
			const dbPromise = await Promise.resolve()
				.then(() => sqlite.open('./database.sqlite', {
					Promise
				}))
				.then(async (db) => {
					// interact with the database somehow
					const [userRow] = await Promise.all([
						db.get('SELECT * FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST)
					]);
					console.log(userRow);
					if (userRow == undefined) {
						response.end('<h1>Incorrect credentials, try again!</h1>' +
							'<meta http-equiv="refresh" content="3; url=/login">')
					} else {
						cookie = "" + Math.round(Math.random() * 10);
						setCookie(request, response, cookie);
						getCookieDebug(request);
						response.end("Your data from the db is: \n" + JSON.stringify(userRow))
					}
				}).catch((error) => {
					throw Error("Oopsie woopsie i couldnt check database, error is => \n" + error);
				});

		} catch (error) {
			console.log("We made a little fucksie wucksie:\n" + error);
			response.send("We made a little fucksie wucksie:\n" + error);
		}
	})

});

app.get('/db', async function (request, response) {
	// response.send("yo dog lemme get you some data from the database.");

	try {
		const dbPromise = await Promise.resolve()
			.then(() => sqlite.open('./database.sqlite', {
				Promise
			}))
			.then(async (db) => {
				// interact with the database somehow
				const [profilePosts] = await Promise.all([
					// db.get('SELECT * FROM Post WHERE id = ?', req.params.id),
					db.all('SELECT * FROM Profile')
				]);
				// pulling data from database (shows in browser)
				response.send("Some shit from the db: \n" + JSON.stringify(profilePosts));
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