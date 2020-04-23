gameClass      = require("./game.js");
helper         = require("./helper.js");
db             = require('./db.js');


module.exports = class Player {
    id;
    gameCode;
    state; 
    wallet;
    admin;
    name;   
    constructor(id) {
        this.id= id;
        this.gameCode = "";
        this.state = "WELCOMED";
        this.wallet = 0;
        this.admin=false;
        helper.getFirstName(this.id, this);    

    }
    //Getter to check if ID is in a game
    getPlayerId(){
        return this.id; 
    }
    getPlayerName(){
        return this.name;
    }

    //set gamecode
    setGameCode(code){
        this.gameCode=code; 
    }
    //set wallet
    setWallet(value){
        this.wallet=value; 
    }
    setName(name){
        this.name=name;
    }

    

    //msg user w/ pot and wallet
    contact(pot){
        var currGame= db.searchGames(this.gameCode);
        var text; 
        console.log(this.name);
        // if admin = true, also add the button
        if (this.admin){
            outMsg= helper.twoButton("ADMIN USER", "Next Round", "Pick Winner");
            text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`;
            helper.sender(JSON.parse(text));
        } 
        outMsg= helper.threeButton(`${this.name} \\nBet: ${currGame.callBet()} \\nPot: ${pot} \\nWallet: ${this.wallet}`, "Check", "Call", "Raise"); 
        text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`
        helper.sender(JSON.parse(text));
    }

    // Welcome Message generator
    generateWelcome(){
        outMsg = helper.twoButton("Welcome! Press New game to start a new game and Join Game to join an existing game", "New Game", "Join Game");
        var text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`;
        return JSON.parse(text);
    }
    processMessage(inJson){
        var inMsg;
        var currGame; 

        //set currGame if user is already in game 
        if (this.state == "INGAME" || this.state == "RAISE" || this.state== "LISTALL"){
            currGame= db.searchGames(this.gameCode);
        }

        //Create new game or prompt to join game 
        if (this.state =="WELCOMED" && (inJson.entry[0].messaging[0].postback)){
            inMsg = (inJson.entry[0].messaging[0].postback.title); //assume only entered with Button reply 
            if (inMsg == "New Game"){
                currGame = new gameClass();
                this.setGameCode(currGame.getGameCode());
                db.pushGames(currGame);  
                this.state= "INGAME";
                currGame.addPlayer(this.id);
                this.admin=true; 
                //output message with start game button 
                var text=`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton(this.gameCode, "START GAME")}}`
                return JSON.parse(text);
                }
            else if (inMsg == "Join Game"){
                this.state="WAITINGPIN";
                outMsg = "Please enter gamepin";
            }
        
        }
        else if (this.state == "WAITINGPIN"){
            inMsg = (inJson.entry[0].messaging[0].message.text);
            currGame = db.searchGames(inMsg)
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
        else if (this.state == "INGAME" || this.state== "RAISE" || this.state=="LISTALL"){
            if (inJson.entry[0].messaging[0].postback){ // user entering buttons 
                inMsg = (inJson.entry[0].messaging[0].postback.title); //assume only entered with Button reply 
                if (inMsg == "START GAME"){
                    outMsg= "How much should each player start with?";
                }
                else if (inMsg== "Pick Winner" && this.state=="INGAME"){
                    currGame.askForWinner(this);
                    this.state="LISTALL";
                    return NaN;
                    //set bet to 0 
                }
                else if (inMsg== "Next Round" && this.state=="INGAME"){
                    currGame.resetBet();
                    currGame.logAll();
                    return NaN;

                }
                else if (this.state=="LISTALL"){
                    var winner = db.searchPlayersByName(inMsg);
                    var newWallet = currGame.getPot() + winner.wallet;
                    winner.setWallet(newWallet);
                    this.state="INGAME";
                    //WHY IS THERE NO ASYNC HERE 
                    currGame.resetPot();
                    currGame.resetBet();
                    currGame.logAll();
                    return NaN;
                }
                else if (inMsg == "Raise"){
                    this.state="RAISE";
                    outMsg= "How much do you want to raise it by?";
                }
                else if (inMsg == "Call"){
                    intVal=currGame.callBet(); 
                    currGame.addPot(intVal);
                    this.wallet= this.wallet-intVal;
                    currGame.logAll();
                    outMsg= NaN;
                }
                else if (inMsg == "Check"){
                    currGame.logAll();
                    outMsg= NaN; 
                }
            }
            //Handle written entry 
            else if (inJson.entry[0].messaging[0].message.text) {
                var intVal = parseInt(inJson.entry[0].messaging[0].message.text, 10);
                if (intVal && this.state=="INGAME"){
                    currGame.initWallet(intVal);
                    currGame.logAll();
                    outMsg=("Initialized");
                }
                else if(intVal && this.state=="RAISE"){
                    currGame.addBet(intVal); 
                    currGame.addPot(currGame.callBet());
                    this.wallet= this.wallet-currGame.callBet();
                    currGame.logAll();
                    this.state="INGAME";
                    outMsg= NaN;  
                }
                else{
                    outMsg=("Invalid Input, Please try again:");
                }

            }
        }

        else{
            outMsg= "Error";
        }
        if(outMsg){
        var text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${outMsg}"}}`;
        console.log(text);
        return JSON.parse(text);
        };
    }
    
}