var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;

const alpha= require('alphavantage')({key: 'UWNXHC8CSMKG4K3T'})

//tickers=['xle', 'xlk', 'xle', 'vnq', 'vgt', 'xlv', 'xli', 'xly'];
//'bac', 'ge', 'fb', 'appl', 'v', 'blk', 'nvda', 'goog', 'gov', 'mu', 'glw' ];







tickers=['0DJV','0DK9','BAC','GE'];
console.log(tickers.length)



var minutes = 1, the_interval = minutes  * 60*1000;
setInterval(function() {
  console.log("Requstion market data");
  
  streamdata(tickers)


}, the_interval);




var marketdata = {}


function streamdata(tickers){

for (var i=0;i<tickers.length;i++){
		requesttickdata(tickers[i]);
	}



//for (var i=0;i<tickers.length;i++){

//requesttickdata(tickers[i]);


//}

}

function requesttickdata(symbol){


setTimeout(function(){


console.log('requesting data for:' + symbol)

alpha.data.intraday(symbol).then(data=> {

console.log(data['Meta Data'])
var metadata= data['Meta Data']
var timeseries=data['Time Series (1min)']
var ticker=metadata['2. Symbol'];
var lastrefreshed=metadata['3. Last refreshed'];
var interval=metadata['4. Interval'];


var keys = Object.keys(timeseries);

console.log(keys[0])

var lastquote=timeseries[keys[0]]

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

console.log(marketdata)

//display all qoutes
	Object.keys(timeseries).forEach(function(key) {
  //console.log('Key : ' + key )

  var quote=timeseries[key];
  //console.log(quote) //quote contains following field 1. open, 2. high, 3. low, 4. close, 5. volume 
  //console.log('Symbol: ' + ticker + '  time: ' + key + '  Close : ' + quote['4. close'] + '  Volume : ' + quote['5. volume'] )

		})

});									//alpha data

},2000);							//delay

} 									//for

server.listen(port);
console.log('The magic happens on port ' + port);
