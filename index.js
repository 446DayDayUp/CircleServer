var express = require('express')
var app = express()
var server = require('http').createServer(app);
var io = require('socket.io')(server);


app.get('/', function (req, res) {
  res.send('hello')
})

io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(process.env.PORT || 8000, function () {
  console.log('Example app listening on port 8000!')
})