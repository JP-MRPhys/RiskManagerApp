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

var server = require('http').createServer(app);  
var io = require('socket.io')(server);


var IntrinioRealtime = require('intrinio-realtime');
// Create an IntrinioRealtime instance
var ir = new IntrinioRealtime({
  username: "d2dca9723f3b2b06066124991495dc24",
  password: "d249fce6267ac39c538536285b83e978",
});





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

console.log(sessionStore)



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
  console.log('Server: Connected new client'+id);

  if (online==true){
  //io.sockets.emit('server', username );
  io.to(id).emit('server', username);
  }

  //console.log('last socket id'+id);
  //io.sockets.connected[id].emit('event',id);


  socket.on('portfolio',function(data){

  var id=socket.id;  
  console.log('User:' + data.user);
  console.log('Loging status:' + socket.request.user.logged_in);
  console.log('Portfolio weights:' +data.weights);
  console.log('Portfolio weights:' +data.tickers);

  var userid=socket.request.user.username;
  var portfolio_name=data.portfolio_id;
  var tickers=data.tickers;
  var weights=data.weights;

  var insertquery = "INSERT INTO portfolios (userid, portfolio_name, stockid, weight) VALUES ?";
  var portfolcheck = 'SELECT * FROM portfolios WHERE userid = ?';

  console.log("Add to the database");
  
//  entries=[];
//  var number_entry=weights.length();
  

 // for (var i=0;i<number_entry;i++)
//  { 
  //    var newuser = [[userid, portfolio_name, data.ticker[i], data.weights[i]]
 //     entries.push[newuser];
  //}

  //mysql_connection.query(insertquery, [entries], function (err, result) {
 // if (err) console.log(err);
  //      else{ 
  //        console.log("Number of records inserted: " + result.affectedRows);   
          //response.render('login');
          //probably set a flag for the charts some how and emit  
          //get portofolio list and send it to the sever
  //        io.to(id).emit('portfolio_add', portfolio);
  
    //    }});

  

  //we can just add to the database;

  //get data
  

  io.to(id).emit(tickdata); 




  });





  //disconnect
  socket.on('disconnect',function(){
  console.log('Server: disconnecting client' +id);
 // users.slice(users.indexof(socket.id,1)); //updateusername function();
  });

  //client id
  socket.on('client',function(msg){
  console.log('Server: Message from client with id:' 
    + socket.id);
  console.log(msg);
  });

});


server.listen(port);
console.log('The magic happens on port ' + port);
