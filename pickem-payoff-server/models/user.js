const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

// Define our model

const userSchema = new Schema({
  email: { type: String, unique: true, lowerCase: true },
  password: String,
  wins: Number,
  losses: Number,
  dailyChoice: String,
  thisWeekWinner: Boolean
});

// On Save Hook, encrypt password
// Before saving a model, run this function
userSchema.pre('save', function(next) {
  const user = this;
  bcrypt.genSalt(10, function(err, salt) {
    if (err) { return next(err) };

    // generate a salt then run callback
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) { return next(err); }

      // Overwrite plain text password with encrypted password
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) { return callback(err); }

    callback(null, isMatch);
  });
}

// Create the model class

const ModelClass = mongoose.model('user', userSchema);

// Export the model

module.exports = ModelClass; // For use in other files.