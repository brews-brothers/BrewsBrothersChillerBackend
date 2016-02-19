#!/usr/bin/env node
var express = require('express');
var errorHandler = require('errorhandler');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('bb-server:server');
var http = require('http');
var cors = require('cors');

var jwt = require('jsonwebtoken');
var knex = require('./db/knex');
var passport = require('passport')

require('dotenv').load();

var routes = require('./routes/index');
var users = require('./routes/users');
var batches = require('./routes/batches');
var brewerydb = require('./routes/brewerydb');
var auth = require('./routes/auth');

var session = require('express-session');

var app = express();

function Users() {
  return knex('users');
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());



//Passport fucking bullshit

// app.use(session({
//   secret:process.env.COOKIE_SECRET,
//   resave:true,
//   saveUninitialized:true
// }));
//
// app.use(auth.passport.initialize());
// app.use(auth.passport.session());
//
// auth.passport.serializeUser(function(user, done) {
//   console.log('serializing user');
//   done(null, user);
// });
//
// auth.passport.deserializeUser(function(user, done) {
//   console.log('deserializing user');
//   console.log(user);
//   done(null, user);
// });

/* Dev Environment for Mongo */

/* Removed due to not using it */
// if ('development' == app.get('env')) {
//   app.use(errorHandler());
//   mongoose.connect('')
// }

app.use('/', routes);
app.use('/users',tokenAuthenicated, getUser, users);
app.use('/dashboard',tokenAuthenicated, getUser, batches);
app.use('/styles', brewerydb);
app.use('/auth', auth.router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



/**
 * Module dependencies.
 */



/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

var io = require('socket.io')(server);

io.on('connection',function(socket){
  console.log('Connected');
  socket.on('logData',function(data){
    console.log(socket);
    console.log(data);
  });
  socket.on('error', function(err){
    console.log(err);
  });
  socket.on('disconnect', function() {
  console.log('Disconected');
})
})
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

function tokenAuthenicated(req, res, next){
 // check header or url parameters or post parameters for token
 var token = req.body.token || req.query.token || req.headers.token;

 // decode token
 if (token) {
   console.log('Got token');
 // verifies secret and checks exp
   jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
     if (err) {

       return res.json({ success: false, message: 'Failed to authenticate token.' });
     } else {
       console.log('token is good');
       // if everything is good, save to request for use in other routes
       req.decoded = decoded;
       next();
     }
   });
  } else {
   // if there is no token
 // return an error
 return res.status(403).send({
     success: false,
     message: 'No token provided.'
 });
 }

}

function getUser(req, res, next) {
  console.log("getting user from db");
  Users().where('email', req.decoded).select().first().then(function(user) {
    if (!user) {
      res.send('Can not find user');
    } else {
      req.user = user;
    }
    console.log('got the user passing to route');
    next();
  }).catch(function(error) {
    throw error;
  })
}

module.exports = app;
