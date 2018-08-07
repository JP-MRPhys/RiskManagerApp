var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;
const https = require('https');
var request=require('request');


var Portfolio_Optimzation = require('./scripts/Portfolio_Optmization.js');


//getstock_tickers(stock_symbol_url)
tickers=['blk', 'amgn', 'gld', 'vpu', 'ba', 'vgt', 'bac', 'nvda', 'spy', 'v', 'msft', 'ms', 'gs'];
weights=[0.1, 0.1, 0.1, 0.1, 0.05 , 0.05, 0.1, 0.1, 0.1, 0.1, 0.01, 0.1, 0.01,0.01];



portfolio1={"tickers":tickers, "weights": weights};
function show(p){
	console.log("In the callback")
}

get_1(portfolio1,show)

function get_1(portfolio, callback)
{
p=(Portfolio_Optimzation.optimize_portfolio(portfolio));
callback(p)

}


