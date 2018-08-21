var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;
const https = require('https');
var request=require('request');


var PortfolioAllocation = require('./scripts/portfolio_allocation.dist.js');
var PortfolioAnalysis = require('./scripts/portfolio_analytics.dist.js');

var marketdata_url='https://api.iextrading.com/1.0/tops';
var stock_symbol_url='https://api.iextrading.com/1.0/ref-data/symbols';
var historical_data_url='https://api.iextrading.com/1.0/stock/';
var marketdata = {}; var tickers={}; var historical_data={};

//getstock_tickers(stock_symbol_url)
tickers=['blk', 'amgn', 'gld', 'vpu', 'ba', 'vgt', 'bac', 'nvda', 'spy', 'v', 'msft', 'ms', 'gs'];
weights=[0.1, 0.1, 0.1, 0.1, 0.05 , 0.05, 0.1, 0.1, 0.1, 0.1, 0.01, 0.1, 0.01,0.01];

var benchmark_ticker='SPY';

historical_prices={};
historical_data={};
historical_returns={};
benchmark_data={};//{"prices", "volume", "vwap", "returns"};


portfolio1={"tickers":tickers, "weights": weights};

getBenchmarkdata(historical_data_url,benchmark_ticker)
optimize_portfolio(portfolio1);




function request_historical_data(url,ticker,weight){

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


	process_historical_data(stock,ticker,weight)


	console.log('Obtained Historical data for:' + ticker)
	console.log(stock.length);


	return stock

	
	});

}


function process_historical_data(stock, ticker,weight){

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

				historical_prices[ticker]=price;      //portfolio value
				historical_returns[ticker]=returns;   // portfolio returns
				
			}
	}
}


function obtain_covmatrix(portfolio){


	tickers=portfolio.tickers;

	stock_returns=[];

	for (i=0;i<tickers.length;i++){
			
			
			ticker=tickers[i]
			console.log(ticker)
			data=historical_returns[ticker];
			console.log(data.length)

			stock_returns[i]=data;
			console.log(stock_returns.length)

			if (i==tickers.length-1){
				console.log(Object.keys(stock_returns))

				console.log(stock_returns[1])
				//console.log(i)
				console.log("Returning completed  array for stock returns ..now computing cov" );

				//console.log(stock_returns.length)
					


				//cov=PortfolioAllocation.covarianceMatrix(historical_returns['amzn'],historical_returns['fb'])
				cov=PortfolioAllocation.covarianceMatrix(stock_returns)
				//cov=PortfolioAllocation.covarianceMatrix(stock_returns)

				console.log('COV:' + cov)

				//sigma=cov.data

				//console.log(sigma.length)

				weight=PortfolioAllocation.clusterRiskParityWeights(cov, {clusteringMode: 'ftca'});

				console.log("Tickers:"+ tickers)

				console.log("New weights:" + weight)

				console.log("old weights:" + portfolio.weights)


//				console.log(PortfolioAllocation.covarianceMatrix([10,01,10],[10,10,10]))

				
				//console.log;

				//return portfolio_allocation.covarianceMatrix(stock_returns);

				
			}

		}
	}




function process_historical_data_benchmark (stock,ticker){

	var price=[],volume=[],returns=[],vwap=[];

	console.log(stock[1])

	for (var i=0;i<stock.length;i++){

				price.push(stock[i].close);
				volume.push(stock[i].volume);
				returns.push(stock[i].changePercent);
				vwap.push(stock[i].vwap);


			if (i==stock.length-1){

				//console.log(i)
				console.log("Returning completed creating array for bechmark:" + ticker)
				//console.log;

				benchmark_data.prices=price;
				benchmark_data.volume=volume;
				benchmark_data.vwap=vwap;
				benchmark_data.returns=returns;

				//console.log(benchmark_data.prices)
				
			}

	}

}




function get_historical_data(baseurl,portfolio){

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
	request_historical_data(url,ticker,weight)

	}//for 

}//gethistorical_data
	

