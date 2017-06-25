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

// API for find one chat room by room id.
app.get('/get-chat-room', (req, res) => {
  let { roomId } = req.query;
  if (!roomId) {
    res.status(500).send('Need param roomId!');
    return;
  }
  if (!database) {
    res.status(500).send('Database uninitialized!');
    return;
  }
  database.collection('chatGroups').findOne(
    { _id: new ObjectID(roomId) },
    function (err, chatRoom) {
      if (err) res.status(500).send(err.toString());
      res.send(chatRoom);
    });
});

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
  database.collection('chatGroups').insertOne({
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
      res.send(result.ops[0]);
    }
  });
});

io.on('connection', (socket) => {
  console.log(socket.id,' a user connected');

  let socketTimer = setInterval(() => {
    // If socket disconnected not gracefully.
    if (!io.sockets.sockets[socket.id]) {
      clearInterval(socketTimer);
      let roomIds = Object.keys(socket.rooms);
      console.log(roomIds);
      database.collection('chatGroups').updateMany(
        // room id is a string with 24 hex characters.
        { _id: { $in: roomIds.filter((id) => id.length == 24).map(
          (id) => new ObjectID(id))} },
        { $inc: { numUsers: -1 } },
        { returnOriginal: false },
        function (err, docs) {
          // Do nothing
        });
    }
  }, 10000);

  // When socket disconnect.
  socket.on('disconnecting', function () {
    clearInterval(socketTimer);
    // room id is a string with 24 hex characters.
    let roomIds = Object.keys(socket.rooms);
    console.log(roomIds);
    database.collection('chatGroups').updateMany(
      { _id: { $in: roomIds.filter((id) => id.length == 24).map(
        (id) => new ObjectID(id))} },
      { $inc: { numUsers: -1 } },
      { returnOriginal: false },
      function (err, docs) {
        // Do nothing
      });
  });

  // Receive and send chat messages.
  socket.on('chat', function(roomId, uid, userName, iconName, msg){
    io.to(roomId).emit('chat', roomId, uid, userName, iconName, msg);
  });

  // Socket enter a specific room by room id.
  socket.on('room', function (roomId, userName, uid) {
    console.log(socket.id, ' joins ', roomId, ' userName:', userName);
    socket.join(roomId);
    database.collection('chatGroups').findOneAndUpdate(
      { _id: new ObjectID(roomId) },
      { $inc: { numUsers: 1 } },
      { returnOriginal: false },
      function (err, chatRoom) {
        io.to(roomId).emit('enterRoom', chatRoom.value.numUsers, roomId, uid, userName);
      });
  });

  // Quit a room.
  socket.on('quit', function (roomId) {
    console.log(socket.id, ' quit ', roomId);
    socket.leave(roomId);
    database.collection('chatGroups').findOneAndUpdate(
      { _id: new ObjectID(roomId) },
      { $inc: { numUsers: -1 } },
      { returnOriginal: false },
      function (err, chatRoom) {
        // Do nothing
      });
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log('Example app listening on port 8000!');
});
