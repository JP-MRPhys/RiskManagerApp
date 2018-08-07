var avroSchema = {
   name: 'tickdata',
   type: 'record',
   fields: [
     {
       name: 'beta',
       type: 'double'
     }, {
       name: 'timestamp',
       type: 'double'
     }, {
       name: 'last',
       type: 'double'
     },{
       name: 'volume',
       type: 'double'
     }
     ]
 };


 var factor_schema={
"type": "record",
"name": "factor",
"fields": [

        {"name": "betaspy", "type": "double"},
        {"name": "betauso", "type": "double"},
        {"name": "betagld", "type": "double"},
        {"name": "betashy", "type": "double"},
        {"name": "betatlt", "type": "double"},
        {"name": "betaagg", "type": "double"},
        {"name": "betagsg", "type": "double"},
        {"name": "betaupp", "type": "double"}
        ]
}

var express=require('express');
var avro = require('avsc');
var kafka = require('kafka-node');
//var request= require('request');
var HighLevelProducer = kafka.HighLevelProducer;
var HighLevelConsumer = kafka.HighLevelConsumer;
var kafka_consumer= kafka.consumer;
var KeyedMessage = kafka.KeyedMessage;
var Client = kafka.Client;

var app = express();  
var server = require('http').createServer(app);  
var request=require('sync-request')

//start the server        
var port=5500;
server.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });

//create the avro schema
var type = avro.parse(avroSchema);
var factor_type=avro.parse(factor_schema);


var options = {
  autoCommit: true,
  fetchMaxWaitMs: 10000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'buffer'
};

var client = new Client('localhost:2181', 'my-client-id', {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2
});

// For this demo we just log client errors to the console.
client.on('error', function(error) {
  console.error('Client' + error);
});


var consumer_topics = [{ topic: 'factors' }];

var consumer=new HighLevelConsumer(client,consumer_topics,options);

consumer.on('message', function(message){



  var buf = new Buffer(message.value, 'binary'); // Read string into a buffer.

  console.log(buf.slice(0))
  var decodedMessage = factor_type.fromBuffer(buf.slice(0)); // Skip prefix.
  console.log('factor consumer:' + decodedMessage);
})

consumer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});


