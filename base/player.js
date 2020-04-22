
gameClass      = require("./game.js");
var games=[];

function searchGames(gameCode){
    console.log(games);
    for (var i =0; i<games.length; i++){
        console.log(games[i].getGameCode());
        console.log(gameCode);
        if (gameCode == games[i].getGameCode()){
            console.log("GAME FOUND");
            return games[i]; 
        }
        
      }
    return NaN; 
}

module.exports = class Player {
    id;
    gameCode;
    state; 
    wallet; 
    constructor(id) {
        this.id= id;
        this.gameCode = "";
        this.state = "WELCOMED";
        this.wallet = 0;  
        
        //Add id to array active games  
    }
    //Getter to check if ID is in a game
    getPlayerId(){
        return this.id; 
    }

    //set gamecode
    setGameCode(code){
        this.gameCode=code; 
    }

    // Welcome Message generator
    generateWelcome(){
        outMsg = buttonJson("Welcome! Press New game to start a new game and Join Game to join an existing game", "New Game", "Join Game");
        var text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`;
        console.log(this.id);
        console.log(text);
        console.log("\n\n\n\n");
        return JSON.parse(text);
    }
    processMessage(inJson){
        var inMsg;
        var currGame;  
        
        if (this.state =="WELCOMED" && (inJson.entry[0].messaging[0].postback)){
            inMsg = (inJson.entry[0].messaging[0].postback.title); //assume only entered with Button reply 
            if (inMsg == "New Game"){
                currGame = new gameClass();
                this.setGameCode(currGame.getGameCode());
                games.push(currGame);  
                this.state= "INGAME";
                currGame.addPlayer(this.id);
                //output message with start game button 
                var text=`{"recipient":{"id":"${this.id}"},"message":${buttonJson(this.gameCode, "START GAME")}}`
                return JSON.parse(text);
                }
            else if (inMsg == "Join Game"){
                this.state="WAITINGPIN";
                outMsg = "Please enter gamepin";
            }
        
        }
        else if (this.state == "WAITINGPIN"){
            inMsg = (inJson.entry[0].messaging[0].message.text);
            currGame = searchGames(inMsg)
            if (currGame){
                this.state= "INGAME";
                this.gameCode= inMsg;
                currGame.addPlayer(this.id); 
                outMsg= "You're in this game now"; 
            }
            else {
                outMsg= "Game Not Found"; 
            }
        }
        //if user is in game 
        else if (this.state == "INGAME"){
            if (inJson.entry[0].messaging[0].postback){ //Admin user entering buttons 
                inMsg = (inJson.entry[0].messaging[0].postback.title); //assume only entered with Button reply 
                if (inMsg == "START GAME"){
                    outMsg= "How much should each player start with?(enter integer)"
                }
            }
        }

        else{
            outMsg= "Error";
        }
        var text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${outMsg}"}}`
        return JSON.parse(text);
    }



    
}

function buttonJson(writtenText, buttonOne, buttonTwo){
    //var writtenText, buttonOne; 
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
              "title":"${buttonTwo}", 
              "payload":"DEVELOPER_DEFINED_PAYLOAD" 
            } 
          ] 
        } 
      }
    }`
    return outMsg; 
}

// function buttonJson(writtenText, buttonOne){
//     //var writtenText, buttonOne; 
//     outMsg= `{"attachment":{ 
//         "type":"template", 
//         "payload":{  
//           "template_type":"button", 
//           "text":"${writtenText}", 
//           "buttons":[ 
//             { 
//               "type":"postback", 
//               "title":"${buttonOne}", 
//               "payload":"DEVELOPER_DEFINED_PAYLOAD" 
//             }, 
//           ] 
//         } 
//       }
//     }`
//     return outMsg; 
// }
