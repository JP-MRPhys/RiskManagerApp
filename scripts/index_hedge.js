var express  = require('express');
var app      = express();
const https = require('https');
var request=require('request');
var yahoofinance=require('yahoo-finance');
var options=require('finance/lib/option-chain.js');
var finance=require('finance');
//var await=require('await');


var index_hedge= index_hedge || {};

index_hegde = (function(self) {

//get expiry from yahoo 


self.todays_date=Date.now();
self.VIX_expirys=[Date.UTC(2018, 03, 9),Date.UTC(2018, 03, 21),Date.UTC(2018, 03, 28),Date.UTC(2018, 04, 04),Date.UTC(2018, 04, 11), Date.UTC(2018, 04, 18), Date.UTC(2018, 05, 16), Date.UTC(2018,06,20) ];
self.SPY_expirys=[];
self.prices={};
self.puts={} ; self.calls={}; self.put_strikes=[];
self.index_ticker='^GSPC';
self.vix_ticker='^VIX'
self.historical_data={};
self.spy_contract_size=100;



self.get_yahoo_quotes=function(ticker){

yahoofinance.quote({
  symbol: ticker,
  modules: ['price']       // optional; default modules.
}, function(err, quote) {


  //console.log(quote.price.regularMarketPrice);
  self.process_yahoo_quotes(ticker,quote.price.regularMarketPrice)
  });
}



self.calculate_index_hedge=function(portfolio, loss_percentage){

	//get the quotes
	self.get_yahoo_quotes(index_ticker);
    self.get_yahoo_quotes(vix_ticker);


	tickers=portfolio.tickers;
	weights=portfolio.weights;
	console.log(tickers)
	var portfolio_value;

	// need to get the right expiry

	//spy..
	self.get_option_prices(index_ticker)
	
	//request data and compute portfolio values
	for(i=0;i<tickers.length;i++){
		self.get_yahoo_quotes(tickers[i])
	}

	

	var seconds = 5, the_interval = seconds *1000;
	
	setTimeout(function (){

	portfolio_value=self.get_portfolio_value(tickers); 
	hedge_strike=self.obtain_hedge_strike(prices[index_ticker], loss_percentage);


	console.log("Portfolio Value is" + portfolio_value);
	console.log("Current value of the index is"+ prices[index_ticker])
	console.log("Target strike prices is " + hedge_strike);



	index=self.obtain_closest_strike(put_strikes,hedge_strike);
	selected_put=self.puts[index];
	//console.log(selected_put)
	selected_put.HedgeContractNumber=obtain_number_contract(portfolio_value,selected_put.lastPrice,selected_put.strike,spy_contract_size);

	console.log(selected_put)	

	} ,the_interval);

	return selected_put
	

}

 self.get_portfolio_value=function(tickers)

{	var portfolio_value=0;
	for(i=0;i<tickers.length;i++){
		portfolio_value += prices[tickers[i]]*weights[i];
	}

	return portfolio_value*1000
}


 self.process_yahoo_quotes=function(ticker,price)
{
	self.prices[ticker]=price;
	console.log(prices)
}

 self.process_puts=function(symbol){

	console.log("In put strike prices" + put_strikes)

	//obtain the strike price based on the loss protection setting 
	//process the put the data to obtain the relvant contract and its prices
	//calc number of contracts
	//send to client 
	//return 1
}


 self.obtain_hedge_strike =function(index_prices,loss_percentage) {	

	//return the strike prices for the hegde

	strike=index_prices-(index_prices*loss_percentage/100);
	console.log("The strike prices of the put option is" +strike);
	return strike
}


self.obtain_closest_strike= function(put_strikes, hedge_strike)
{
	//put_strikes is an array of for strikes so we just search for the lowest abs different. 

	console.log(hedge_strike)
	var lowest_strike=self.put_strikes[0];
	
	var index;
	
	for (i=0;i<put_strikes.length;i++)
	{
		//console.log(lowest_strike);
		//console.log(put_strikes[i])
		if (Math.abs(hedge_strike-self.put_strikes[i])< Math.abs(hedge_strike-lowest_strike)){

		lowest_strike=self.put_strikes[i];
		index=i;
	}
	}
	return index;
}

self.obtain_number_contract=function(portfolio_value,put_prices, put_strike,contract_size){

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

 self.get_expiry=function (expiry_dates){

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



self. get_option_prices=function (symbol,expiry){

	//get the right expiry this needs to be completed based on timing information
	expiry='2018-03-16'

//options.getOptionChainFromYahoo({ symbol: symbol, expiration: expiry}, function (err, res) {
options.getOptionChainFromYahoo({ symbol: symbol}, function (err, res) {
    if (!err) {

    	    
          
        n_calls=res.calls.length;
        n_puts=res.puts.length;
        console.log('Number of calls' + n_calls);
        console.log('Number of put' + n_puts);

        for (i=0;i<n_puts;i++)
        {

        	p=res.puts[i]

         if (p) { self.puts[i]=p
        // console.log(p)
         //console.log(puts[i].lastPrice)	
         //console.log(puts[i].contractSymbol)
         //console.log(puts[i].strike) 
         self.put_strikes.push(puts[i].strike)


         }
     }

     //process_puts(symbol);
     
   }});
}//function get_option_prices

return self;

})



 
if (typeof module !== 'undefined') {
  module.exports = index_hegde;
}
