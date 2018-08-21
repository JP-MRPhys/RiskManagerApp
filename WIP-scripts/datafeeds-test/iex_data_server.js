// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app      = express();
var MySQLStore = require('express-mysql-session')(session);
var port     = process.env.PORT || 3000;
var mysql =require('mysql')

var passport = require('passport');
var passportSocketIo = require('passport.socketio');

var flash    = require('connect-flash');
var request=require('request');
 
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var IntrinioRealtime = require('intrinio-realtime');

var marketdata={};
var live_portfolios={};
var marketdata_url='https://api.iextrading.com/1.0/tops';

var stock_symbol_url='https://api.iextrading.com/1.0/ref-data/symbols';

getstock_tickers(stock_symbol_url)

var alltickers={};


//kafka stuff
var avro = require('avsc'); //schema 
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


var consumer_options = {
  autoCommit: true,
  fetchMaxWaitMs: 10000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'buffer'
};

var consumer_topics = [{ topic: 'factors' }];
var consumer=new HighLevelConsumer(client,consumer_topics,consumer_options);

//replace this by get schema
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
        {"name": "betaupp", "type": "double"},
        {"name": "userid", "type": "string"}
        ]
}
var type2=avro.parse(portfolio_schema);
var factor_type=avro.parse(factor_schema);

// For this demo we just log producer errors to the console.
producer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});

producer.on('ready', function(){
  console.log("PRODUCER is ready")
})




var seconds = 2, the_interval = seconds *1000;
setInterval(function() {
  
  
  
  stream_market_data(marketdata_url);
//  console.log(live_portfolios.length);
 // update_active_portfolios();



}, the_interval);


var seconds2=1, the_interval2 = seconds2 *1000;
setInterval(function() {
  
  
  
  console.log(live_portfolios.length);
  update_active_portfolios();



}, the_interval2);




function getsocketids(user){

  //get valid socket ids to 
  var socketids=[];

  for(var id in userSockets) 
  {
      if(userSockets[id].user === user) 
      {
        socketids.push(id);

      }   
  }

    return socketids
}

function portfoliotosockets  (user,portfoliovalue)
{

  for(var id in userSockets) 
    {
      if(userSockets[id].user === user) 
      {
         socketid=userSockets[id].socket;
         io.to(socketid).emit('live_data2',portofoliovalue);

      }   
    }
}


function betastosockets  (user,betas)
{

  for(var id in userSockets) 
    {
      if(userSockets[id].user === user) 
      {
         socketid=userSockets[id].socket;
         io.to(socketid).emit('beta',betas);

      }   
    }
}

function updatesocketids(socketid){

  for(var id in userSockets) 
  {
      if(userSockets[id].socket===socketid) 
      {
        
        delete userSockets[id];
        break;


      }   
  }
}


function getuserfromSocketid(socketid){
  for(var id in userSockets) 
  {
      if(userSockets[id].socket===socketid) 
      {
        
        return userSockets[id].user;
        break;


      }   
  }
}


function create_sql_entries (data){

  var sql_entry=[];
  var weights=data.weights;
  var number_entry=weights.length;
  

  for (var i=0;i<number_entry;i++)
  { 
      var newuser=  [data.portfolioname,data.userid, data.tickers[i],data.weights[i]];
      sql_entry.push(newuser);
      
  }

  return sql_entry;

  }


function add_portfolio_to_database(data,create_sql_entries)
{
      return create_sql_entries(data);

}

function toSQL(data, mysqlconnection){

      console.log('DIAGONSIS: to SQL');  
      console.log([data]);
      var insertquery = "INSERT INTO portfolio (portfolioname, userid, ticker, weight) VALUES ?";

      mysqlconnection.query(insertquery,  [data], function (err, result) {
         if (err){ 

              console.log('MYSQL INSERT ERROR:'+err);
        }
        else{ 
          console.log("Number of records inserted: " + result.affectedRows);   
          //response.render('login');
          //probably set a flag for the charts some how and emit  
          //get portofolio list and send it to the sever
          //io.to(id).emit('portfolio_add', portfolio);
           console.log("Portfolio Added to the database")
           //Send a message back the the client for acknowlegdgement 
        }});


}


function toClient(socketid,portfolio){
//callback to send portfolio list to client
console.log("PORTFOLIO LIST");
console.log(portfolio);
console.log(socketid);
io.to(socketid).emit('portfolio_list', portfolio);

}




