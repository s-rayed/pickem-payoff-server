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

* Every Morning at 2am, gets all NBA games from the api, throws it into the database. Chooses one of the games (depending on teams playing) and makes that the choice for the day. Sends the games and choice to the database which is then accessed from the client. Takes the choices from the client and adds to the database. Also takes all user choices from yesterday and determines wins + losses and updates database.

* Every Sunday at 3am, finds the winner and loser and updates the database.

## Setup

` $> npm install `

` $> npm run dev `

* Now download and run the client!