var express = require('express')
var app = express()
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var {DB_USERNAME, DB_PASSWORD} = require('./config/mongodb.js')

var MongoClient = require('mongodb').MongoClient;
var db_url = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@ds155961.mlab.com:55961/heroku_qjtg66vs`;

MongoClient.connect(db_url, function(err, db) {
  console.log("Connected successfully to server");
  db.collection('chatGroups').find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    console.log(docs)
  });
  db.close();
});

app.get('/', function (req, res) {
  res.send('Hello world')
})

app.get('/create-chat-room', function (req, res) {
  res.send('GET request to the homepage')
})


io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(process.env.PORT || 8000, function () {
  console.log('Example app listening on port 8000!')
})