function getPortfolios(user,callback)
{
    console.log("Getting Portfolios");

    var sql_query = 'SELECT DISTINCT portfolioname FROM portfolio WHERE userid =?' //;  
   

    mysqlconnection.query(sql_query,[user],function(err,results){
      
      if (err) {  
                console.log(err);
                callback(err,null)
               }
      else
      {
          
          console.log(results);

          var rows=JSON.parse(JSON.stringify(results))
          console.log(rows.length);

          var portfolio_list=[];
          for (var i=0;i<rows.length;i++)
          {
            data=rows[i].portfolioname;
            
            console.log(data);
            portfolio_list.push(data);

          }

            return callback(null,portfolio_list); //returns are via callback
        
        }

    });

}

function portfolioListtoClient(username,socketid,callback)
{

    var portfolio=getPortfolios(username, function (err,portfolio){
       //this the callback function to get data  
        if (err){
          console.log('ERROR:during cannot find portofolio' + err) 
          }
          else {

           console.log('Send portfolio to client');

            return callback(socketid,portfolio);//this is what is assigned to variable  portfoliolist;
          }
        });
        //get portfolio list from SQL
      //return callback(socketid,portfolio);
}

function add_portfolio_to_streaming (username, portfolio, socketid){

  // get the weights and tickers and pass to the callback.
  queryTicker(username,portfolio,function(err,ticker,weights){



  if(err){
           console.log(err)
    }
    else
    {
          console.log("Obtained portfolio and weights for the portfolio:" + portfolio);
          console.log("Adding portfolio to live update list:" + portfolio);

          console.log(ticker);
          console.log(weights)

          live_portfolios[socketid]={
          "tickers" : ticker,
          "weights" : weights,
          "username": username,
          "socketid": socketid

    }
   


//    return callback(tickers,weights,socketid)  
    }

  });
}


function remove_portfolio_from_streaming (socketid){

          console.log('Removing')

          delete live_portfolio[socketid];  
   }


function calculate_lastest_portfolio(portfolio, callback){


      var tickers=portfolio.tickers;
      var weights=portfolio.weights;
      var user=portfolio.username;
      var socketid=portfolio.socketid;

      console.log(portfolio)

      console.log('Updating portfolios for ' + users + 'with socketid' + socketid);


      portfolio.previousvalue=portfolio.currentvalue;
      portfolio.currentvalue=0;

      console.log(portfolio)

      for (j=0;j<tickers.length;j++)
      {

        console.log(tickers[j])
        quote=marketdata[tickers[j]];

        console.log(quote)

        portfolio.currentvalue=portfolio.currentvalue+quote.mid*weights[j];

      }




      callback(portfolio.currentvalue, portfolio.previousvalue, portfolio.username, socketid) // send to kakfa
}


function update_active_portfolios(){

  portfolio_ids=Object.keys(live_portfolios);

  console.log('port'+ Object.keys(live_portfolios));


 for (var i=0; i<portfolio_ids.length;i++)
  {

      //cal new update portfolio value

      console.log(live_portfolios[portfolio_ids[i]]);
      calculate_lastest_portfolio(live_portfolios[portfolio_ids[i]],push_portfolio_kafka);

    
    }


}//update_portfolios

function push_portfolio_kafka(portfoliovalue, previousvalue, username, socketid){

//send portfolio _value to socket id  
if (previousvalue==0)
{ 
  var portfolio_return=0;
}
else{
var portfolio_return=(portfoliovalue-previousvalue)*100/previousvalue;
}

io.to(socketid).emit('live_data2',portfoliovalue);

//add to kafka
data2=   {spy:  marketdata['SPY'].returns,
         uso:   marketdata['USO'].returns, 
         gld:   marketdata['GLD'].returns,
         shy:   marketdata['SHY'].returns,
         tlt:   marketdata['TLT'].returns,
         agg:   marketdata['AGG'].returns,
         gsg:   marketdata['GSG'].returns,  
         upp:   marketdata['UUP'].returns, 
         portfolio:   portfolio_return, 
         timestamp: Date.now(),
         userid: socketid //username or socket id
      };

//add to kafka
data_mid=   {spy:  marketdata['SPY'].mid,
         uso:   marketdata['USO'].mid, 
         gld:   marketdata['GLD'].mid,
         shy:   marketdata['SHY'].mid,
         tlt:   marketdata['TLT'].mid,
         agg:   marketdata['AGG'].mid,
         gsg:   marketdata['GSG'].mid,  
         upp:   marketdata['UUP'].mid, 
         portfolio:   portfolio_return, 
         timestamp: Date.now(),
         userid: socketid //username or socket id
      };

data_random=   {spy:  Math.random(),
         uso:   Math.random(), 
         gld:   Math.random(),
         shy:   Math.random(),
         tlt:   Math.random(),
         agg:   Math.random(),
         gsg:   Math.random(),  
         upp:   Math.random(), 
         portfolio:   Math.random(), 
         timestamp: Date.now(),
         userid: socketid //username or socket id
      };



console.log(data_random)

 var messageBuffer = type2.toBuffer(data_random);

  // Create a new payload
  var payload = [{
    topic: 'tickdata',
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
      console.log('Procducer result: ', result)


    }
    
      });//producer send      
}

