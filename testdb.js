const sqlite = require('sqlite');

const userPOST = "MaryLamb"
const pswdPOST = "pswd"


async function select() {

	const dbPromise = await Promise.resolve()
		.then(() => sqlite.open('./database.sqlite', {
			Promise
		}))
		.then(async (db) => {
			// interact with the database somehow
			const [userRow] = await Promise.all([
				db.get('SELECT * FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST)
			]);
			if (userRow == undefined) {
				// response.end('<h1>Incorrect credentials, try again!</h1>' +
				// '<meta http-equiv="refresh" content="3; url=/login">')
				console.log("Undefined row");
			} else {
				// cookie = "" + Math.round(Math.random() * 10);
				// setCookie(request, response, cookie);
				// getCookieDebug(request);
				// response.end("Your data from the db is: \n" + JSON.stringify(userRow))
				// console.log("Data:");
				// console.log(userRow);
			}
		}).catch((error) => {
			throw Error("Oopsie woopsie i couldnt check database, error is => \n" + error);
		});
}

async function update() {

	const dbPromise = await Promise.resolve()
		.then(() => sqlite.open('./database.sqlite', {
			Promise
		}))
		.then(async (db) => {
			//Makes random number to store as a cookies#
			var cookie = Math.round(Math.random() * 10000000000);
			console.log("Generated cookie: " + cookie);

			// interact with the database somehow
			const [beforeUpdate, updateRow] = await Promise.all([
				db.get('SELECT Username,Cookies FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST),
				db.get('UPDATE Users SET Cookies = ? WHERE Username = ?', cookie, userPOST)
			]);
			const [afterUpdate] = await Promise.all([
				db.get('SELECT Username,Cookies FROM Users WHERE Username = ? AND Password = ?', userPOST, pswdPOST)
			]);
			console.log(beforeUpdate, afterUpdate);
			if (afterUpdate == undefined) {
				// response.end('<h1>Incorrect credentials, try again!</h1>' +
				// '<meta http-equiv="refresh" content="3; url=/login">')
				console.log("Undefined row to update");
			} else {
				// setCookie(request, response, cookie);
				// getCookieDebug(request);
				// response.end("Your data from the db is: \n" + JSON.stringify(afterUpdate))
				console.log("Data updated:");
				console.log(afterUpdate);
			}
		}).catch((error) => {
			throw Error("Oopsie woopsie i couldnt check database, error is => \n" + error);
		});
}

update()