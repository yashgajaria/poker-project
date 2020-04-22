const Str = require('@supercharge/strings')

module.exports = class Game {
    gameCode;
    players;  
    constructor() {
        this.gameCode = Str.random(6).toUpperCase();
        this.players= [];  
    }
    getGameCode(){
        return this.gameCode
    }
    addPlayer(playerId){
        this.players.push(playerId);
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
            //text = JSON.parse('"message":{"text":"How many players want to play?"}');
            outMsg = `{"text":"How many players want to play?"}`
            //text=`{"recipient":{"id":"${id}"},"message":{"text":"How many players want to play?"}}`
            }
        else if (inMsg == '"Join Game"'){
            //text = JSON.parse('"message":{"text":"Please enter gamepin"}');
            outMsg = `{"text":"Please enter gamepin"}`
            //text=`{"recipient":{"id":"${id}"},"message":{"text":"${outMsg}"}}`
        }
        else {
            //text = "Welcome to Poker, please type New Game to start new game, or Join Game to join game";
            //outMsg = "Press New game to start a new game and Join Game to join an existing game";
            outMsg = buttonJson("Press New game to start a new game and Join Game to join an existing game", "New Game");
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
