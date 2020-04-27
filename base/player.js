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
    myBet;
    constructor(id) {
        this.id= id;
        this.gameCode = "";
        this.state = "WELCOMED";
        this.wallet = 0;
        this.admin=false;
        this.myBet=0; 
        console.log(helper.getFirstName(this.id, this));    

    }
    getPlayerId(){
        return this.id; 
    }
    getPlayerName(){
        return this.name;
    }
    getMyBet(){
        return this.myBet;
    }

    setGameCode(code){
        this.gameCode=code; 
    }
    setWallet(value){
        this.wallet=value; 
    }
    setName(name){
        this.name=name;
    }
    addMyBet(value){
        this.myBet+=value;
    }
    resetMyBet(){
        this.myBet=0;
    }

    
    //msg user w/ pot and wallet
    contact(pot, lastMove){
        var currGame= db.searchGames(this.gameCode);
        var text; 
        console.log(this.name);
        if (this.admin){
            this.adminButton();
        } 
        if (lastMove){
            text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${lastMove}"}}`;
            helper.sender(JSON.parse(text));
        } 
        text=`{"recipient":{"id":"${this.id}"},"message":${helper.twoButton(`${this.name} \\nYour Bet: ${this.getMyBet()} \\nTable Bet: ${currGame.getTableBet()} \\nPot: ${pot} \\nWallet: ${this.wallet}`, "Call", "Raise")}}`
        helper.sender(JSON.parse(text));
    }

    // Welcome Message generator
    generateWelcome(){
        outMsg = helper.twoButton("Welcome! Press New game to start a new game and Join Game to join an existing game", "New Game", "Join Game");
        var text=`{"recipient":{"id":${this.id}},"message":${outMsg}}`; 
        return JSON.parse(text);
    }
    processMessage(inJson){
        console.log(this.state);
        var inMsg;
        var currGame; 

        //set currGame if user is already in game- function takes in state, returns game 
        currGame= db.searchGames(this.gameCode); 
        
        if (inJson.entry[0].messaging[0].postback){
            inMsg=inJson.entry[0].messaging[0].postback.title;
        }
        else if (inJson.entry[0].messaging[0].message.text){
            inMsg=inJson.entry[0].messaging[0].message.text;
        }

        if (inMsg.toUpperCase()=="LEAVE" && !this.admin){
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.getPlayerId()}"},"message":{"text":"Thanks for playing, you have been removed from the game. Message the bot again to start/join another game"}}`));
            if (currGame){
                currGame.messageAdmin(`${this.name} has left the game :(`);
                currGame.deletePlayerById(this.id);
            }
            db.deletePlayer(this.id);
            return NaN; 
        }

        //Call fxn based on state
        if (this.state =="WELCOMED"){ 
            outMsg= this.welcomeUser(inMsg);
        }
        else if (this.state == "WAITINGPIN"){
            outMsg = this.joinGame(inMsg);
        }
        else if (this.state == "HELP" && this.admin){
            outMsg = this.helpFunction(inMsg, currGame);
        }
        else if (this.state == "ENDING" && this.admin){
            if (inMsg=="Yes- End Game"){
                outMsg= "Thanks for playing";
                currGame.messagePlayersEnd();
                currGame.deletePlayers();
                db.deleteGame(currGame.getGameCode());
            }
            else if (inMsg == "No- Return to Game"){
                //console.log("REVERT TO GAME");
                this.state="INGAME";
                currGame.logAll();
                return NaN; 
            }
        }
        else if (this.state == "OVERRIDE" && this.admin){
            if (!currGame.getOverideTarget()){
                currGame.setOverrideTarget(inMsg); 
                outMsg= `Please enter the new wallet value for ${inMsg}`; 
            }
            else {
                var overridePlayer=db.searchPlayersByName(currGame.getOverideTarget());
                overridePlayer.setWallet(parseInt(inMsg,10));
                currGame.logAll();
                outMsg="New Wallet Set";
                helper.sender(JSON.parse(`{"recipient":{"id":"${overridePlayer.getPlayerId()}"},"message":{"text":"Admin has overrode your wallet to ${inMsg}"}}`));
                currGame.setOverrideTarget(NaN);
                this.state="INGAME"; 
            }
        }

        //if user is in game 
        else if (this.state != "WELCOMED" && this.state != "WAITINGPIN"){
            if (inJson.entry[0].messaging[0].postback){ // user entering buttons 
                outMsg= this.stateInGameFunction(inMsg, currGame); //Only call when INGAME and input is as a button  
                if (!outMsg){
                    outMsg= this.stateListAll(inMsg, currGame);
                }
                if (inMsg == "Admin Control" && this.admin){
                    helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.threeButton("Admin", "Next Round", "Pick Winner", "Help")}}`));
                    return NaN;
                }
            }
            //Handle written entry 
            else if (inJson.entry[0].messaging[0].message.text) {
                var intVal = parseInt(inJson.entry[0].messaging[0].message.text, 10);
                if (intVal){
                    outMsg = this.processInt(intVal, currGame);
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
        return JSON.parse(text);
        };
    }

    adminButton(){
        var outMsg= helper.oneButton("Admin", "Admin Control");
        var text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`;
        helper.sender(JSON.parse(text));
    }

    welcomeUser(inMsg){
        if (inMsg == "New Game"){
            var currGame = new gameClass();
            currGame.setAdminId(this.id);
            this.setGameCode(currGame.getGameCode());
            db.pushGames(currGame);  
            this.state= "INGAME";
            currGame.addPlayer(this.id);
            this.admin=true; 
            var text=`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton(`Game Pin: ${this.gameCode}`, "Start Game")}}`
            helper.sender(JSON.parse(text));
            return NaN;
            }
        else if (inMsg == "Join Game"){
            this.state="WAITINGPIN";
            return "Please enter gamepin";
        }
    }
    joinGame(inMsg){
        var currGame = db.searchGames(inMsg)
        if (currGame){
            this.state= "INGAME";
            this.gameCode= inMsg;
            currGame.addPlayer(this.id);
            currGame.messageAdmin(`${this.name} has joined the game.`); 
            return "You're in this game now"; 
        }
        else {
            return "Game Not Found"; 
        }
    }

    stateInGameFunction(inMsg, currGame){
        if (inMsg == "Start Game" && this.admin){
            this.state= "INITWALLET";
            return "How much should each player start with?";
        }
        else if (inMsg== "Pick Winner" && this.admin ){ //removed && this.state=="INGAME"
            currGame.listAllUsers(this);
            this.state="LISTALL";
            return NaN; 
        }
        else if (inMsg== "Next Round" && this.admin ){ //removed && this.state=="INGAME"
            currGame.resetBet();
            currGame.setLastMove(inMsg, this.name, 0,0);
            currGame.logAll();
            return NaN;
            //return "NEW HAND";
        }
        else if (inMsg == "Help" && this.admin){
            this.state="HELP";
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.threeButton("Chose a Command", "End Game", "Menu", "Override")}}`));
            return NaN;
        }
        else if (inMsg == "Raise"){
            this.state="RAISE";
            return "How much do you want to raise it by?";
        }
        else if (inMsg == "Call"){
            this.state="Call";
            this.raiseBet(0, currGame);
            currGame.logAll();
            this.state="INGAME";
            return NaN;
        }
        else{
            return NaN; 
        }
    }
    stateListAll(inMsg, currGame){
        if (this.state=="LISTALL" && inMsg!="Pick Winner"){ //determine winner and credit pot 
            var winner = db.searchPlayersByName(inMsg);
            var newWallet = currGame.getPot() + winner.wallet;
            winner.setWallet(newWallet);
            this.state="INGAME";
            currGame.setLastMove("WIN", winner.getPlayerName(), currGame.getPot(),0);
            currGame.resetPot();
            currGame.resetBet();
            currGame.logAll();
            return NaN;
        }
        else{
            return NaN; 
        }
    }

    processInt(intVal, currGame){
        if (this.state=="INITWALLET"){
            currGame.initWallet(intVal);
            currGame.logAll();
            this.state="INGAME";
            return "Initialized";
        }
        else if(this.state=="RAISE"){
            this.raiseBet(intVal, currGame);
            currGame.logAll();
            this.state="INGAME";
            return NaN;  
        }
    }

    helpFunction(inMsg, currGame){
        currGame.resetLastMove();
        if (inMsg== "End Game"){
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.twoButton("Are you sure you want to end game? You will not be able to return to this game.", "Yes- End Game", "No- Return to Game")}}`));
            this.state="ENDING"; 
        }
        else if (inMsg == "Menu"){
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton("<INSERT HELP COMMANDS>", "Return to Game")}}`));
        }
        else if (inMsg == "Override"){
            this.state = "OVERRIDE";
            currGame.listAllUsers(this);
            return "Which users' wallet do you want to override?";
        }
        else if (inMsg == "Return to Game"){
            currGame.logAll();
            this.state="INGAME";
        }
        else {
            return NaN;
        }
    }
    raiseBet(intVal, currGame){
        var difference=currGame.getTableBet()-this.getMyBet();
        if ((difference+intVal)>=this.wallet){
            this.allIn(currGame);
            currGame.setLastMove("ALLIN", this.name, intVal, difference);
            return difference; 
        }
        this.addMyBet(difference+intVal); 
        currGame.addPot(difference+intVal);
        currGame.addTableBet(intVal);
        this.wallet= this.wallet-difference-intVal;
        currGame.setLastMove(this.state, this.name, intVal, difference);
        return difference; 

    }
    allIn(currGame){
        this.state="ALLIN";
        this.addMyBet(this.wallet);
        currGame.addPot(this.wallet);
        currGame.setTableBet(Math.max(currGame.getTableBet(), this.getMyBet()));
        this.wallet=0;
    }
    
}

