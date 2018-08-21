var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 3000;
const https = require('https');
var request=require('request');
var yahoofinance=require('yahoo-finance');
var options=require('finance/lib/option-chain.js');
//var await=require('await');



todays_date=Date.now();

VIX_expirys=[Date.UTC(2018, 03, 9),Date.UTC(2018, 03, 21),Date.UTC(2018, 03, 28),Date.UTC(2018, 04, 04),Date.UTC(2018, 04, 11), Date.UTC(2018, 04, 18), Date.UTC(2018, 05, 16), Date.UTC(2018,06,20) ];

SPY_expirys=[];
prices={};
puts={} ; calls={}; put_strikes=[];
index_ticker='SPY';
vix_ticker='^VIX';

loss_percentage=20;

tickers=['blk', 'ge', 'aapl', 'fb'];
weights=[0.25, 0.25, 0.25, 0.25];
var spy_contract_size=100;

portfolio1={"tickers":tickers, "weights": weights};

calculate_index_hedge(portfolio1, loss_percentage)
get_yahoo_quotes(index_ticker);
get_yahoo_quotes(vix_ticker);

function get_yahoo_quotes(ticker){

yahoofinance.quote({
  symbol: ticker,
  modules: ['price']       // optional; default modules.
}, function(err, quote) {


  //console.log(quote.price.regularMarketPrice);
  process_yahoo_quotes(ticker,quote.price.regularMarketPrice)
  });
}

function calculate_index_hedge(portfolio, loss_percentage){

	tickers=portfolio.tickers;
	weights=portfolio.weights;
	console.log(tickers)
	var portfolio_value;

	// need to get the right expiry

	//spy..
	get_option_prices(index_ticker)
	
	//request data and compute portfolio values
	for(i=0;i<tickers.length;i++){
		get_yahoo_quotes(tickers[i])
	}

	

	var seconds = 5, the_interval = seconds *1000;
	
	setTimeout(function (){

	portfolio_value=get_portfolio_value(tickers); 
	hedge_strike=obtain_hedge_strike(prices[index_ticker], loss_percentage);


	console.log("Portfolio Value is" + portfolio_value);
	console.log("Current value of the index is"+ prices[index_ticker])
	console.log("Target strike prices is " + hedge_strike);



	index=obtain_closest_strike(put_strikes,hedge_strike);
	selected_put=puts[index];
	//console.log(selected_put)
	selected_put.HedgeContractNumber=obtain_number_contract(portfolio_value,selected_put.lastPrice,selected_put.strike,spy_contract_size);

	console.log(selected_put)	
	} ,the_interval);

	

}

function get_portfolio_value(tickers)

{	var portfolio_value=0;
	for(i=0;i<tickers.length;i++){
		portfolio_value += prices[tickers[i]]*weights[i];
	}

	return portfolio_value*1000
}


function process_yahoo_quotes(ticker,price)
{
	prices[ticker]=price;
	console.log(prices)
}

function process_puts(symbol){

	console.log("In put strike prices" + put_strikes)

	//obtain the strike price based on the loss protection setting 
	//process the put the data to obtain the relvant contract and its prices
	//calc number of contracts
	//send to client 
	//return 1
}


function obtain_hedge_strike(index_prices,loss_percentage) {	

	//return the strike prices for the hegde

	strike=index_prices-(index_prices*loss_percentage/100);
	console.log(strike);
	return strike
}


function obtain_closest_strike(put_strikes, hedge_strike)
{
	//put_strikes is an array of for strikes so we just search for the lowest abs different. 

	console.log(hedge_strike)
	var lowest_strike=put_strikes[0];
	
	var index;
	
	for (i=0;i<put_strikes.length;i++)
	{
		//console.log(lowest_strike);
		//console.log(put_strikes[i])
		if (Math.abs(hedge_strike-put_strikes[i])< Math.abs(hedge_strike-lowest_strike)){

		lowest_strike=put_strikes[i];
		index=i;
	}
	}
	return index;
}

function obtain_number_contract(portfolio_value,put_prices, put_strike,contract_size){

	number_contracts=portfolio_value/(put_prices*put_strike*contract_size);	
	number_contracts=Math.round(number_contracts);

	console.log('In obtain_number_contract')
	console.log("Portfolio value"+ portfolio_value);
	console.log('Put Strike'+ put_strike);
	console.log('Number of Contracts'+ number_contracts);

	console.log("Option premium/Hedge Cost" + number_contracts*put_prices*contract_size);

	if (number_contracts==0){
		number_contracts=number_contracts+1;
		console.log('Add error handling for the hedgeing'+ number_contracts+1)
	}


	return number_contracts
}

function get_expiry(expiry_dates){

	expiry_dates=expiry_dates;
	current_date=Date.now();
	console.log(current_date)
	days=10;
	days_threshold=days * 24 * 60 * 60*1000;
	console.log(days_threshold)

	for(i=0;i<expiry_dates.length;i++)
	{
		console.log(i)	

		if((expiry_dates[i]-current_date)>days_threshold){
			console.log(expiry_dates[i])
			return expiry_dates[i]
			break;
		}
	}

}



function get_option_prices(symbol){

	//get the right expiry 
	//expiry='2018-05-18'

options.getOptionChainFromYahoo({ symbol: symbol}, function (err, res) {
    if (!err) {

    	    
          
        n_calls=res.calls.length;
        n_puts=res.puts.length;
        console.log('Number of calls' + n_calls);
        console.log('Number of put' + n_puts);

        for (i=0;i<n_puts;i++)
        {

        	p=res.puts[i]

         if (p) { puts[i]=p
        // console.log(p)
         //console.log(puts[i].lastPrice)	
         //console.log(puts[i].contractSymbol)
         //console.log(puts[i].strike) 
         put_strikes.push(puts[i].strike)


         }


     }

     process_puts(symbol);
     
       //process_puts(puts, put_strikes, hedge_strike, portfolio_value)
      
              //  console.log(`First put: ${util.inspect(res.puts[6])}`);
    
}});

}//function get_option_prices

