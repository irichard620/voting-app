var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// User schema
var userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  created_polls: [String] // Array of poll IDs
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking password
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
