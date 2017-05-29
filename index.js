'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {DB_USERNAME, DB_PASSWORD} = require('./config/mongodb.js');
const {getSquireCord, mBetweenCoords} = require('./lib/location.js');

const MongoClient = require('mongodb').MongoClient;
const DB_URL = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@ds155961.mlab.com:55961/heroku_qjtg66vs`;
let database = null;
const bodyParser = require('body-parser')

MongoClient.connect(DB_URL, (err, db) => {
  database = db;
});

// Add headers
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

app.get('/',function(req,res){
    res.redirect('https://446daydayup.github.io/');
})

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
      groups.filter((group) =>
          mBetweenCoords(group.lat, group.lng, lat, lng) < range);
      res.send(groups);
    });
});

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
  }, (err, result) => {
    if (err) {
      res.status(500).send('Inser error: ', err.toString());
    } else {
      res.send(result.insertedIds[0]);
    }
  });
});

io.on('connection', (socket) => {
  socket.on('chat', function(msg){
    console.log('message: ' + msg);
  });
  console.log('a user connected');
});

server.listen(process.env.PORT || 8000, () => {
  console.log('Example app listening on port 8000!');
});
