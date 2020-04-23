const Str = require('@supercharge/strings');
helper        = require("./helper.js");
var db = require('./db.js');

module.exports = class Game {
    gameCode;
    players;
    pot;
    bet;
    minBet;     
    constructor() {
        this.gameCode = Str.random(6).toUpperCase();
        this.players= []; 
        this.pot = 0;
        this.bet = 10;   
    }
    getGameCode(){
        return this.gameCode
    }
    getPot(){
        return this.pot; 
    }
    addPlayer(playerId){
        this.players.push(playerId);
    }
    resetPot(){
        this.pot=0;
    }
    resetBet(){
        this.bet=10;
    }
    initWallet(value){
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                tarPlayer.setWallet(value);
            }
        }
    }
    logAll(){
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                tarPlayer.contact(this.pot);
            }
        }
    }
    addPot(value){
        this.pot=this.pot+value;
    }
    callBet(){
        return this.bet;
    }
    addBet(value){
        this.bet= this.bet+value;
    }
    askForWinner(admin){
        console.log(this.players.length);
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                var name= tarPlayer.getPlayerName();
                var outMsg = helper.oneButton(name,name);
                var text=`{"recipient":{"id":"${admin.getPlayerId()}"},"message":${outMsg}}`
                helper.sender(JSON.parse(text));
            }
        }
    }

} //end of class 

// Handle input from user 
function inMessage(inJson){
    var text, inMsg, outMsg ;
    // try catch to see if they are replying through buttons or actually typing something 
     try {
        inMsg = (JSON.stringify(inJson.entry[0].messaging[0].postback.title)); // try catch if the response is a postback of it's a written message  
     } catch (err){   
        inMsg = (JSON.stringify(inJson.entry[0].messaging[0].message.text)); 
    }

    var id = inJson.entry[0].messaging[0].sender.id

        if (inMsg == '"New Game"'){
            outMsg = `{"text":"How many players want to play?"}`
            }
        else if (inMsg == '"Join Game"'){
            outMsg = `{"text":"Please enter gamepin"}`
        }
        else {
            outMsg = helper.oneButton("Press New game to start a new game and Join Game to join an existing game", "New Game");
        }

        text=`{"recipient":{"id":"${id}"},"message":${outMsg}}`
        var jsonObject = JSON.parse(text);
        return jsonObject; 
    } 
  


// Generate JSON for buttons 
function buttonJson(writtenText, buttonOne){
    var writtenText, buttonOne; 
    outMsg= `{"attachment":{ 
        "type":"template", 
        "payload":{  
          "template_type":"button", 
          "text":"${writtenText}", 
          "buttons":[ 
            { 
              "type":"postback", 
              "title":"${buttonOne}", 
              "payload":"DEVELOPER_DEFINED_PAYLOAD" 
            },
            { 
              "type":"postback", 
              "title":"Join Game", 
              "payload":"DEVELOPER_DEFINED_PAYLOAD" 
            } 
          ] 
        } 
      }
    }`
    return outMsg; 
}
