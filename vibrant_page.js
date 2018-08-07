var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 5000;
const https = require('https');
var request=require('request');
var yahoofinance=require('yahoo-finance');
var fs = require('fs');
var PortfolioAllocation = require('./scripts/portfolio_allocation.dist.js');
var PortfolioAnalysis = require('./scripts/portfolio_analytics.dist.js');

var max_data_points=0;
//var options=require('./finance/lib/option-chain.js');

historical_data={}; 
historical_returns={};
historical_prices={};
benchmark_ticker='^NSEI';

tickers=[
'HMVL.NS',
'PEL.NS',
'PENIND.NS',
'HGS.NS',
'TDPOWERSYS.NS',
'CAPF.NS',
'COROMANDEL.NS',
'TATACOMM.NS',
'SINTEX.NS',
'KDDL.NS',
'GESHIP.NS',
'J&KBANK.NS',
'TFCILTD.NS',
'PIXTRANS.BO',
'COX&KINGS.NS',
'PENPEBS.NS',
'CHEMBOND.BO',
'KWALITY.NS',
'CARERATING.NS',
'HCG.NS',
'SHEMAROO.NS'
]

weights=[
0.05,
0.05,
0.053,
0.025,
0.025,
0.025,
0.025,
0.025,
0.028,
0.1,
0.025,
0.025,
0.05,
0.025,
0.025,
0.05,
0.05,
0.025,
0.05,
0.05,
0.05]

Array.prototype.SumArray = function (arr) {

        var sum = this.map(function (num, idx) {
          return num + arr[idx];
        });

        return sum;
    }


function SumArray(a, b) {
      var c = [];
      for (var i = 0; i < Math.max(a.length, b.length); i++) {
        c.push((a[i] || 0) + (b[i] || 0));
      }
      return c;
}

function scalarMultiply(arr, multiplier) {
   for (var i = 0; i < arr.length; i++)
   {
      arr[i] *= multiplier;
   }
   return arr;
}

function getReturns(ticker,required_length){

console.log(ticker);



data=historical_returns[ticker];

console.log(data.length)

if (data.length<required_length-1)
{
	console.log('Data legnth is less than required length padding zeros')
	for (var i=data.length;i<required_length-1;i++)
	{
		data.push(0); // just padd the returns to zero this is likely to affect the correlation martix 

		if (i==required_length-1)
		{
			return data;
			console.log(data.length)
		}

	}

}
if (data.length==required_length-1){

	return data
	console.log("Returns are of the same legnth returning")
	console.log(data.length);

	}

}

obtain_covmatrix=function(portfolio){


	console.log("Computing CoV matrix")
	console.log("Data length" + max_data_points)
	tickers=portfolio.tickers;

	stock_returns=[];

	for (i=0;i<tickers.length;i++){
			
			
			ticker=tickers[i];
			//data=historical_returns[ticker];
			data=getReturns(ticker,max_data_points);
			stock_returns[i]=data;
			console.log(data.length);


			if (i==tickers.length-1){
			
				console.log("Returning completed  array for stock returns ..now computing cov" );


				cov=PortfolioAllocation.covarianceMatrix(stock_returns)
				//console.log('COV:' + cov)

				return cov 
				break;

				
			}

		}
	}



portfolio={'tickers': tickers, 'weights': weights, 'benchmark_ticker': benchmark_ticker};


