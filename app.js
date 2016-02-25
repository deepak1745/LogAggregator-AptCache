/*Copyright 2016 Wipro Limited, NIIT Limited

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This code is written by Prateek Reddy Yammanuru, Shiva Manognya Kandikuppa, Uday Kumar Mydam, Nirup TNL, Sandeep Reddy G, Deepak Kumar
 and updated by Ashish Gupta, Tarun Mohandas, Suriya Prakash, Srinivasa Burli, Jishnu Surendran and Bhairavi Balakrishnan*/

//var mongoose = require('./mongoose');
//var db = mongoose();
//Loading  global config variable
require('./configLoad')

var compress = require('compression');
var express = require('express');
var passport = require('passport');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var flash = require('connect-flash');

var routes = require('./routes/index');
var configRoute = require('./routes/config');
var authenticate = require('./routes/authenticate')(passport);
var userAgent = require('./routes/nginx/userAgent');
var logListing = require('./routes/nginx/logListing');
var trafficRate = require('./routes/nginx/trafficRate');

//Wave 2 code
var packageRoutes = require('./routes/aptCache/packageCount');
var graphRoutes = require('./routes/aptCache/logRateData');
var dataRateData = require('./routes/aptCache/dataRateData');
var packageAnalytics = require('./routes/aptCache/packageAnalytics');
var repRoutes = require('./routes/aptCache/repository');
var getInfo = require('./routes/aptCache/getInfo');
//end wave 2 code

var app = express();
var env = app.get('env');
//piece of code to authenticate request before accesing routes
var isAuthenticated = function (req, res, next) {
  if(req.isAuthenticated()) return next();
  res.status(401).send("Not authorised");
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var cpath = env == 'production' ? '../public' : 'public' ;
app.use(express.static(path.join(__dirname, cpath)));

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, cpath, 'favicon.ico')));

app.use(compress());


app.use(flash());
app.use(methodOverride());
app.use(session({
  saveUninitialized: true,
  resave: true,
  secret: 'secret',
  cookie:{
    login:false
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/config', configRoute);
var initPassport = require('./passport-init');
initPassport(passport);
app.use('/', routes);
app.use('/auth', authenticate);
//
//##### #### FROM THIS LINE OF CODE ALL THE ROUTES REQUIRES AUTHENTICATION
//
app.use(isAuthenticated);


app.use('/json/userAgent', userAgent);
app.use('/json/logListing', logListing);
app.use('/json/trafficRate', trafficRate);

//wave 2 code
app.use('/logRateData',graphRoutes);
app.use('/dataRateData',dataRateData);
app.use('/packageCount', packageRoutes);
app.use('/packageanalytics', packageAnalytics);
app.use('/repository/mode',repRoutes);
app.use('/getInfo',getInfo);
//end wave 2 code

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


module.exports = app;
