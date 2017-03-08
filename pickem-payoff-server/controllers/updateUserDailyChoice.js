const User = require('../models/user');

exports.updateChoice = function(req, res, next) {

  User.findOneAndUpdate({ email: req.body.email }, { $set: { dailyChoice: req.body.chosenTeam } }, { passRawResult: true } ,function(err, doc, writeOpResult) {

    if (err) {
      console.log(err);
    } else {
      res.send('Daily Choice Updated');
    }
    
  });

}

