var PortfolioAllocation = require('./portfolio_allocation.dist.js');
var PortfolioAnalysis = require('./portfolio_analytics.dist.js');
const https = require('https');
var request=require('request');

/* Start Not to be used as is in Google Sheets */
var Portfolio_Optmization = Portfolio_Optmization || {};

Portfolio_Optmization = (function(self) {

self.marketdata_url='https://api.iextrading.com/1.0/tops';
self.stock_symbol_url='https://api.iextrading.com/1.0/ref-data/symbols';
self.historical_data_url='https://api.iextrading.com/1.0/stock/';

self.benchmark_ticker='SPY';
self.marketdata = {};
self.historical_data={};

self.historical_prices={};
self.historical_returns={};
self.benchmark_data={};//{"prices", "volume", "vwap", "returns"};





self.obtain_covmatrix=function(portfolio){


	tickers=portfolio.tickers;

	stock_returns=[];

	for (i=0;i<tickers.length;i++){
			
			
			ticker=tickers[i];
			data=self.historical_returns[ticker];
			stock_returns[i]=data;


			if (i==tickers.length-1){
			
				console.log("Returning completed  array for stock returns ..now computing cov" );

				cov=PortfolioAllocation.covarianceMatrix(stock_returns)
				console.log('COV:' + cov)

				return cov 
				break;

				
			}

		}
	}



self.return_portfolio=function(portfolio,callback){

	callback(portfolio)
}






	

self.optimize_portfolio=function(portfolio, callback){	

   //obtain benchmark data 
   self.get_historical_data_benchmark(self.historical_data_url, self.benchmark_ticker);


	console.log("Optimizing historical portofolio");

	self.get_historical_data(self.historical_data_url, portfolio);
	var seconds = 5, the_interval = seconds *3000;
	setTimeout(function (){

		console.log(callback)
		console.log("Update portfolio");
		optimial_portfolio=self.obtain_portfolio_value(portfolio,callback)
		

		//update_portfolio_historical(portfolio, print_callback)
	} ,the_interval);


} //optimize portfolio



self.obtain_portfolio_value=function(portfolio,callback)
{
		returns=[];
		var tickers=portfolio.tickers;

		for (var i=0; i<tickers.length;i++){
			if (i==0){
				returns=self.historical_returns[tickers[i]];
				portfolio_value=self.historical_prices[tickers[i]];
				console.log("Completed adding returns :"+ tickers[i])
			}
			else{

				returns=returns.SumArray(self.historical_returns[tickers[i]]);
				portfolio_value=portfolio_value.SumArray(self.historical_prices[tickers[i]]);
				console.log("Completed adding portfolio returns :"+ tickers[i])
				if(i==tickers.length-1) {

					console.log("Returns comptude now sending to optimzer")

					portfolio.returns=returns;
					portfolio.portfolio_value=portfolio_value;
					w=self.compute_optimal_weights(portfolio)
					portfolio=self.compute_portfolio_metrics(portfolio)
					
					portfolio.optimizeWeights=w;

					console.log("Optimization is complete returning the portfolio");
					//console.log(portfolio)
					callback( portfolio);
			

					}
			}

		}

}


self.compute_optimal_weights =function (portfolio){

	console.log("Compute optimal weights.....")

	cov=self.obtain_covmatrix(portfolio)


	optimization_option=0

	switch (optimization_option) {
    

    case 0:

         w=PortfolioAllocation.clusterRiskParityWeights(cov, {clusteringMode: 'ftca'});
         console.log("Tickers:"+ portfolio.tickers);
		 console.log("New weights:" + w);
		 console.log("old weights:" + portfolio.weights);	
		 console.log("Optimization using ftca completed");
		 return w;
                break;
    case 1:

    	 console.log("Optimization options yet to be completed")
      

                break;
    case 2:

    	 console.log("Optimization options yet to be completed")

        		break;
 
  }



}


self.compute_portfolio_metrics =function (portfolio){

	console.log("Computing portfolio metrics ....")


	portfolio_returns=portfolio.returns;
	portfolio_value=portfolio.portfolio_value;
	//console.log(portfolio_value)
	
	benchmark_value=self.benchmark_data.prices; //this is a global variable

	//compute the porfolio metrics	
	portfolio.max_drawndown=PortfolioAnalysis.maxDrawdown(portfolio.portfolio_value);
	portfolio.top5_drawndown=PortfolioAnalysis.topDrawdowns(portfolio.portfolio_value,5);
	portfolio.value_at_risk=PortfolioAnalysis.valueAtRisk(portfolio.portfolio_value, 0.5);
	//portfolio.cagr=PortfolioAnalysis.cagr(portfolio.portfolio_value);
	portfolio.sharp_ratio=PortfolioAnalysis.sharpeRatio(portfolio_value,benchmark_value);
	portfolio.gainToPainRatio=PortfolioAnalysis.gainToPainRatio(portfolio_value,benchmark_value);

	
   	console.log("Portfolio metrics are:");
   	console.log("maxDrawdown:" + portfolio.max_drawndown);
   	console.log("top 5 Drawdown:" + portfolio.top5_drawndown);
   	console.log("VaR:" + portfolio.value_at_risk);
   	console.log("CARG:" + portfolio.cagr);
   	console.log("Sharp Ratio:" + portfolio.sharp_ratio);
   	console.log("Gain to Pain Ratio:" + portfolio.gainToPainRatio);

   	return portfolio

}

Array.prototype.SumArray = function (arr) {

        var sum = this.map(function (num, idx) {
          return num + arr[idx];
        });

        return sum;
    }

self.get_historical_data =function(baseurl,portfolio){

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
	self.request_historical_data(url,ticker,weight)

	}//for 

}//gethistorical_data



self.request_historical_data=function(url,ticker,weight){

	console.log("Requestion historical data for " + ticker)

	request.get(url,function(err,res,body){

  	  if(err) 
  		{
  		console.log("Error in obtaining historical data for : " + ticker)
  		console.log("Error:" + err)
	  	}//TODO: handle err
  

	if(res.statusCode !== 200 ) {
  		console.log('error in the response of the historical data')

  		console.log(ticker)

  		}


  	stock=JSON.parse(body);

	//console.log(stock)

	//historical_data[ticker]=stock;


	self.process_historical_data(stock,ticker,weight)


	console.log('Obtained Historical data for:' + ticker)
	console.log(stock.length);


	return stock

	
	});

}


self.process_historical_data=function(stock, ticker,weight){

	var price=[],volume=[],returns=[],vwap=[];

	//console.log(stock[1])

	for (var i=0;i<stock.length;i++){

				price.push(stock[i].close*weight);
				volume.push(stock[i].close*weight);
				returns.push(stock[i].changePercent*weight);
				vwap.push(stock[i].vwap*weight);


			if (i==stock.length-1){

				//console.log(i)
				console.log("Returning completed creating array for:" + ticker)
				//console.log;

				self.historical_prices[ticker]=price;      //portfolio value
				self.historical_returns[ticker]=returns;   // portfolio returns
				
			}
	}
}

self.get_historical_data_yahoo =function(portfolio){

var tickers=portfolio.tickers;
var weights=portfolio.weights;


for (var i=0;i<tickers.length;i++)
{
	console.log(i)
	var ticker=tickers[i];
	var weight=weights[i];

	//https://api.iextrading.com/1.0/stock/aapl/chart/5y
	//above is the format of the url;
	//url=baseurl + ticker + '/chart/5y';

	fromDate='2013-03-22';
	toDate='2018-03-22';

	self.request_historical_data_yahoo(ticker,fromDate,toDate)

	}//for 

}//gethistorical_data

self.get_historical_data_yahoo=function(ticker, fromDate, toDate){

	console.log('Requesting historical data for:'+ ticker)

yahoofinance.historical({
  symbol: ticker,
  from: fromDate,
  to: toDate,
  period: 'd'
  // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
}, function (err, quotes) {
  
//   console.log(quotes[0])
	process_yahoo_historical_data(quotes,ticker)

});

}

self.process_yahoo_historical_data =function(stock, ticker){

	console.log('Obtanined data for ticker: ' + ticker 	+ '  data points: ' +stock.length)

	
	if (stock.length>0){
	console.log("Processing historical_data for:" + ticker)


	var price=[],volume=[],returns=[],vwap=[];


	for (var i=0;i<stock.length;i++){

				price.push(stock[i].close);
				volume.push(stock[i].volume);
				returns.push(stock[i].changePercent);
				vwap.push(stock[i].vwap);


			if (i==stock.length-1){

				//console.log(i)
				console.log("Returning completed creating array for bechmark:" + ticker)
				//console.log;

				self.benchmark_data.prices=price;
				self.benchmark_data.volume=volume;
				self.benchmark_data.vwap=vwap;
				self.benchmark_data.returns=returns;

				//console.log(benchmark_data.prices)
				
			}//innerif

		}//for


	}//outerif
}//function

self.get_historical_data_benchmark=function(baseurl,benchmark_ticker)
{


	console.log("Requestion benchmark_data data for " + benchmark_ticker)

	url= baseurl+ benchmark_ticker + '/chart/5y';

	request.get(url,function(err,res,body){

  	  if(err) 
  		{
  		console.log("Error in obtaining historical data for : " + benchmark_ticker)
  		console.log("Error:" + err)
	  	}//TODO: handle err
  

	  if(res.statusCode !== 200 ) {
  		console.log('error in the response of the historical data')

  		}


  	stock_data=JSON.parse(body);
  	//console.log(Object.keys(stock_data));


	self.process_historical_data_benchmark(stock_data,benchmark_ticker)
 	
   });

}

self.process_historical_data_benchmark =function (stock,ticker){

	var price=[],volume=[],returns=[],vwap=[];


	for (var i=0;i<stock.length;i++){

				price.push(stock[i].close);
				volume.push(stock[i].volume);
				returns.push(stock[i].changePercent);
				vwap.push(stock[i].vwap);


			if (i==stock.length-1){

				//console.log(i)
				console.log("Returning completed creating array for bechmark:" + ticker)
				//console.log;

				self.benchmark_data.prices=price;
				self.benchmark_data.volume=volume;
				self.benchmark_data.vwap=vwap;
				self.benchmark_data.returns=returns;

				//console.log(benchmark_data.prices)
				
			}

	}

}

   return self;
  
})(Portfolio_Optmization|| {});

 
if (typeof module !== 'undefined') {
  module.exports = Portfolio_Optmization;
}

/* flow of the code

 add bench to the obtained portfolio and then request data

1. optimize portfolio
2. request historical data
3. delay for the obtain all the data (might neeed to be optimized)
4. obtain_optimal_value	
4.1 once completed pass the returns and portfolio value


to do add 
1.check if the data is already there in the cache, then don't request that data.
2. Error checking if the the data for the stock not obtained, or delay is too late etc...

*/