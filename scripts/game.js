var socket = io();

var count = 0;
//gets data and pushes out that message
socket.on('logthis', function (data) {
	count++;
	console.log("New message: #" + count + ", Data: " + data);
});

// puts into page
socket.on('message', function (data) {
	var div = document.createElement("div");
	var textnode = document.createTextNode(data.user + ": " + data.msg);
	div.appendChild(textnode);
	document.getElementById("chattobe").appendChild(div)
});

function runCode() {
	alert("hello World!");
}


function runScript(e) {
	if (e.keyCode == 13) {
		var tb = document.getElementById("textinput");
		var tbsend = {user: "Username", msg: tb.value};
		console.log("Sending: " + JSON.stringify(tbsend));
		
		socket.emit('message', tbsend)
		tb.value = ""
	}
}