var express  = require('express');
var app      = express();

var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 2000;
var IntrinioRealtime = require('intrinio-realtime');


tickers=['APPL', 'GE', 'BLK', 'GOOGL', 'V', 'MU', 'FB', 'SPY', 'GLD'];

var ir = new IntrinioRealtime({
  username: "d2dca9723f3b2b06066124991495dc24",
  password: "d249fce6267ac39c538536285b83e978",
  provider: "iex"
  });

server.listen(port);
console.log('The magic happens on port ' + port);

  //request_data
  for (var i=0;i<tickers.length;i++)
  {
  // Join channels
  ir.join(tickers[i])
  }
  
  ir.onQuote(quote => {

  var { ticker, type, price, size, timestamp } = quote
  console.log("QUOTE: ", ticker, type, price, size, timestamp);
  
  });//onquotes