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

        //Call fxn based on state
        if (this.state =="WELCOMED"){ 
            outMsg= this.welcomeUser(inMsg);
        }
        else if (this.state == "WAITINGPIN"){
            outMsg = this.joinGame(inMsg);
        }
        else if (this.state == "HELP"){
            outMsg = this.helpFunction(inMsg, currGame);
        }
        else if (this.state == "ENDING"){
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
        else if (this.state == "OVERRIDE"){
            if (!currGame.getOverideTarget()){
                currGame.setOverrideTarget(inMsg); 
                outMsg= `Please enter the new wallet value for ${inMsg}`; 
            }
            else {
                var overridePlayer=db.searchPlayersByName(currGame.getOverideTarget());
                overridePlayer.setWallet(parseInt(inMsg,10));
                currGame.logAll();
                outMsg="New Wallet Set";
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
                if (inMsg == "Admin Control"){
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
            this.setGameCode(currGame.getGameCode());
            db.pushGames(currGame);  
            this.state= "INGAME";
            currGame.addPlayer(this.id);
            this.admin=true; 
            var text=`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton(this.gameCode, "START GAME")}}`
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
            return "You're in this game now"; 
        }
        else {
            return "Game Not Found"; 
        }
    }

    stateInGameFunction(inMsg, currGame){
        if (inMsg == "START GAME"){
            this.state= "INITWALLET";
            return "How much should each player start with?";
        }
        else if (inMsg== "Pick Winner" ){ //removed && this.state=="INGAME"
            currGame.listAllUsers(this);
            this.state="LISTALL";
            return NaN; 
        }
        else if (inMsg== "Next Round" ){ //removed && this.state=="INGAME"
            currGame.resetBet();
            currGame.setLastMove(inMsg, this.name, 0);
            currGame.logAll();
            return NaN;
            //return "NEW HAND";
        }
        else if (inMsg == "Help"){
            this.state="HELP";
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.threeButton("Chose a Command", "End Game", "Menu", "Override")}}`));
            return NaN;
        }
        else if (inMsg == "Raise"){
            this.state="RAISE";
            return "How much do you want to raise it by?";
        }
        else if (inMsg == "Call"){
            var difference=currGame.getTableBet()-this.getMyBet(); 
            this.addMyBet(difference); 
            currGame.addPot(difference);
            this.wallet= this.wallet-difference;
            currGame.setLastMove(inMsg, this.name, difference);
            currGame.logAll();
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
            currGame.setLastMove("WIN", winner.getPlayerName(), currGame.getPot());
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
            currGame.setLastMove(this.state, this.name, intVal);
            var difference=currGame.getTableBet()-this.getMyBet(); //how off is current user from bet 
            this.addMyBet(difference+intVal); 
            currGame.addPot(difference+intVal);
            currGame.addTableBet(intVal);
            this.wallet= this.wallet-difference-intVal;
            currGame.logAll();

            // this.addMyBet(currGame.getTableBet()+intVal);  
             
            // currGame.addPot(currGame.getTableBet());
            // this.wallet= this.wallet-currGame.getTableBet();
            // currGame.logAll();
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
    
}

