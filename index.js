'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {getSquireCord, mBetweenCoords} = require('./lib/location.js');

const MongoClient = require('mongodb').MongoClient;
const DB_URL = process.env.MONGODB_URI;
const ObjectID = require('mongodb').ObjectID

let database = null;
const bodyParser = require('body-parser')
let userRoomMap = {};

MongoClient.connect(DB_URL, (err, db) => {
  database = db;
});

// Add headers for cross origin access
app.use(function (req, res, next) {
  // Set cros to be *.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Add body parser.
app.use(bodyParser.json());

// Redirect to the landing page for the project.
app.get('/',function(req,res){
  res.redirect('https://446daydayup.github.io/');
})

// API for get and filter nearby chat rooms.
app.get('/get-chat-rooms', (req, res) => {
  let {lat, lng, range} = req.query;
  if (!lat || !lng || !range) {
    res.status(500).send('Need params: lat, lng, range!');
    return;
  }
  if (!database) {
    res.status(500).send('Database uninitialized!');
    return;
  }
  let {top, btm, rgt, lft} = getSquireCord(parseFloat(lat), parseFloat(lng), parseFloat(range));
  let query = [{lat: {$gt: btm, $lt: top}}, {lng: {$gt: lft, $lt: rgt}}]
  if (req.query.tag) {
    query.push({tags: req.query.tag})
  }
  database.collection('chatGroups').find({$and: query})
    .toArray((err, groups) => {
      if (err) res.status(500).send(err.toString());
      groups = groups.filter((group) =>
        mBetweenCoords(group.lat, group.lng, lat, lng) < range &&
        mBetweenCoords(group.lat, group.lng, lat, lng) < group.range);
      groups.forEach((group) => {
        group.distance = parseInt(mBetweenCoords(group.lat, group.lng, lat, lng));
      })
      res.send(groups);
    });
});

// API for create chat room.
app.post('/create-chat-room',function(req,res){
  let {name, tags, lat, lng, range} = req.body;
  tags = tags || [];
  if (!database) {
    res.status(500).send('Database uninitialized!');
    return;
  }
  if (!name || !lat || !lng || !range) {
    res.status(500).send('Need params: lat, lng, range!');
    return;
  }
  database.collection('chatGroups').insert({
    name,
    tags,
    lat,
    lng,
    range,
    numUsers: 0,
  }, (err, result) => {
    if (err) {
      res.status(500).send('Inser error: ', err.toString());
    } else {
      res.send(result.insertedIds[0]);
    }
  });
});

io.on('connection', (socket) => {
  console.log(socket.id,' a user connected');

  // When socket disconnect.
  socket.on('disconnect', function () {
    let roomId = userRoomMap[socket.id];
    delete userRoomMap[socket.id]
    console.log(roomId);
    console.log(socket.id,' user disconnected');
    database.collection('chatGroups').findOneAndUpdate(
      { _id: new ObjectID(roomId) },
      { $inc: { numUsers: -1 } },
      { returnOriginal: false },
      function (err, chatRoom) {
        io.to(roomId).emit('leaveRoom', chatRoom.value.numUsers, socket.id);
      });
  });

  // Receive and send chat messages.
  socket.on('chat', function(room, userName, iconName, msg){
    io.to(room).emit('chat', socket.id, userName, iconName, msg);
    console.log('message: ', msg, ' room: ', room);
  });

  // Socket enter a specific room by room id.
  socket.on('room', function (roomId, userName) {
    console.log(socket.id, ' joins ', roomId)
    socket.join(roomId);
    userRoomMap[socket.id] = roomId;
    database.collection('chatGroups').findOneAndUpdate(
      { _id: new ObjectID(roomId) },
      { $inc: { numUsers: 1 } },
      { returnOriginal: false },
      function (err, chatRoom) {
        io.to(roomId).emit('enterRoom', chatRoom.value.numUsers, userName);
      });
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log('Example app listening on port 8000!');
});
