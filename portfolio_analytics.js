var express  = require('express');
var app      = express();

var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 4000;

server.listen(port);
console.log('The magic happens on port ' + port);


var pa = require('portfolio-allocation');


var iex_data_feed=require('./iex_data.js');

console.log(iex_data_feed)