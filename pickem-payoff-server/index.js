const express = require('express');
const http = require('http');
const bodyParser = require('body-parser'); 
const morgan = require('morgan');
const app = express();
const router = require('./router');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const CronJob = require('cron').CronJob;
const config = require('./config');
const Game = require('./models/game');
const User = require('./models/user');
const moment = require('moment');

// DB SETUP

mongoose.connect(config.db);

// APP SETUP
app.use(morgan('combined')); // Request logger - prints request logs
app.use(cors());
app.use(bodyParser.json({ type: '*/*' })); // this registers morgan & bodyParsers as middlewares 


// any incoming requests are passed in to them -- Morgan logs requests into terminal while body parser parses incoming request into json

router(app);

// Daily

var dailyJob = new CronJob({
  cronTime: '00 00 02 * * *',
  onTick: function() {
    var today = new Date();
    var yesterday = new Date(today - (24*60*60*1000));
    var todayFormatted = moment(today).format('YYYYMMDD');
    var yesterdayFormatted = moment(yesterday).format('YYYYMMDD');
    var yesterdaysPickEmId;
    var yesterdaysUserChoices = {};
    var yesterdaysGames;
    var yesterdaysPickEmGameReturn;
    var yesterdaysPickEmGame = {};
    var yesterdaysPickEmWinner;

    // Get yesterdays games from the db, find the pickEm gameId
    Game.find(function(err, gameData) {
      for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].pickEm) {
          yesterdaysPickEmId = gameData[i].gameId;
        }
      }
    })

    // Get user dailyChoice
    User.find(function(err, userData) {
      var userEmail;
      for (var j = 0; j < userData.length; j++) {
        userEmail = userData[j].email;
        yesterdaysUserChoices[userEmail] = userData[j].dailyChoice;
      }
      console.log(yesterdaysUserChoices);
    })

    // Get yesterdays Scores, update user win loss, make daily choice null, delete all game objects in database

    axios.get(`${config.apiDailyScoresURL}?fordate=${yesterdayFormatted}`, {
      auth: {
        username: `${config.apiUsername}`,
        password: `${config.apiPassword}`
      }
    })
    .then(function(response) {

      yesterdaysGames = response.data.scoreboard.gameScore;

      yesterdaysPickEmGameReturn = yesterdaysGames.filter(function(el) {
        return el.game.ID == yesterdaysPickEmId
      })

      if (yesterdaysPickEmGameReturn) {
        // Determining yesterdays PickEmGame Winner
        if (parseInt(yesterdaysPickEmGameReturn[0].awayScore) > parseInt(yesterdaysPickEmGameReturn[0].homeScore)) {
          yesterdaysPickEmWinner = yesterdaysPickEmGameReturn[0].game.awayTeam.Name
        } else {
          yesterdaysPickEmWinner = yesterdaysPickEmGameReturn[0].game.homeTeam.Name;
        }

        for(user in yesterdaysUserChoices) {
          // Finding each user in db and incrementing wins/losses according to score 
          if (yesterdaysPickEmWinner == yesterdaysUserChoices[user]) {

            User.findOneAndUpdate({ email: user }, { $inc: { wins: 1 }, $set: { dailyChoice: null } }, { passRawResult: true } , function(err, doc, writeOpResult) {
                if (err) {
                  console.log(err);
                } else {
                  // console.log('result', writeOpResult)
                  // console.log('Updated User Win and daily choice for user')
                }
              });

          } else {

            User.findOneAndUpdate({ email: user }, { $inc: { losses: 1 }, $set: { dailyChoice: null } }, function(err, doc, writeOpResult) {
                if (err) {
                  console.log(err);
                } else {
                  // console.log('result', writeOpResult)
                  // console.log('Updated User Loss and daily choice for user')
                }
              });
          }

          // Removing all of yesterdays game objects from database
          Game.remove({}, function(error) {
            if (error) {
              console.log(error);
            }
          });

        }

      }

    })
    .catch(function(error) {
      console.log(error);
    })

    // Get todays game slate and create new game objects in database
    axios.get(`${config.apiDailyScheduleURL}?fordate=${todayFormatted}`, {
      auth: {
        username: `${config.apiUsername}`,
        password: `${config.apiPassword}`
      }
    })
    .then(function(response) {

      var games = response.data.dailygameschedule.gameentry;

      const firstBatchTeams = "Warriors" || "Raptors" || "Cavaliers" || "Spurs" || "Rockets";
      const secondBatchTeams = "Clippers" || "Celtics" || "Wizards" || "Thunder";

      for (j = 0; j < games.length; j++) {

        if ((games[j].awayTeam.Name == firstBatchTeams || games[j].awayTeam.Name == secondBatchTeams) || (games[j].homeTeam.Name == firstBatchTeams || games[j].homeTeam.Name == secondBatchTeams)) {

          var game = new Game({
            homeTeam: games[j].homeTeam.Name,
            awayTeam: games[j].awayTeam.Name,
            gameTime: games[j].time,
            gameArena: games[j].location,
            gameId: games[j].id,
            pickEm: true
          });

          game.save(function(err) {
            if (err) { return next(err); }
            console.log('done');
          });

        } else {

          var game = new Game({
            homeTeam: games[j].homeTeam.Name,
            awayTeam: games[j].awayTeam.Name,
            gameTime: games[j].time,
            gameArena: games[j].location,
            gameId: games[j].id,
            pickEm: false
          });

          game.save(function(err) {
            if (err) { return next(err); }
            console.log('done');
          });
        }


      }
    })
    .catch(function(error) {
      console.log(error);
    });
  }//,
  // runOnInit: true
});

dailyJob.start();

// Weekly Job To declare winner - CronTime Day of Week Range = 0-6 -- Sunday = 0

var weeklyJob = new CronJob({
  cronTime: '00 00 03 * * 0',
  onTick: function() {
    var winnerEmail = '',
        winnerWinPercentage = 0,
        winnerScoreWins = 0,
        winnerScoreLosses = 0;

    // Pull in user win+loss & Declare winner -- reset win+loss
    User.find({}, function(err, users) {
      if (err) {
        console.log(err);
      } else {

        console.log('users', users);

        for (var i = 0; i < users.length; i++) {
          User.findOneAndUpdate({ email: users[i].email}, { $set: { thisWeekWinner: false } }, function(err, doc) {
            if (err) { console.log(err); } else { console.log('done making winner false'); }
          });
          if ((users[i].wins / users[i].losses) >= winnerWinPercentage) {
            winnerWinPercentage = (users[i].wins / users[i].losses);
            winnerEmail = users[i].email;
            winnerScoreWins = users[i].wins;
            winnerScoreLosses = users[i].losses;
          }
        }

        User.findOneAndUpdate({ email: winnerEmail }, { $set: { thisWeekWinner: true } }, function(err, doc) {
          if (err) { console.log(err); } else { console.log('done making the winner for the week'); }
        });

      }
    })

  } //, runOnInit: true
});
weeklyJob.start();

// Server setup

const port = process.env.PORT || 3090;
const server = http.createServer(app);

server.listen(port);
console.log('Server listening on: ', port);