var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;
const https = require('https');
var request=require('request');







var marketdata_url='https://api.iextrading.com/1.0/tops';
var stock_symbol_url='https://api.iextrading.com/1.0/ref-data/symbols';
var historical_data_url='https://api.iextrading.com/1.0/stock/';

var marketdata = {}; var tickers={}; var historical_data={};

//getstock_tickers(stock_symbol_url)
tickers=['aapl', 'googl', 'blk', 'v', 'fb', 'ge', 'brk.b'];
weights=[0.2, 0.2, 0.1, 0.1, 0.2, 0.01, 0.01];


portfolio={"tickers":tickers, "weights": weights};


//for (var i=0; i<tickers.length; i++){
//    console.log("Requesting historical data for:"+ ticker[i]);
//    gethistorical_data(historical_data_url,tickers[i]);
//}



//var seconds = 20, the_interval = seconds *1000;
//setInterval(function() {
  
//  console.log("Requesting market data");
//  console.log('Optimizing portfolio');
  optimize_portfolio(portfolio);
	//stream_market_data(marketdata_url)



//}, the_interval);



function quote_to_kafka(quote){

	console.log('send quote to kafka' + quote)

	 data2= {
 		 ticker:   quote["ticker"],
         lastupdatetime:   quote["time"], 
         bid:  quote["bid"],
         ask:  quote["ask"],
         mid:  quote["mid"],
         spread:  quote["spread"],
         volume:   quote["volume"],  
         exchange:  quote["exchange"] , 
         region:    quote["region"], 
         timestamp: quote["timestamp"]
         
      };

 //console.log(data2);

 var messageBuffer = type2.toBuffer(data2);

  // Create a new payload
 var payload = [{
    topic: 'marketdata',
    messages: messageBuffer,
    attributes: 1 /* Use GZip compression for the payload */
  }];      

        //Send payload to Kafka and log result/error
 producer.send(payload, function(error, result) {
      
  console.info('Sent payload to Kafka: '+  payload);
    if (error) {
      console.log('Error in NodeJs Producer');
      console.error(error);
    } else {
      var formattedResult = result[0]
      console.log('Producer result: ', result)


    }
    
  });//producer send
}


function update_portfolio_historical (portfolio) {


			console.log("Completed obtaining historical data... updating portfolio values")

			console.log(Object.keys(portfolio))


			var tickers=portfolio.tickers;
			var weights=portfolio.weights;
			var historical_data=portfolio.historical_data;
		
			first_stock=historical_data[tickers[0]];
			dates=Object.keys(first_stock)

			console.log(dates.length)

			for (var i=0;i<dates.length; i++){


				date=dates[i]
				portfolio.current_price[date]=0;

				for (j=0;j<tickers.length;j++)
			{

				console.log("Price for the current values is:" +historical_data[ticker[j].date]);
				prices=historical_data[ticker[j].date]	
     			portfolio.current_price[date]=portfolio.current_price[date]+prices;
			}

			}

			//compute the returns
			//callback(portfolio.current_price);

			

}




function stream_market_data(url) {

request.get(url,function(err,res,body)
{
  if(err) 
  {
  	console.log(err)
  }//TODO: handle err
  
var json=JSON.parse(body);

console.log('Number of tickers:' + json.length)

for (i=0;i<json.length;i++)

{

//	if (json[i].symbol=='VXX'){

	//console.log(json[i])

	symbol=json[i].symbol;
	bid_price=json[i].bidPrice; 
	ask_price=json[i].askPrice;
	mid_price=(bid_price+ask_price)/2; 
	spread_price=bid_price-ask_price;


var quotes ={ "ticker" :  json[i].symbol, 
			  "time"   :  json[i].lastUpdated, 
			  "bid"   :   bid_price,
			  "ask"   :   ask_price,
			  "mid"   :   mid_price,
			  "spread":   spread_price,
			  "volume"  : json[i].volume,
			  "exchange" : 'iex',
			  "region": 'usa',
			  "timestamp": Date.now()

			}

//quote_to_kafka(quotes)


//console.log(quotes)

marketdata[symbol]=quotes;
			
//		}//if
}//for

console.log(marketdata['BAC'])


//console.log(marketdata["VXX"]) 
 if(res.statusCode !== 200 ) {
  	console.log('error in the res')

  }//etc
  
  //TODO Do something with response
});

}


portfolio={}

var testportfolio ={ "tickers" : ["BAC", "GE", "BLK", "JPM", "MU", "FB"] , 
			  "weight"   :  [0.1,0.1,0.3,0.2,0.05,0.6], 
			  "user"   :     "test",
			  "currentvalue"   :   0,
			  "previousvalue"   :   0,
			  "return":   0
			  }


portfolio['test']=testportfolio;

factor_tickers=["uso", "gld", "shy", "tlt", "agg", "gsg", 'upp']; 
factor_initial=[0,0,0,0,0,0,0];

