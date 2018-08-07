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

// 
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var IntrinioRealtime = require('intrinio-realtime');


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
        {"name": "betaupp", "type": "double"}
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

//now the program starts
//initialise variabless
var lasprices=[];
var spy_price=0.0,uso_price=0.0,gld_price=0,shy_price=0.0,tlt_price=0,agg_price=0,gsg_price=0,uup_price=0;
var spy_returns=0.0,uso_returns=0.0,gld_returns=0.0,shy_returns=0.0,tlt_returns=0.0,agg_returns=0.0,gsg_returns=0.0,upp_returns=0.0;
var factor_tickers =["SPY", "USO", "GLD", "SHY", "TLT", "AGG", "GSG", "UUP"]






function update_prices(ticker, price, lastprice, time,weights,id)
{           
        if (price==0){
        
        Console.log("Do nothing");
        } else{
		// check if the revieved price is of factors or ticker
		console.log("In update price:");
			timestamp=time
			switch(ticker)
			{

			case "SPY": 
			    if (spy_price==price ||price==0) {console.log('do nothing');break;} else{	spy_returns=spy_price-price;spy_price=price;break; }
			case "USO": 
				if (uso_price==price|| price==0) {break;} else{uso_returns=price-uso_price; uso_price=price;break;} 
				break;
			case "GLD": 
				if (gld_price==price|| price==0) {break;} else{gld_returns=price-gld_price; gld_price=price;break;} 
			case "SHY":
				if (shy_price==price|| price==0) {break;} else{shy_returns=price-shy_price; shy_price=price;break;} 
			case "TLT": 
				if (tlt_price==price|| price==0) {break;} else{tlt_returns=price-tlt_price; tlt_price=price;break;} 
			case "AGG": 
				if (agg_price==price|| price==0) {break;} else{agg_returns=price-agg_price; agg_price=price;break;} 
			case "GSG": 
				if (gsg_price==price|| price==0) {break;} else{gsg_returns=price-gsg_price; gsg_price=price;break;} 
			case "UUP": 
				if (uup_price==price|| price==0) {break;} else{upp_returns=price-upp_price; upp_price=price;break;} 
        
			default: //none of the factors check if the tickers in the portofolio
			
			for (var i=0;i<weights.length;i++)
                     {
                        if (ticker==tickers[i])
                           {
                            lastprice[i]=price;
                 //
                            //update_portfolio_value(lastprice,weights, id); 
                             break; 
                         }
					   } 
						
			}//case
			
			}//ifelse

}//function








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

 console.log("Getting Portfolios");

    var sql_query = 'SELECT ticker,weight FROM portfolio WHERE userid =? AND portfolioname=?' //;  
   

    mysqlconnection.query(sql_query,[username,portfolio],function(err,results){
      
      if (err) {  
                console.log(err);
             
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

function streamlivedata(tickers,weights,socketid){
  console.log('Streaming Live data')
  console.log('tickers:' + tickers)
  console.log('Weights:' + weights)
  console.log('factors:'+ factor_tickers);


      //get data

 var ir = new IntrinioRealtime({
  username: "d2dca9723f3b2b06066124991495dc24",
  password: "d249fce6267ac39c538536285b83e978",
  provider: "iex"
  });
 
  var lastprice=[];

  //
  //init prices
  for (var i=0;i<tickers.length;i++)
     { var init=0;
       lastprice[i]=0;
    }
 console.log(lastprice);


var allticker=factor_tickers.concat(tickers);

 for (var i=0;i<allticker.length;i++)
{

  console.log("Request data for live stream:" + allticker[i]);

  ir.join(allticker[i]);
}


  // Listen for quotes
  ir.onQuote(quote => {

  var { ticker, type, price, size, timestamp } = quote


  //console.log("Socket id:")        
  console.log("QUOTE: ", ticker, type, price, size, timestamp);
  console.log("PORTFOLIO: ",lastprice);
  if (type=='last')
    {
    if (price==0)
        {
        
        Console.log("Doing nothing");
        } else
        {
		// check if the revieved price is of factors or ticker
		    console.log("In update price:");
			timestamp=timestamp;
			switch(ticker)
			{

			case "SPY": 
           console.log(price);
			    if (spy_price==price ||price==0) {console.log('SPY unchanged');break;} else{	spy_returns=spy_price-price;spy_price=price;break; }
			case "USO": 
				if (uso_price==price|| price==0) {break;} else{uso_returns=price-uso_price; uso_price=price;break;} 
				break;
			case "GLD": 
				if (gld_price==price|| price==0) {break;} else{gld_returns=price-gld_price; gld_price=price;break;} 
			case "SHY":
				if (shy_price==price|| price==0) {break;} else{shy_returns=price-shy_price; shy_price=price;break;} 
			case "TLT": 
				if (tlt_price==price|| price==0) {break;} else{tlt_returns=price-tlt_price; tlt_price=price;break;} 
			case "AGG": 
				if (agg_price==price|| price==0) {break;} else{agg_returns=price-agg_price; agg_price=price;break;} 
			case "GSG": 
				if (gsg_price==price|| price==0) {break;} else{gsg_returns=price-gsg_price; gsg_price=price;break;} 
			case "UUP": 
				if (uup_price==price|| price==0) {break;} else{upp_returns=price-uup_price; uup_price=price;break;} 
        
			default: //none of the factors check if the tickers in the portofolio
			
			for (var i=0;i<weights.length;i++)
                     {
                        if (ticker==tickers[i])
                           {
                            lastprice[i]=price;
                 //
                            //update_portfolio_value(lastprice,weights, id); 
                             break; 
                         }
					   } 
						
			}//case
			
		}//ifelse
  
 
  console.log('Portfolio value before:' + portfolio_value)  

  var portfolio_value=update_portfolio_value(lastprice,weights);

  console.log('Portfolio Value after:' + portfolio_value);

    data= {spy: spy_price, // Math.random(),
         uso:   uso_price, 
         gld:   gld_price,
         shy:   shy_price,
         tlt:   tlt_price,
         agg:   agg_price,
         gsg:   gsg_price,  
         upp:   uup_price, 
         portfolio:   portofolioValue, 
         timestamp: Date.now(),
         userid: socketid};

 console.log(data);

  var messageBuffer = type2.toBuffer(data);

  // Create a new payload
  var payload = [{
    topic: 'ticktest',
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

 // if (ticker=='MSFT'){
  io.to(socketid).emit('live_data2',portofolioValue);
//  }

  }//if type==last

  });//onquotes
  return data;
}


function update_portfolio_value(lastprices,weights)
{

    // we are send the the data to kafka broker we can change this to have a unique topic name  

  //console.log("Portfolio value before:",portofolioValue)
  var value=0;
  for (var i=0;i<lastprices.length;i++)
  {

    value=value+(lastprices[i]*weights[i]);

  } 
  portofolioValue=value;

  //create json of the portfolio value and json
  console.log("Updating portfolio value to:",portofolioValue)


  return portofolioValue
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
    checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
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
var users=[];
io.use(passportSocketIo.authorize({
  key: 'connect.sid',
  secret: 'secret',
  store: sessionStore,
  passport: passport,
  cookieParser: cookieParser
}));


io.on('connection',function(socket){

  var id=socket.id;
  users.push(socket.id);

  var username=socket.request.user.username;
  var online=  (socket.request.user.logged_in);

  //console.log(users);
  console.log('Server: Connected new client:'+username);
  console.log('Server: Socket id for new Client:'+id);



  if (online==true)
  {
  //io.sockets.emit('server', username );
  io.to(id).emit('server', username);
  }


  portfolioListtoClient(username,socket.id, toClient);
  console.log('Select or create a portfolio');
  
  socket.on('selected_portfolio', function(portfolio){

    console.log(portfolio);
    var socketid=socket.id;
    var username=socket.request.user.username;
    //get tickers and weigths and request data
    gettickers(username,portfolio,socketid,streamlivedata);


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

//   var socketid=getsocketid(users);
//    io.to(socketid).emit('betas',portofolioValue);

})

consumer.on('error', function(error) {
  
  console.log("Producer has an error");
  console.error(error);
});




server.listen(port);
console.log('The magic happens on port ' + port);
