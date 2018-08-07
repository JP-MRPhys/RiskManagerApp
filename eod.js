
var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;
const https = require('https');




// Import socket.io with a connection to a channel (i.e. tops)
const socket = require('socket.io-client')('https://ws-api.iextrading.com/1.0/tops')

// Listen to the channel's messages
socket.on('message', function(message){

var json=JSON.parse(message);


//var keys=Object.keys(message)
console.log(json["symbol"]);

//console.log(lastquote)

var quotes ={ "ticker" : ticker, 
			  "time"   : keys[0], 
			  "open"   : lastquote['1. open'] , 
			  "high"   : lastquote['2. high'], 
			  "low"    : lastquote['3. low'], 
			  "close"  : lastquote['4. close'],
			  "volume"  : lastquote['5. volume'],
			  "interval": interval
			}

marketdata[symbol]=quotes;

console.log(marketdata);


})


	

// Connect to the channel
socket.on('connect', () => {

   //Subscribe to topics (i.e. appl,fb,aig+)
//   socket.emit('subscribe', 'snap,fb')

  // Unsubscribe from topics (i.e. aig+)
  //socket.emit('unsubscribe', 'aig+')
})

// Disconnect from the channel
socket.on('disconnect', () => console.log('Disconnected.'))


var url='https://api.iextrading.com/1.0/tops'

var request=require('request');

request.get(url,function(err,res,body){
  if(err) 
  {
  	console.log(err)
  }//TODO: handle err
  
var json=JSON.parse(body);

for (i=0;i<json.length-100;i++){

	if (json[i].symbol=='BAC'){

		
	}


	console.log(json[i])


}

  if(res.statusCode !== 200 ) {
  	console.log('error in the res')

  }//etc
  //TODO Do something with response
});

 
