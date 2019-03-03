var socket = io();

var count = 0;
//gets data and pushes out that message
socket.on('logthis', function (data) {
	count++;
	console.log("New message: #" + count + ", Data: " + data);
});

function runCode() {
	alert("hello World!");
}