function gettickers(username, portfolio, socketid, callback){

  queryTicker(username,portfolio,function(err,ticker,weights){
   
  if(err){
    console.log(err)
    }
    else{

    return callback(tickers,weights,socketid)  
    }

  });

  
}

function queryTicker(username,portfolio, callback){

 console.log("Getting Portfolios for" + username + portfolio);

    var sql_query = 'SELECT ticker,weight FROM portfolio WHERE userid =? AND portfolioname=?' //;  

    console.log(sql_query)


    mysqlconnection.query(sql_query,[username,portfolio],function(err,results){
      
      if (err) {  
                console.log('Console log error while obtaining porfolio' + err);
             
               }
      else
      {
          
          console.log(results);

          var rows=JSON.parse(JSON.stringify(results))
          console.log(rows);
          console.log(rows.ticker);
          console.log(rows.weigth);

          var weights=[];tickers=[];
          for (var i=0;i<rows.length;i++)
          {
            var dummy1=rows[i].weight;
            var dummy2=rows[i].ticker;
           
            weights.push(dummy1);
            tickers.push(dummy2);

          }


            return callback(err,tickers,weights); //returns are via callback
        
        }

    });

}


function getstock_tickers(url) {


request.get(url,function(err,res,body)
{
  if(err) 
  {
    console.log(err)
  }//TODO: handle err
  
alltickers=JSON.parse(body);

console.log('Total number of stocks symbol:' + alltickers.length)

//console.log(alltickers)

//console.log(marketdata["VXX"]) 
 if(res.statusCode !== 200 ) {
    console.log('error in the res')

  }//etc
  
  //TODO Do something with response
});

}


function stream_market_data(url) {

console.log("Requesting market data");

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

//  if (json[i].symbol=='VXX'){

  //console.log(json[i])

  symbol=json[i].symbol;
  bid_price=json[i].bidPrice; 
  ask_price=json[i].askPrice;
  mid_price=(bid_price+ask_price)/2; 
  spread_price=bid_price-ask_price;
  volume=json[i].volume;


var quotes ={ "ticker" :  json[i].symbol, 
        "time"   :  json[i].lastUpdated, 
        "bid"   :   bid_price,
        "ask"   :   ask_price,
        "mid"   :   mid_price,
        "spread":   spread_price,
        "volume"  : volume,
        "exchange" : 'iex',
        "region": 'usa',
        "timestamp": Date.now()

      }

//quote_to_kafka(quotes)
calc_return(quotes,symbol)

//console.log(quotes)

//marketdata[symbol]=quotes;
      
//    }//if
}//for

console.log(marketdata['SPY'])


//console.log(marketdata["VXX"]) 
 if(res.statusCode !== 200 ) {
    console.log('error in the res')

  }//etc
  
  //TODO Do something with response
});

}




function stop_streaming(clientid)
{

  console.log('need to program stop streaming function')

  //get user using client id
  // see which portfolio was selected and stop streaming for that

}

// configuration ===============================================================
// connect to our database and session store
require('./config/passport')(passport); // pass passport for configuration

var mysqlconnection=passport.mysql_connection;

