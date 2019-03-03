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
app.use('/css', express.static(__dirname + '/css'));


function getCookie(request) {
	try {
		const cookieRegex = request.headers["cookie"].match(/sessiontoken=(.{10})/)
		if (cookieRegex != null && cookieRegex.length > 1 && cookieRegex[1] != null && cookieRegex[1].trim() != '') {
			const browserCookie = cookieRegex[1];
			console.log("Cookie from browser: " + browserCookie)
			return browserCookie
		}
	} catch (error) {
		// Tried to access cookie but none exists on request
		console.error("Oopsie whoopsie we couldn't load browser cookie data, error details:\n", error);
	}
	return null;
}

function setCookie(request, response, cookie) {
	console.log("Prev sessiontoken: ")
	console.log(getCookie(request));

	response.writeHead(200, {
		"Set-Cookie": "sessiontoken=" + cookie + ";"
	})
	console.log("Set cookie on browser to '" + cookie + "'!");
}


// Routing the url at path '/' to the index.html file in the html folder
app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/index.html'));
});
app.get('/login', function (request, response) {
	response.set('Content-Type', 'text/html');
	console.log("Cookie status: ", getCookie(request));

	if (getCookie(request) != undefined && getCookie(request) != null) {
		// The user is going to the /login page but has a sessiontoken cookie
		// Redirect them to chat. If token is invalid, the cookie will get cleared
		response.end('<h2>Session active, redirecting to chat...</h2>' +
			'<meta http-equiv="refresh" content="0; url=/chat">')
	} else {
		// No cookie? Give them the login form
		response.sendFile(path.join(__dirname, 'html/login.html'));
	}
});

