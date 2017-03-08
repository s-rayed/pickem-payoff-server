const jwt = require('jwt-simple');
const config = require('../config');
const User = require('../models/user');

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
}

exports.signin = function(req, res, next) {
  // User has already been auth'd through email + pwd
  // We just need to give them a token
  const token = tokenForUser(req.user);
  res.send({ token: token, user: req.user });
}

exports.signup = function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(422).send({ error: 'You must provide an email and password' });
  }

  User.findOne({ email: email }, function(err, existingUser) {
    if (err) { return next(err); }

    if (existingUser) {
      return res.status(422).send({ error: 'Email in use' });
    }

    const user = new User({
      email: email,
      password: password,
      wins: 0,
      losses: 0,
      dailyChoice: null,
      thisWeekWinner: false
    });

    user.save(function(err) {
      if (err) { return next(err); }
      res.json({ token: tokenForUser(user), user: user });
    });

  });

};