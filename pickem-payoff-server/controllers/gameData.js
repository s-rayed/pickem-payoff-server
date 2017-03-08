const Game = require('../models/game');

exports.getData = function(req, res, next) {

  Game.find(function(err, data) {

    res.send({ data: data });
    
  });

}