var mongoose = require('mongoose');

// User schema
var pollSchema = mongoose.Schema({
  title: String,
  creatorId: String,
  total_votes: Number,
  poll_options: [{
    title: String,
    total_votes: Number
  }],
  auth_voters: [String], // Array of user Ids who have voted
  unauth_voters: [String] // Array of IPS of unauthed users
});

module.exports = mongoose.model('Poll', pollSchema);
