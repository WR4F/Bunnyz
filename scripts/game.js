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


function runScript(e) {
	if (e.keyCode == 13) {
		var tb = document.getElementById("textinput");
		socket.emit('broadcast',tb.value)

	}
}