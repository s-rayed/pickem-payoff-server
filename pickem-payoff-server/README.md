## PickEm-Payoff-Server

* Express
* Cron
* Bcrypt
* Morgan
* Nodemon
* Passport
* Mongoose
* JWT

## What's it doing?

* Every Morning at 2am, gets all NBA games from the api, throws it into the db. Chooses one of the games (depending on teams playing) and makes that the choice for the day. Sends the games and choice to the db which is then accessed from the client. Takes the choices from the client for the day and all user choices from yesterday and determines wins + losses and updates db again.

* Every Sunday at 3am, finds the winner and loser and updates.

## Setup

` $> npm install `

` $> npm run dev `

* Now download and run the client!