function optimize_portfolio(portfolio){

	console.log("Optimizing historical portofolio");

	get_historical_data(historical_data_url, portfolio);
	ticker=portfolio.tickers;

	var seconds = 5, the_interval = seconds *3000;
	
	setTimeout(function (){

		console.log("Update portfolio");
		obtain_portfolio_value(portfolio)

		//update_portfolio_historical(portfolio, print_callback)
	} ,the_interval);




} //optimize portfolio


function obtain_portfolio_value(portfolio)
{
		returns=[];
		var tickers=portfolio.tickers;

		for (var i=0; i<tickers.length;i++){
			if (i==0){
				returns=(historical_returns[tickers[i]]);
				portfolio_value=(historical_prices[tickers[i]]);
				console.log("Completed adding returns :"+ tickers[i])
			}
			else{

				returns=returns.SumArray(historical_returns[tickers[i]]);
				portfolio_value=portfolio_value.SumArray((historical_prices[tickers[i]]));
				console.log("Completed adding portfolio returns :"+ tickers[i])
				if(i==tickers.length-1) {

					console.log("Returns comptude now sending to optimzer")

					portfolio.returns=returns;
					portfolio.portfolio_value=portfolio_value;
					compute_optimal_weights(portfolio)
						
					}
			}

		}

}


function compute_optimal_weights (portfolio){
	console.log("Compute optimal weights")
	console.log(Object.keys(portfolio))
	console.log(portfolio.returns.length)
	//console.log(portfolio.returns)

	portfolio_returns=portfolio.returns;
	portfolio_value=portfolio.portfolio_value;
	console.log(portfolio_value)
	//var w = PortfolioAllocation.riskBudgetingWeights([[0.1,0], [0,0.2]], [0.25, 0.75]);
	//console.log(r)

	benchmark_value=benchmark_data.prices; //this is a global variable

	//compute the porfolio metrics	
	portfolio.max_drawndown=PortfolioAnalysis.maxDrawdown(portfolio.portfolio_value);
	portfolio.top5_drawndown=PortfolioAnalysis.topDrawdowns(portfolio.portfolio_value,5);

	portfolio.value_at_risk=PortfolioAnalysis.valueAtRisk(portfolio.portfolio_value, 0.5);
	portfolio.cagr=PortfolioAnalysis.cagr(portfolio.portfolio_value, 0.5);


	portfolio.sharp_ratio=PortfolioAnalysis.sharpeRatio(portfolio_value,benchmark_value);
	portfolio.gainToPainRatio=PortfolioAnalysis.gainToPainRatio(portfolio_value,benchmark_value);

	obtain_covmatrix(portfolio)
    
	setTimeout(function (){

		console.log("Portfolio metrics are:");
		
		console.log("maxDrawdown:" + portfolio.max_drawndown);
		console.log("top 5 Drawdown:" + portfolio.top5_drawndown);

		console.log("VaR:" + portfolio.value_at_risk);
		console.log("CARG:" + portfolio.cagr);
		console.log("Sharp Ratio:" + portfolio.sharp_ratio);
		console.log("Gain to Pain Ratio:" + portfolio.gainToPainRatio);

		//update_portfolio_historical(portfolio, print_callback)
	} ,1000);


	optimization_option=2

	switch (optimization_option) {
    

    case 0:



                break;
    case 1:

        var aa=PortfolioAnalysis.maxDrawdown(b);
	    console.log('maxDrawdown for bench mark is:' + aa);

                break;
    case 2:

    	console.log("Optimization options yet to be completed")

        		break;
 
  }



}


Array.prototype.SumArray = function (arr) {

        var sum = this.map(function (num, idx) {
          return num + arr[idx];
        });

        return sum;
    }


function getBenchmarkdata(baseurl,benchmark_ticker)
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


	process_historical_data_benchmark(stock_data,benchmark_ticker)
 	
   });

}

/* flow of the code

 add bench to the obtained portfolio and then request data

1. optimize portfolio
2. request historical data
3. delay for the obtain all the data (might neeed to be optimized)
4. obtain_optimal_value	
4.1 once completed pass the returns and portfolio value


to do add 
1.check if the data is already there in the cache, then don't request that date.
2. Error checking if the the data for the stock not obtained, or delay is too late etc...

*/