var sessionStore = new MySQLStore({
    checkExpirationInterval: 9000000,// How frequently expired sessions will be cleared; milliseconds.
    expiration: 86400000,// The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, passport.mysql_connection); 

//console.log(sessionStore)



 // set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
	key: 'connect.sid',
  secret: 'secret',
  store: sessionStore,
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


// launch ======================================================================se
var users=[]; var userSockets={}; //user sockets for the storing 
io.use(passportSocketIo.authorize({
  key: 'connect.sid',
  secret: 'secret',
  store: sessionStore,
  passport: passport,
  cookieParser: cookieParser
}));


io.on('connection',function(socket){

  var id=socket.id;
  var username=socket.request.user.username;
  var online=  (socket.request.user.logged_in);
  
  users.push(socket.id);
 
  userSockets[socket.id] = {
      "user": username,
      "socket": id
    };
  


  //console.log(users);
  console.log('Server: Connected new client:'+username);
  console.log('Server: Socket id for new Client:'+id);
  console.log('Server: Sockets and user:'+ userSockets);
  console.log('Server: list of the sockets for this user:'+ getsocketids(username));
    

  if (online==true)
  {
  //io.sockets.emit('server', username );
  io.to(id).emit('server', username);
  }


  portfolioListtoClient(username,socket.id, toClient);
  console.log('Select or create a portfolio in the client');
  
  socket.on('selected_portfolio', function(portfolio){

    console.log('Client selected the portfolio' + portfolio)
    console.log(portfolio);
    var socketid=socket.id;
    var username=socket.request.user.username;
    //add portfolio to the live update list

    add_portfolio_to_streaming(username,portfolio,socketid)

   })

  socket.on('portfolio',function(data){

  var id=socket.id;  
  console.log('Loging status:' + socket.request.user.logged_in);
  console.log('Client selected the portfolio');
  
  var userid=socket.request.user.username;
  var portfolio_name=data.portfolioname;
  

  var tickers=data.tickers;
  var weights=data.weights;



  console.log(tickers);
  console.log(weights);
  console.log(userid);
  console.log(portfolio_name);
  
  data.userid=userid;
  console.log("Add to the database");
  console.log(data);
  var sql_entry=add_portfolio_to_database(data,create_sql_entries);
  console.log(sql_entry);
  toSQL(sql_entry, mysqlconnection);

  
});//socket portfolio


  //disconnect
  socket.on('disconnect',function(){
  console.log('Server: disconnecting client' +socket.id);
  updatesocketids(socket.id)
  stop_streaming(socket.id);
 // users.slice(users.indexof(socket.id,1)); //updateusername function();
  });

  //client id
  socket.on('client',function(msg){
  console.log('Server: Message from client with id:' 
    + socket.id);
  console.log(msg);
  });

});//connection



consumer.on('message', function(message){


  console.log('Consumer messages');
  var buf = new Buffer(message.value, 'binary'); // Read string into a buffer.

  console.log(buf.slice(0))
  var decodedMessage = factor_type.fromBuffer(buf.slice(0)); // Skip prefix.
  console.log('factors from kakfka:' + decodedMessage);


  //send messages to client
  var beta=[];

  beta.push(decodedMessage.betaspy);
  beta.push(decodedMessage.betauso);
  beta.push(decodedMessage.betagld);
  beta.push(decodedMessage.betashy);
  beta.push(decodedMessage.betatlt);
  beta.push(decodedMessage.betaagg);
  beta.push(decodedMessage.betagsg);
  beta.push(decodedMessage.betaupp);
  beta.push(decodedMessage.betaspy);
  beta.push(decodedMessage.betauso);
  beta.push(decodedMessage.betagld);
  beta.push(decodedMessage.betashy);
  beta.push(decodedMessage.betatlt);
  beta.push(decodedMessage.betaagg);
  beta.push(decodedMessage.betagsg);
  beta.push(decodedMessage.betaupp);

  console.log(beta)

//   var socketid=getsocketid(users);
  socketid=decodedMessage.userid; 
  
  io.to(socketid).emit('beta',beta);


})

consumer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});


server.listen(port);
console.log('The magic happens on port ' + port);

function calc_return(Quote,symbol){

previousQuote=marketdata[symbol];

if(previousQuote){
    previous=previousQuote.mid;
    current=Quote.mid;
            
    if(previous==0){
      Quote.returns=0;

    } else{

        Quote.returns=(current-previous)*100/previous;
  }
}
else{

  Quote.returns=0;
}

marketdata[symbol]=Quote;


}



