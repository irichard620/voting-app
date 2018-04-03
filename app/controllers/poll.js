// user model
var Poll = require('../models/poll');
var User = require('../models/user');

exports.createPoll = function(req, res, next) {
  // Get fields
  var title = req.body.title.trim();
  var option1 = req.body.option1.trim();
  var option2 = req.body.option2.trim();
  var option3 = req.body.option3.trim();

  // check
  if (!title || title === "") {
    // Must have a title
    req.flash('createPollSuccessMessage', '');
    req.flash('createPollErrorMessage', 'Your poll must have a title');
    return next();
  }
  if ((!option1 || option1 === "") && (!option2 || option2 === "") &&
  (!option3 || option3 === "")) {
    // Must have atleast one option
    req.flash('createPollSuccessMessage', '');
    req.flash('createPollErrorMessage', 'Your poll must have atleast one option');
    return next();
  }

  // create the poll
  var poll_options = [];
  if (option1 && option1 !== "") {
    poll_options.push({title:option1, total_votes:0});
  }
  if (option2 && option2 !== "") {
    poll_options.push({title:option2, total_votes:0});
  }
  if (option3 && option3 !== "") {
    poll_options.push({title:option3, total_votes:0});
  }
  const newPoll = new Poll({
    title: title,
    creatorId: req.user._id,
    total_votes: 0,
    poll_options: poll_options,
    unauth_voters: [],
    auth_voters: [],
  });
  newPoll.save((err, poll) => {
    if (err) {
      req.flash('createPollSuccessMessage', '');
      req.flash('createPollErrorMessage', 'Internal server error occurred. Please try again');
      return next();
    }
    req.user.created_polls.push(poll._id);
    req.user.save((err, user) => {
      if (err) {
        req.flash('createPollSuccessMessage', '');
        req.flash('createPollErrorMessage', 'Internal server error occurred. Please try again');
        return next();
      }
      req.flash('createPollSuccessMessage', 'Your poll was successfully created');
      req.flash('createPollErrorMessage', '');
      return next();
    });
  });
}

exports.getMyPolls = function(req, res, next) {
  Poll.find({ creatorId: req.user._id }, '_id title total_votes', function(err, polls) {
    req.polls = polls;
    if (err) {
      req.flash('myPollsMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    return next();
  });
}

exports.getAllPolls = function(req, res, next) {
  Poll.find({}, '_id title total_votes', {
    skip:0,
    limit: 100,
    sort: {
      total_votes: -1
    }
  }, function(err, polls) {
    req.polls = polls;
    if (err) {
      req.flash('allPollsMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    return next();
  });
}

exports.getPoll = function(req, res, next) {
  var pollId = req.params.pollId;
  Poll.findOne({ _id: pollId }, function(err, poll) {
    req.poll = poll;
    if (err) {
      req.flash('getPollMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    return next();
  });
}

exports.addPollOption = function(req, res, next) {
  // Get option from req
  var option = req.body.option.trim();

  // check
  if (!option || option === "") {
    // Must have a title
    req.flash('addPollOptionSuccessMessage', '');
    req.flash('addPollOptionErrorMessage', 'You must enter a poll option');
    return next();
  }

  // Get poll from DB
  var pollId = req.params.pollId;
  Poll.findOne({ _id: pollId }, function(err, poll) {
    req.poll = poll;
    if (err) {
      req.flash('addPollOptionSuccessMessage', '');
      req.flash('addPollOptionErrorMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    // Add option
    poll.poll_options.push({
      title: option,
      total_votes: 0
    });

    // Save poll
    poll.save((err, poll) => {
      req.poll = poll;
      if (err) {
        req.flash('addPollOptionSuccessMessage', '');
        req.flash('addPollOptionErrorMessage', 'Internal server error occurred. Please try again');
        return next();
      }

      req.flash('addPollOptionSuccessMessage', 'You successfully added a poll option');
      req.flash('addPollOptionErrorMessage', '');
      return next();
    });
  });
}

exports.votePollOption = function(req, res, next) {
  // Get option from req
  var option = req.body.option.trim();

  // check
  if (!option || option === "") {
    // Must have a title
    req.poll = poll;
    req.flash('votePollOptionSuccessMessage', '');
    req.flash('votePollOptionErrorMessage', 'You must enter a poll option');
    return next();
  }

  // Get poll from DB
  var pollId = req.params.pollId;
  Poll.findOne({ _id: pollId }, function(err, poll) {
    if (err) {
      req.poll = poll;
      req.flash('votePollOptionSuccessMessage', '');
      req.flash('votePollOptionErrorMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    // IF auth, add id, if not, add IP
    if (req.user) {
      var userId = req.user._id.toString();
      for (var i = 0; i < poll.auth_voters.length; i++) {
        if (poll.auth_voters[i] === userId) {
          req.poll = poll;
          req.flash('votePollOptionSuccessMessage', '');
          req.flash('votePollOptionErrorMessage', 'You have already voted on this poll.');
          return next();
        }
      }
      poll.auth_voters.push(userId);
    } else {
      // Get their IP
      console.log(req.connection.remoteAddress);
      var ip = (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',').pop() : null) ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        for (var i = 0; i < poll.unauth_voters.length; i++) {
          if (poll.unauth_voters[i] === ip) {
            req.poll = poll;
            req.flash('votePollOptionSuccessMessage', '');
            req.flash('votePollOptionErrorMessage', 'You have already voted on this poll.');
            return next();
          }
        }
      poll.unauth_voters.push(ip);
    }

    // Increment total votes
    poll.total_votes++;

    for (var i = 0; i < poll.poll_options.length; i++) {
      if (option === poll.poll_options[i].title) {
        // Increment votes for option
        poll.poll_options[i].total_votes++;
      }
    }

    // Save poll
    poll.save((err, poll) => {
      if (err) {
        req.flash('votePollOptionSuccessMessage', '');
        req.flash('votePollOptionErrorMessage', 'Internal server error occurred. Please try again');
        return next();
      }

      req.poll = poll;

      req.flash('votePollOptionSuccessMessage', 'You successfully voted in this poll.');
      req.flash('votePollOptionErrorMessage', '');
      return next();
    });
  });
}

exports.deletePoll = function(req, res, next) {
  var pollId = req.params.pollId;

  // Find poll
  Poll.findOne({ _id: pollId }, function(err, poll) {
    if (err) {
      req.flash('deletePollSuccessMessage', '');
      req.flash('deletePollErrorMessage', 'Internal server error occurred. Please try again');
      return next();
    }

    if (!req.user || req.user._id.toString() !== poll.creatorId) {
      req.flash('deletePollSuccessMessage', '');
      req.flash('deletePollErrorMessage', 'Unauthorized');
      return next();
    }


    // Remove from user
    User.findOne({ _id: poll.creatorId }, function(err, user) {
      var index = user.created_polls.indexOf(poll._id);
      if (index > -1) {
        user.created_polls.splice(index, 1);
      }
      user.save((err, user) => {
        if (err) {
          req.flash('deletePollSuccessMessage', '');
          req.flash('deletePollErrorMessage', 'Internal server error occurred. Please try again');
          return next();
        }
        // Delete
        poll.remove();
        req.flash('deletePollSuccessMessage', 'You successfully voted in this poll.');
        req.flash('deletePollErrorMessage', '');
        return next();
      });
    });
  });
}