function removeNaN(data){

	for (var i=0;i<data.length;i++)
		{
		if (!isFinite(data[i]))
			{

				data[i]=0;

			}

		}
}
//var await=require('await');
obtain_portfolio_value=function(portfolio)
{
		

		cov=obtain_covmatrix(portfolio);
		portfolio.optimizeWeights=PortfolioAllocation.clusterRiskParityWeights(cov, {clusteringMode: 'ftca'});

		returns=[];portfolio_value=[];


		var tickers=portfolio.tickers;
		var weights=portfolio.weights;
	
		console.log("In portfolio_value Optimization")
		
		
		
		for (var i=0; i<tickers.length;i++){
			if (i==0){
				returns=scalarMultiply(historical_returns[tickers[i]], weights[i]);
				portfolio_value=scalarMultiply(historical_prices[tickers[i]],weights[i]);
				console.log("Completed adding returns :"+ tickers[i])
			}
			else{

				returns=SumArray(returns,scalarMultiply(historical_returns[tickers[i]],weights[i]));
				portfolio_value=SumArray(portfolio_value,scalarMultiply(historical_prices[tickers[i]],weights[i]));

				//returns=returns.SumArray(historical_returns[tickers[i]]);
				
				//portfolio_value=portfolio_value.SumArray(historical_prices[tickers[i]]);
				
				console.log("Completed adding portfolio returns :"+ tickers[i])
				
				if(i==tickers.length-1) {

					console.log("Returns comptude now sending to optimzer")

					portfolio.returns=returns;
					portfolio.portfolio_value=portfolio_value;




						//compute the porfolio metrics	
				portfolio.max_drawndown=PortfolioAnalysis.maxDrawdown(portfolio.portfolio_value);
				portfolio.top5_drawndown=PortfolioAnalysis.topDrawdowns(portfolio.portfolio_value,5);
				portfolio.value_at_risk=PortfolioAnalysis.valueAtRisk(portfolio.portfolio_value, 0.15);
				//portfolio.cagr=PortfolioAnalysis.cagr(portfolio.portfolio_value);
				portfolio.sharp_ratio=PortfolioAnalysis.sharpeRatio(simulated_data(portfolio_value.length),simulated_data(portfolio_value.length));
				//portfolio.gainToPainRatio=PortfolioAnalysis.gainToPainRatio(simulated_data(portfolio_value.length));

	
   				console.log("Portfolio metrics are:");
   					
   				console.log("maxDrawdown:" + portfolio.max_drawndown);
   				console.log("top 5 Drawdown:" + portfolio.top5_drawndown);
   			    console.log("VaR:" + portfolio.value_at_risk);
   	            //console.log("CARG:" + portfolio.cagr);
   	            console.log("Sharp Ratio:" + portfolio.sharp_ratio);
   	            //console.log("Gain to Pain Ratio:" + portfolio.gainToPainRatio);
   	            console.log('Optimized Portfolio weights:' + portfolio.optimizeWeights);
         		console.log("Optimization is complete returning the portfolio");

					//console.log(portfolio_value);

					//console.log(portfolio_value)
					//return portfolio;

					}
			}

		}

}


function get_historical_data_yahoo(tickers, benchmark_ticker, fromDate, toDate){

	tickers[tickers.length]=benchmark_ticker; //add the benchmark ticker at the end



	yahoofinance.historical({
  	symbols: tickers, 
  	from: '2013-03-21',//fromDate,
  	to:   '2018-03-21',//toDate,
  	period: 'd'
  	}, function (err, data) {
  

  	keys=(Object.keys(data));
	console.log('Total number of stock recieve' + keys)

	for (var i=0; i<keys.length;i++){

		stock=data[keys[i]];
		length=stock.length;
		console.log(stock[length-1])

		if (length>max_data_points){
			max_data_points=length;
		}	
	
		process_yahoo_historical_data(stock)


		if (i==keys.length-1){

			console.log(max_data_points)

			obtain_portfolio_value(portfolio);

		}
	}

})
}

function simulated_data(length){

	data=[]

	for (var i=0;i<length;i++)
	{

		data.push((Math.random()*100));
		
		if (i==length-1){
			return data;
		}
	}
}


function percentageChange(currentprice,previousprice){


		returns=((currentprice-previousprice)/previousprice);
			if (isFinite(returns))
			{
				return returns;
				
			}
			else
				 return 0;

}


function logReturns(currentprice,previousprice)
{
	ret=Math.log(currentprice/previousprice);
	if (isFinite(ret)){
		return ret;
	
	}

		else{
			return 0;
		
		}

	}


function process_yahoo_historical_data(data)
{

	var price=[],volume=[],returns=[],vwap=[];
	ticker=data[0].symbol;
	console.log('ticker: ' + ticker 	+ '  data points: ' +data.length)

	if (data.length>0)
	{


		for (var i=0; i<data.length;i++)
		{
	
				price.push(data[i].adjClose);
				volume.push(data[i].volume);
					if (i>0)
					{
						returns.push(logReturns(price[i],price[i-1]));
					}


			
					if (i==data.length-1)
					{

					//console.log(i)
					console.log("Returning completed creating array for stock:" + ticker)
					console.log(price)
				
					historical_prices[ticker]=price;      //portfolio value
					historical_returns[ticker]=returns;   // portfolio returns
					}//innerif
		}
	}
}

console.log("Portfolio Optimization for vibrant securities")
console.log('Number of tickers:' + tickers.length);
console.log('Number of tickers:' + weights.length);
get_historical_data_yahoo(tickers, benchmark_ticker)

//console.log(tickers)




