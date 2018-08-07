var IntrinioRealtime = require('intrinio-realtime')
var express=require('express');
var app = express();  
var server = require('http').createServer(app); 

var avro = require('avsc');
var kafka = require('kafka-node');
var HighLevelProducer = kafka.HighLevelProducer;
var HighLevelConsumer = kafka.HighLevelConsumer;
var KeyedMessage = kafka.KeyedMessage;
var Client = kafka.Client;


var schema={
"type": "record",
"name": "portfolio",
"fields": [

        {"name": "spy", "type": "double"},
        {"name": "uso", "type": "double"},
		{"name": "gld", "type": "double"},
		{"name": "shy", "type": "double"},
		{"name": "tlt", "type": "double"},
        {"name": "agg", "type": "double"},
		{"name": "gsg", "type": "double"},
		{"name": "upp", "type": "double"},
        {"name": "portfolio", "type": "double"},
        {"name": "timestamp",  "type": "double"}

 ]
}


var type = avro.parse(schema);
    
//kafka
var client = new Client('localhost:2181', 'my-client-id', {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2
});

// For this demo we just log client errors to the console.
client.on('error', function(error) {
  console.error(error);
});

//producer
var producer = new HighLevelProducer(client);

//start the server        
var port=5500;
server.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });

// Create an IntrinioRealtime instance
var ir = new IntrinioRealtime({
  username: "d2dca9723f3b2b06066124991495dc24",
  password: "d249fce6267ac39c538536285b83e978",
})
//set the factors initially and then start streaming the data
var factors =["SPY", "USO", "GLD", "SHY", "TLT", "AGG", "GSG", "UUP"]
var tickers=["AAPL", "MSFT","GE","GS"];
var weights=[0.1, 0.2, 0.5, 0.2];
var lastprice=[];
var portofolioValue=0;
var spy,uso,gld,shy,tlt,agg,gsg,uup=0;
var timestamp;
var count=1;


for (var i=0;i<tickers.length;i++)
{
// Join channels
ir.join(tickers[i])
}

for (var i=0;i<factors.length;i++)
{
ir.join(factors[i])
}

console.log('portfolio:' + tickers);

//init prices
for (var i=0;i<tickers.length;i++)
	{	var init=0
		console.log(tickers[i]);
		console.log(weights[i]);
		lastprice[i]=init;
  	}
 console.log(lastprice);

  //function to update prices from real time streams

function update_prices(ticker, price, time)
{
		// check if the revieved price is of factors or ticker
			timestamp=time
			switch(ticker)
			{

			case "SPY": 
				spy=price; 
				break;
			case "USO": 
				uso=price; 
				break;
			case "GLD": 
				gld=price; 
				break;
			case "SHY": 
				shy=price; 
				break;
			case "TLT": 
				tlt=price; 
				break;
			case "AGG": 
				agg=price; 
				break;
			case "GSG": 
				gsg=price; 
				break;
			case "UUP": 
				uup=price; 
				break;
			default: //none of the factors check if the tickers in the portofolio
				for (var i=0;i<tickers.length;i++)
					{
						if (ticker==tickers[i])
							{
								lastprice[i]=price;
							}
							//return; or break
			     			break;
					}
			}

			}

function update_portofolio_value(producer, type){

    // we are send the the data to kafka broker we can change this to have a unique topic name	
    console.log("Portfolio:::::::::::::::::::");
    
	console.log("Portfolio value before:"+portofolioValue)
    var value=0;
    
	for (var i=0;i<lastprice.length;i++)
	{

		value=value+(lastprice[i]*weights[i]);

	}	
	portofolioValue=value;

	//create json of the portfolio value and json
	console.log("Portfolio value after:"+portofolioValue)


	tickData={
		//factors
		"spy":  spy,
		"uso":  uso,
		"gld" : gld,
		"shy" : shy,
		"tlt" : tlt,
		"agg" : agg,
		"gsg" : gsg,
		"upp" : uup,
		"portfolio": portofolioValue,
		"time":timestamp
	}
  console.log(tickData)

  var messageBuffer = type.toBuffer(tickData);

  // Create a new payload
  var payload = [{
    topic: 'tickdata',
    messages: messageBuffer,
    attributes: 1 /* Use GZip compression for the payload */
  }];

  //Send payload to Kafka and log result/error
  producer.send(payload, function(error, result) {
    console.info('Sent factor  to Kafka: '+ count, payload);
    if (error) {
      console.error(error);
    } else {
      var formattedResult = result[0]
      console.log('result: ', result)
    }
  });



}//update portfolio value




// For this demo we just log producer errors to the console.
producer.on('error', function(error) {
  console.log(error);
});

// Listen for quotes
ir.onQuote(function(quote,producer,type){
  var { ticker, type, price, size, timestamp } = quote
  if (quote.type=='last'){
  console.log("QUOTE: ", ticker, type, price, size, timestamp)
  update_prices(ticker,price, timestamp);
  update_portofolio_value(producer,type)
    
   }
})

for (var i=0;i<tickers.length;i++)
{
// Join channels
ir.join(tickers[i])
}

for (var i=0;i<factors.length;i++)
{
ir.join(factors[i])
}