app.get('/logout', function (request, response) {
	response.set('Content-Type', 'text/html');
	setCookie(request, response, "; expires=Thu, 01 Jan 1970 00:00:00 GMT")
	response.end('<h2>Logging out...</h2><meta http-equiv="refresh" content="0; url=/">')
});
app.get('/chat', async function (request, response) {
	response.set('Content-Type', 'text/html');
	// Check if the user has a cookie session, redirect to login if not
	if (getCookie(request) == null) {
		response.end('<h2>Session expired (or invalid), redirecting to login...</h2>' +
			'<meta http-equiv="refresh" content="2; url=/login">')
	} else { // If so, check if the database has this session cookie anywhere and login with that user
		try {
			const dbPromise = await Promise.resolve()
				.then(() => sqlite.open('./database.sqlite', {
					Promise
				}))
				.then(async (db) => {
					// Look for cookie matching browser's cookie
					const [userRow] = await Promise.all([
						db.get('SELECT * FROM Users WHERE Cookies = ?', getCookie(request))
					]);
					if (userRow == undefined) {
						// No dice, expire the cookie and send them back to login
						setCookie(request, response, "; expires=Thu, 01 Jan 1970 00:00:00 GMT")
						response.end('<h2>Session expired, redirecting to login...</h2>' +
							'<meta http-equiv="refresh" content="0; url=/login">')
					} else {
						// Hey, a valid cookie! Give them the chat.html page
						response.sendFile(path.join(__dirname, 'html/chat.html'));
					}

				}).catch((error) => {
					app.use('/scripts', express.static(__dirname + '/scripts'));
					throw Error("Oopsie woopsie i couldnt open the database and check for matching cookies so sorry senpai, error:\n" + error);
				});

		} catch (error) {
			console.log("We made a little fucksie wucksie:\n" + error);
			response.send("We made a little fucksie wucksie:\n" + error);
		}
	}
});
app.get('/debugchat', function (request, response) {
	response.sendFile(path.join(__dirname, 'html/chat.html'));
});
app.get('/register', function (request, response) {
	response.set('Content-Type', 'text/html');
	console.log("Cookie status: ", getCookie(request));

	if (getCookie(request) != undefined && getCookie(request) != null) {
		// The user is going to the /register page but has a sessiontoken cookie
		// Redirect them to chat. If token is invalid, the cookie will get cleared
		response.end('<h2>Session active, redirecting to chat...</h2>' +
			'<meta http-equiv="refresh" content="0; url=/chat">')
	} else {
		// No cookie? Give them the registration form
		response.sendFile(path.join(__dirname, 'html/register.html'));
	}
});
// Routing the url at path '/login' when user submits a form
app.post('/register', async function (request, response) {
	response.set('Content-Type', 'text/html');
	// response.sendFile(path.join(__dirname, 'html/login.html'));
	request.postdata = null;
	queryData = "";
	request.on('data', async (data) => {
		queryData += data
		if (queryData.length > 1e6) {
			queryData = ""
			request.connection.destroy()
		}
		request.postdata = qs.parse(queryData)

		console.log(request.postdata)

		// Now that we have the post data (credentials being tried by the user)
		// ...we can check them against the database!
		const userPOST = request.postdata["user"]
		const pswdPOST = request.postdata["pswd"]

		try {
			const dbPromise = await Promise.resolve()
				.then(() => sqlite.open('./database.sqlite', {
					Promise
				}))
				.then(async (db) => {
					// See if username is already taken
					const [userRow] = await Promise.all([
						db.get('SELECT * FROM Users WHERE Username = ?', userPOST)
					]);
					console.log("Accessing: \n", userRow);
					if (userRow == undefined) { // Username not taken - lets make this account and aassign a cookie

						// Generate cookie as a 10 digit number
						// Something like base64 would be better but whatever its been 30+ hours of coding
						cookie = (Math.round(Math.random() * 10000000000)).toString()

						// Insert into the database the new row
						const [beforeInsert, insertRow] = await Promise.all([
							db.get('SELECT Username,Cookies FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST),
							db.get('INSERT INTO Users (Username, Password, Cookies) VALUES (?,?,?)', userPOST, pswdPOST, cookie)
						]);

						// Grab the row of that user again to see the difference
						const [afterInsert] = await Promise.all([
							db.get('SELECT * FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST)
						]);
						console.log(beforeInsert, afterInsert);
						if (afterInsert == undefined) {
							console.error("Undefined row, could not insert"); // Problem!
							response.end("There was a problem registering, try again.")
						} else {
							// Update their sessiontoken cookie, ignoring current cookie
							setCookie(request, response, cookie);

							console.log("Database user row inserted:");
							console.log(afterInsert);
							response.end("<h2>Your data from the db is: " + JSON.stringify(afterInsert) + '</h2><br>Loading chat...' + '<meta http-equiv="refresh" content="0; url=/chat">')
						}
					} else {
						// User entered an existing username.
						response.end('<h1>Username taken, try again!</h1>' +
							'<meta http-equiv="refresh" content="2; url=/register">')
					}
				}).catch((error) => {
					throw Error("Oopsie woopsie i couldnt check database, error is => \n" + error);
				});

		} catch (error) {
			console.log("We made a little fucksie wucksie:\n" + error);
			response.send("We made a little fucksie wucksie:\n" + error);
		}
	})

})
// Routing the url at path '/login' when user submits a form
app.post('/login', async function (request, response) {
	response.set('Content-Type', 'text/html');
	// response.sendFile(path.join(__dirname, 'html/login.html'));
	request.postdata = null;
	queryData = "";
	request.on('data', async (data) => {
		queryData += data
		if (queryData.length > 1e6) {
			queryData = ""
			request.connection.destroy()
		}
		request.postdata = qs.parse(queryData)

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
					console.log("Accessing: \n", userRow);
					if (userRow == undefined) { // User did not enter user/pswd creds that exist in db.
						// Redirect back to GET.
						response.end('<h1>Incorrect credentials, try again!</h1>' +
							'<meta http-equiv="refresh" content="2; url=/login">')
					} else { // User entered valid creds.

						// Generate cookie as a 10 digit number
						// Something like base64 would be better but whatever its been 30+ hours of coding
						cookie = (Math.round(Math.random() * 10000000000)).toString()

						// Update their sessiontoken cookie, ignoring current cookie
						setCookie(request, response, cookie);

						// Update database with the cookie
						const [beforeUpdate, updateRow] = await Promise.all([
							db.get('SELECT Username,Cookies FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST),
							db.get('UPDATE Users SET Cookies = ? WHERE Username = ?', cookie, userPOST)
						]);
						// Grab the row of that user again to see the difference
						const [afterUpdate] = await Promise.all([
							db.get('SELECT Username,Cookies FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST)
						]);
						console.log(beforeUpdate, afterUpdate);
						if (afterUpdate == undefined) {
							console.error("Undefined row to update"); // Problem!
							response.end("There was a problem setting your cookies, try again.")
						} else {
							console.log("Database user row updated:");
							console.log(afterUpdate);
							response.end("<h2>Your data from the db is: " + JSON.stringify(userRow) + '</h2><br>Loading chat...' + '<meta http-equiv="refresh" content="0; url=/chat">')
						}
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

io.on('connection', function (socket) {
	socket.emit('message', { user: 'Server', msg: "Connected" });
	socket.on('message', function (data) {
		io.sockets.emit('message', { user: data.user, msg: data.msg });
	});
});