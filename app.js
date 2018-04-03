'use strict';

// Imports ================================

const path = require('path');
const express = require('express');
const passport = require('passport');
const config = require('./config/main.js');
const router = require('./router');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieSession = require('cookie-session')

// Initialization ==============================

// express app
var app = express();

// Connect to DB
mongoose.connect(config.DB_PATH);

// Configure auth
require('./config/auth')(passport);

// Basic middleware
app.use(morgan('dev')); // console logs
app.use(cookieParser()); // read cookies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use ejs for views
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, '/public'));
app.set('view engine', 'ejs');

// Set up sessions for express
app.use(session({
  secret: config.SESSION_SECRET,
  secure: true,
  resave: false,
  saveUninitialized: false
}));

// Initialize passport for auth
app.use(passport.initialize());
app.use(passport.session());

// Error messages - use flash
app.use(flash());

// Routes =======================================

// Direct routes
router(app, passport);

// Launch app =====================================

// Start Server
app.listen(process.env.PORT || config.PORT, function () {
   console.log('Node.js listening on port ' + config.PORT);
});
