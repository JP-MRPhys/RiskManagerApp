var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;



var  https = require('https');
var request=require('request');

console.log("The server is up and running on port:"+ port)

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('22d235b3a9a045268623ecc02b42eb3e');

newsapi.v2.topHeadlines({

 q: 'tesla',
  sources: 'bloomberg,bbc-news,the-verge, cnbc',


}).then(response => {
  console.log(response);
  /*
    {
      status: "ok",
      articles: [...]
    }
  */
});




tickers=['VGT', 'GOOGL', 'BLK', 'V', 'BAC', 'SEDG', 'MU', 'MSFT', 'GLW', 'INTC']