var factors ={ "factors" : factor_tickers, 
			   "current_price" : [], 
			   "returns": []
			  }


var update_factors=function(){

			var tickers=factors.tickers;

			for (j=0;j<tickers.length;j++){

				factors.previousvalue[i]=factors.currentvalue[i];	
				factor.currentvalue[i]=marketdata[tickers[i]].mid;
				factor.returns[i]=factor.currentvalue[i]-factors.previousvalue[i];


			}



}



var update_portfolios =function(){	


 for (var i=0; i<portfolio.length;i++)
	{


			var tickers=portfolio[i].tickers;
			var weights=portfolio[i].weights;
			var user=portfolio[i].user;

			console.log('Updating portfolios for ' + users)

			portfolio[i].previousvalue=portfolio[i].currentvalue;
			portfolio[i].currentvalue=0;

			for (j=0;j<tickers.length;j++)
			{

				portfolio[i].currentvalue=portfolio[i].currentvalue+marketdata[tickers[i]].mid*weights[i];

			}

		}

}//update_portfolios














var  getstock_tickers=function(url) {


request.get(url,function(err,res,body)
{
  if(err) 
  {
  	console.log(err)
  }//TODO: handle err
  
stocks=JSON.parse(body);

console.log('Total number of stocks symbol:' + stocks.length)

for (var i=0;i<stocks.length;i++)
{

	//if (stocks[i].symbol=="VXX")
	//{
	//	console.log(stocks[i])

	//}
}

//console.log(marketdata["VXX"]) 
 if(res.statusCode !== 200 ) {
  	console.log('error in the res')

  }//etc
  
  //TODO Do something with response
});

}


 function update_portfolio_historical (portfolio) {


			console.log("Completed obtaining historical data... updating portfolio values")

			console.log(Object.keys(portfolio))


			var tickers=portfolio.tickers;
			var weights=portfolio.weights;
			var historical_data=portfolio.historical_data;
		
			first_stock=historical_data[tickers[0]];
			dates=Object.keys(first_stock)

			console.log(dates.length)

			for (var i=0;i<dates.length; i++){


				date=dates[i]
				portfolio.current_price[date]=0;

				for (j=0;j<tickers.length;j++)
			{

				console.log("Price for the current values is:" +historical_data[ticker[j].date]);
				prices=historical_data[ticker[j].date]	
     			portfolio.current_price[date]=portfolio.current_price[date]+prices;
			}

			}

			//compute the returns
			//callback(portfolio.current_price);

			

}


var historical_returns =function(prices)
{

	console.log(prices)
}

function request_historical_data(url,ticker)
{


	console.log("Requestion historical data for " + ticker)

	request.get(url,function(err,res,body){
  	  if(err) 
  		{
  		console.log("Error in obtaining historical data for : " + ticker)
  		console.log("Error:" + err)
	  	}//TODO: handle err
  

	if(res.statusCode !== 200 ) {
  		console.log('error in the response of the historical data')

  		}


  	stock=JSON.parse(body);

	//console.log(stock)

	console.log('Historical data for:' + ticker)
	console.log(stock.length);

	historical_data[ticker]=stock;

	var keys=Object

	console.log(historical_data.keys)

});
}

function gethistorical_data(baseurl,portfolio){

var tickers=portfolio.tickers;
var weights=portfolio.weights;


for (var i=0;i<tickers.length;i++)
{

	console.log(i)
	var ticker=tickers[i];
	var weight=weights[i];
	//https://api.iextrading.com/1.0/stock/aapl/chart/5y
	//above is the format of the url;
	url=baseurl + ticker + '/chart/5y';

	request_historical_data(url,ticker)

	console.log(Object.keys(historical_data))

  //console.log('Logging the keys for historical data:' + Object.keys(historical_data))


  			//TODO Do something with response
	//}); //request
}//for 


}//gethistorical_data
	
function update_historical_portfolio2(stock_prices, portfolio, ticker, weight)
{



	for (var i=0;i<10; i++)
	{
				date=stock[i].date;
				price=stock[i].price;
				change_percent=stock[i].changePercent;
				console.log( ticker + ":"+ change_percent)
    // 			portfolio.daily_value[date]=portfolio.current_price[date]+prices*weight;
    // 			portfolio.returns[date]=portfolio.returns[date]*weight;
	}

}






function optimize_portfolio(portfolio){

	console.log("Optimizing historical portofolio");
	gethistorical_data(historical_data_url, portfolio, update_portfolio_historical);

	//keys=Object.keys(historical_data);

	//if (keys){
	//console.log('The portfolio returns are:'+ keys);	
	//}	

}

//}

module.exports={
	optimize_portfolio,
	getstock_tickers,
	gethistorical_data,
	update_portfolio_historical,
	update_portfolios,
	marketdata,
	historical_data,
	//stocks,
	stock_symbol_url,
	historical_data_url,
	marketdata_url
}

	