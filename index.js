'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {getSquireCord} = require('./lib/location.js');

const MongoClient = require('mongodb').MongoClient;
const DB_URL = process.env.MONGODB_URI;
let database = null;

MongoClient.connect(DB_URL, (err, db) => {
  database = db;
});

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/create-chat-room', (req, res) => {
  res.send('GET create chat room request');
});

app.get('/get-chat-rooms', (req, res) => {
  let {lat, lng, range} = req.query;
  if (!lat || !lng || !range) {
    res.status(500).send('Need params: lat, lng, range!');
  }
  if (!database) res.status(500).send('Database uninitialized!');
  let {top, btm, rgt, lft} = getSquireCord(parseFloat(lat), parseFloat(lng), parseFloat(range));
  database.collection('chatGroups').find({
    $and: [{lat: {$gt: btm, $lt: top}},
        {lng: {$gt:lft , $lt: rgt}}]})
    .toArray((err, docs) => {
      if (err) res.status(500).send(err.toString());
      res.send(docs);
    });
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(process.env.PORT || 8000, () => {
  console.log('Example app listening on port 8000!');
});
