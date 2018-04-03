var LocalStrategy = require('passport-local').Strategy;

// user model
var User = require('../app/models/user');

module.exports = function(passport) {
    // passport needs ability to serialize and unserialize users out of session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // Sign up strategy
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
      // Find user with same email
      findOrCreateUser = function() {
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'An account with this email already exists.'));
            }

            // create the user
            var newUser = new User();

            // set the user's info
            newUser.email = email;
            newUser.password = newUser.generateHash(password);
            newUser.name = req.body.name;

            // save the user
            newUser.save(function(err) {
                if (err)
                    throw err;
                return done(null, newUser);
            });
        });
      }
      process.nextTick(findOrCreateUser);
    }));

    // Login strategy
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {

        // Find user with email
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return
            if (err)
                return done(err);

            // if no user is found
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.'));

            // password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

            // return user if nothing fails
            return done(null, user);
        });
    }));
};
