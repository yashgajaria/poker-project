require('dotenv').config();
var express        = require('express'),
    bodyParser     = require('body-parser'),
    http           = require('http'),
    playerClass    = require('./player.js'),
    app            = express(),
    helper         = require('./helper.js'),
    db             = require('./db.js');

// get env var for tokens
const webhktoken = process.env['TOKEN_WEBHOOK'];

//Players Array 
//var players=[]; 

app.use(bodyParser.json()); 

// Post endpoint  
app.post('/', function(req, res){
    console.log(JSON.stringify(req.body))
    app.messageHandler(req.body, function(result){
        console.log("Async Handled: " + result)
    })
    res.send(req.body)
})

// connect to webhook 
app.get('/', function(req, res) {
    if (req.query['hub.verify_token'] === webhktoken) {
       res.send(req.query['hub.challenge']);
     } else {
       res.send('Error, wrong validation token');
     }
});


// Message handler - async function to handle incoming messages 
app.messageHandler = function(j, cb) {
  var jsonObject; 
  var playerId = j.entry[0].messaging[0].sender.id;
  //var exists= false; 
  var activeUser = db.searchPlayers(playerId);

  //check if player already in game 
  // for (var i =0; i<players.length; i++){
  //   if (playerId == players[i].getPlayerId()){
  //     exists=true;
  //     activeUser=players[i]; 
  //   }
  // }
  // console.log(players);
  
  if (activeUser){
    jsonObject= activeUser.processMessage(j);
  }
  else {
    activeUser = new playerClass(playerId);
    jsonObject= activeUser.generateWelcome();
    //players.push(activeUser);
    db.pushPlayer(activeUser);
  }
  helper.sender(jsonObject);
}

// create a health check endpoint
app.get('/health', function(req, res) {
    res.send('okay');
});

// set port
app.set('port', process.env.PORT || 8080);


// start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});