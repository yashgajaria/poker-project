module.exports = class Game {
    constructor() {
      //this.id = 'id_1';
    }
}
var level = function inMessage(inJson){
    var text
    //console.log(JSON.stringify(j.entry[0].messaging[0].messager.text)); 
    var msg = (JSON.stringify(inJson.entry[0].messaging[0].message.text)); 
    //console.log(msg);
    if (msg == '"New Game"'){
        // initilize game 
        text = "How many players want to play?";
        //console.log(text);
        }
    else if (msg == '"Join Game"'){
        text = "Please enter gamepin";
    }
    else {
        text = "Welcome to Poker, please type New Game to start new game, or Join Game to join game";
    }

    return text; 
}; 
module.exports =level; 
