var express  = require('express');
var app      = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var port     = process.env.PORT || 2000;
const https = require('https');

var request=require('request');

var avro = require('avsc');
var kafka = require('kafka-node');
var HighLevelProducer = kafka.HighLevelProducer;
var HighLevelConsumer = kafka.HighLevelConsumer;
var KeyedMessage = kafka.KeyedMessage;
var Client = kafka.Client;


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

var stocks={};


//replace this by get schema
 var quote_schema={
"type": "record",
"name": "quote",
"fields": [
        {"name": "ticker", "type": "string"},
        {"name": "lastupdatetime", "type": "double"},
        {"name": "bid", "type": "double"},
        {"name": "ask", "type": "double"},
        {"name": "mid", "type": "double"},
        {"name": "spread", "type": "double"},
        {"name": "volume", "type": "double"},
        {"name": "exchange", "type": "string"},
        {"name": "region", "type": "string"},
        {"name": "timestamp", "type": "double"}
	]
}

 var portfolio_schema={
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
        {"name": "timestamp",  "type": "double"},
        {"name": "userid","type": "string" }

 ]
}

var type2=avro.parse(portfolio_schema);

var marketdata_url='https://api.iextrading.com/1.0/tops';
var stock_symbol_url='https://api.iextrading.com/1.0/ref-data/symbols';

var consumer_options = {
  autoCommit: true,
  fetchMaxWaitMs: 10000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'buffer'
};

var consumer_topics = [{ topic: 'marketdata' }];
var consumer=new HighLevelConsumer(client,consumer_topics,consumer_options);

console.log('Consumer created');

consumer.on('ready', function(){
console.log('Consumer is ready waiting for messages')

})

consumer.on('message', function(message){


  console.log('Consumer messages');
  var buf = new Buffer(message.value, 'binary'); // Read string into a buffer.

  console.log(buf.slice(0))
  var decodedMessage = type2.fromBuffer(buf.slice(0)); // Skip prefix.
  console.log('Quotes from kakfa:' + decodedMessage);






//   var socketid=getsocketid(users);


})

consumer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});







