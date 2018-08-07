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

var kafka = require('kafka-node');
//var request= require('request');
var HighLevelProducer = kafka.HighLevelProducer;
var KeyedMessage = kafka.KeyedMessage;
var Client = kafka.Client;
var avroSchema2;

//create the avro schema
var type = avro.parse(portfolio_schema);
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
var count=1;
send_data=0;


producer.on('ready', function() {


console.log('producer is ready');


for (var i = 600; i >= 0; i--) {

  //var user;  
  console.log('Message:'+i)
  // Create message and encode to Avro buffer
  var x=Math.random();
  var y=Math.random()*100000;
  
  if (i % 2 === 0){
   var user='apple';

    } else 
{    var   user='pear';
}

if (i%3==0){

  user='orange';
}

  data= {spy:   Math.random(),
         uso:   Math.random(), 
         gld:   Math.random(),
         shy:   Math.random(),
         tlt:   Math.random(),
         agg:   Math.random(),
         gsg:   Math.random(),  
         upp:   Math.random(), 
         portfolio:   Math.random(), 
         timestamp: Date.now(),
         userid: user     }
  
  console.log(data);
  
  var messageBuffer = type.toBuffer(data);

  // Create a new payload
  var payload = [{
    topic: 'ticktest',
    messages: messageBuffer,
    attributes: 1 /* Use GZip compression for the payload */
  }];

  console.log("Send data" + send_data);

      //Send payload to Kafka and log result/error
  producer.send(payload, function(error, result) {
      
    console.info('Sent payload to Kafka: '+ count, payload);
    if (error) {
       console.log('Error in NodeJs Producer');
      console.error(error);
    } else {
      var formattedResult = result[0]
      console.log('Procducer result: ', result)


    }
    
      });

}//for
});//producer ready
// For this demo we just log producer errors to the console.
producer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});


