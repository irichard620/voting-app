const PollController = require("./app/controllers/poll");

module.exports = function(app, passport) {
  // Show home page
  app.get('/', PollController.getAllPolls, function(req, res) {
    res.render('home.ejs', {
      user: req.user,
      polls: req.polls,
      message: ""
    });
  });

  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage')
    });
  });

  // Login user
  app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/',
        failureRedirect : '/login',
        failureFlash : true
    }));

  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // Create user
  app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : true
    }));

  // Profile
  app.get('/createpoll', isLoggedIn, function(req, res) {
    res.render('createpoll.ejs', {
      user: req.user,
      error: req.flash('createPollErrorMessage'),
      success: req.flash('createPollSuccessMessage'),
    });
  });
  app.get('/mypolls', isLoggedIn, PollController.getMyPolls, function(req, res) {
    res.render('mypolls.ejs', {
      user: req.user,
      polls: req.polls,
      message: ""
    });
  });

  app.get('/poll/:pollId/delete', isLoggedIn, PollController.deletePoll, function(req, res) {
    // Check if error
    var deleteError = req.flash('deletePollErrorMessage');
    console.log(deleteError);
    if (deleteError && deleteError.length > 0) {
      res.redirect('/poll/' + req.params.pollId);
    } else  {
      res.redirect('/');
    }
  });

  app.get('/poll/:pollId', PollController.getPoll, function(req, res) {
    res.render('polldetails.ejs', {
      user: req.user,
      poll: req.poll,
      voteError: req.flash('votePollOptionErrorMessage'),
      voteSuccess: req.flash('votePollOptionSuccessMessage'),
      addError: req.flash('addPollOptionErrorMessage'),
      addSuccess: req.flash('addPollOptionSuccessMessage'),
      deleteError: req.flash('deletePollErrorMessage'),
    });
  });

  app.post('/poll/:pollId/option', isLoggedIn, PollController.addPollOption, function(req, res) {
    res.redirect('/poll/' + req.params.pollId);
  });

  app.post('/poll/:pollId/vote', PollController.votePollOption, function(req, res) {
    res.redirect('/poll/' + req.params.pollId);
  });

  // Create poll
  app.post('/poll', isLoggedIn, PollController.createPoll, function(req, res) {
    res.redirect('/createpoll');
  });

  // Logout of app
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}
