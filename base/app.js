require('dotenv').config();
var express        = require('express'),
    bodyParser     = require('body-parser'),
    http           = require('http'),
    server         = require('request'),
    playerClass    = require('./player.js'),
    app            = express(),
    gameClass      = require("./game.js");

// get env var for tokens
const token = process.env['TOKEN_MESS'];
const webhktoken = process.env['TOKEN_WEBHOOK'];


var players=[]; 

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

//initlize game 

//let game = new gameClass(); 

// Message handler - async function to handle incoming messages 
app.messageHandler = function(j, cb) {
  var jsonObject; 
    var playerId = j.entry[0].messaging[0].sender.id;
    var exists= false; 
    var activeUser;
    //check if player already in game 
    for (var i =0; i<players.length; i++){
      if (playerId == players[i].getPlayerId()){
        exists=true;
        activeUser=players[i]; 
      }
    }
    console.log(players);
    
    if (exists){
      jsonObject= activeUser.processMessage(j);
      //process New Game/JOin GAme input (PLayer method- processMessage- check if state=WelcomED, then handle New Game (initate game and return code) /JOin Game,) 

    }
    else {
      activeUser = new playerClass(playerId);
      jsonObject= activeUser.generateWelcome();
      players.push(activeUser);
    }
    //send input to game class 
    //jsonObject=game.inMessage(j); 
    //text= "\"message\":{\"text\":\"How many players want to play?\"}"

    //build string for json object
    
    //var text = `{"recipient":{"id":"${id}"},"message":{"text":"${name}"}}`;
    //var jsonObject = JSON.parse(text);
    
    


    var reqObj = {
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
      json: jsonObject
    };
    console.log(JSON.stringify(reqObj))
    server(reqObj, function(error, response, body) {
      if (error) {
        console.log('Error sending message: ', JSON.stringify(error));
        cb(false)
      } else if (response.body.error) {
        console.log("API Error: " + JSON.stringify(response.body.error));
        cb(false)
      } else{
        cb(true)
      }
    });
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