var express  = require('express');
var app      = express();

var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;

server.listen(port);
console.log('The magic happens on port ' + port);

var fstream =require('finance-stream');

var _=require('highland');

tickers=['YHOO', 'APPL'];
datatype=['symbol'];


console.log(fstream.stockTicker(tickers, datatype));
//	   .through(fstream.toFloat('Bid'))	
//	   .each(_.log);