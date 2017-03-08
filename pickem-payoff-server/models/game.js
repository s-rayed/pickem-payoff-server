const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define our model

const gameSchema = new Schema({
  homeTeam: String,
  awayTeam: String,
  gameTime: String,
  gameArena: String,
  gameId: String,
  pickEm: Boolean
}, {collection: 'games'});

// Create the model class

const GameModelClass = mongoose.model('game', gameSchema);

// Export the model

module.exports = GameModelClass;