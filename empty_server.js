var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;

const https = require('https');
var request=require('request');

console.log("The server is up and running on port:"+ port)

var PortfolioAllocation = require('./scripts/portfolio_allocation.dist.js');
var PortfolioAnalysis = require('./scripts/portfolio_analytics.dist.js');
var Portfolio_Optmization=require('./scripts/Portfolio_Optmization.js');
var index_hedge=require('./scripts/index_hedge.js')

//tickers=['GOOGL', 'VGT', 'MU', 'SPY'];
//weights=[0.25, 0.25, 0.25, 0.25];




tickers=['VGT', 'GOOGL', 'BLK', 'V', 'BAC', 'SEDG', 'MU', 'MSFT', 'GLW', 'INTC']
weights=[0.1132,0.377358,0.188679,0.0754717, 0.037,0.03358,0.037758,0.037758, 0.037758, 0.0566038];
portfolio={'tickers': tickers, 'weights': weights};

console.log(index_hedge)
console.log(Portfolio_Optmization)



function show (data){

	console.log('in callback function to show the data')

console.log(data)
}

//Portfolio_Optmization.optimize_portfolio(portfolio,show);





