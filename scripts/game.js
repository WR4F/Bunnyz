var socket = io();

var count = 0;

socket.on('logthis', function (data) {
	count++;
	console.log("New message: #" + count + ", Data: " + data);
});