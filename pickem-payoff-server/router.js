const Authentication = require('./controllers/authentication');
const passport = require('passport');
const passportService = require('./services/passport');
const requireAuth = passport.authenticate('jwt', { session: false } ); // passport tries to create a session after authenticate by default -- since we're using tokens, dont need it.
var requireSignin = passport.authenticate('local', { session: false } );
var updateUserDailyChoice = require('./controllers/updateUserDailyChoice');

var GameData = require('./controllers/gameData');

module.exports = function(app) {
  app.get('/', requireAuth, function(req, res) {
    res.send({ message: 'Super secret code is ABC123, congrats you\'re a hacker' });
  });
  app.get('/dashboard', requireAuth)
  app.get('/getgamedata', GameData.getData);
  app.post('/signin', requireSignin, Authentication.signin);
  app.post('/signup', Authentication.signup);
  app.put('/updatedailychoice', updateUserDailyChoice.updateChoice);
};