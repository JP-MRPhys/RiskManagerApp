var express  = require('express');
var server = require('http').createServer(app);  


server.listen(port);
console.log('The magic happens on port ' + port);
var port     = process.env.PORT || 3000;

var yahoofinance=require('yahoo-finance');