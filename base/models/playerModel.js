const mongoose = require("../database");
helper         = require("../helper.js");
gameModel      = require("./gameModel.js");


class playerClass {
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
    }
    initName(){
        helper.getFirstName(this.id, this);
    }
    getPlayerId(){
        return this.id; 
    }
    getQuery(){
        var query= {id: this.id};
        return query; 
    }
    getPlayerName(){
        return this.name;
    }
    getMyBet(){
        return this.myBet;
    }
    setGameCode(code){
        this.gameCode=code;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {gameCode: code}, options).then( ()=> {}); 
    }
    setWallet(value){
        this.wallet=value;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {wallet: value}, options).then( ()=> {} ); 
    }
    setName(name){
        this.name=name;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {name: name}, options).then( ()=> {});
    }
    setState(state){
        this.state=state;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {state: state}, options).then( ()=> {});
    }
    setAdmin(){
        this.admin=true;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {admin: true}, options).then( ()=> {});
    }
    addMyBet(value){
        this.myBet+=value;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {myBet: this.myBet}, options).then( ()=> {});
    }
    resetMyBet(){
        this.myBet=0;
        var options = { multi: true};
        Player.updateOne(this.getQuery(), {myBet: 0}, options).then( ()=> {});
    }

    //msg user w/ pot and wallet
    contact(currGame){
        var text; 
        if (this.admin){
            this.adminButton();
        } 
        if (currGame.getLastMove()){
            text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${currGame.getLastMove()}"}}`;
            helper.sender(JSON.parse(text));
        } 
        text=`{"recipient":{"id":"${this.id}"},"message":${helper.twoButton(`${this.name} \\nYour Bet: ${this.getMyBet()} \\nTable Bet: ${currGame.getTableBet()} \\nPot: ${currGame.getPot()} \\nWallet: ${this.wallet}`, "Call", "Raise")}}`
        helper.sender(JSON.parse(text));
    }

    // Welcome Message generator
    generateWelcome(){
        outMsg = helper.twoButton("Welcome! Press New game to start a new game and Join Game to join an existing game", "New Game", "Join Game");
        var text=`{"recipient":{"id":${this.id}},"message":${outMsg}}`; 
        return JSON.parse(text);
    }
    processMessage(inJson){
        console.log("in process msg");
        //set currGame if user is already in game- function takes in state, returns game 
        gameModel.findOne({gameCode: this.gameCode}).then( currGame => { 
            var outMsg, inMsg; 
            if (inJson.entry[0].messaging[0].postback){
                inMsg=inJson.entry[0].messaging[0].postback.title;
            }
            else if (inJson.entry[0].messaging[0].message.text){
                inMsg=inJson.entry[0].messaging[0].message.text;
            }

            console.log(inMsg);

            if (inMsg.toUpperCase()=="LEAVE" && !this.admin){
                helper.sender(JSON.parse(`{"recipient":{"id":"${this.getPlayerId()}"},"message":{"text":"Thanks for playing, you have been removed from the game. Message the bot again to start/join another game"}}`));
                if (currGame){
                    currGame.messageAdmin(`${this.name} has left the game :(`);
                    currGame.deletePlayerById(this.id);
                }
                playerModel.deleteOne({id:this.id });
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
                    this.messagePlayersEnd(currGame);
                    this.deletePlayers(currGame);
                    gameModel.deleteOne({gameCode:currGame.getGameCode()}).exec();
                }
                else if (inMsg == "No- Return to Game"){
                    this.setState("INGAME");
                    this.logAll(currGame);
                }
            }
            else if (this.state == "OVERRIDE" && this.admin){
                if (!currGame.getOverideTarget()){
                    currGame.setOverrideTarget(inMsg); 
                    outMsg= `Please enter the new wallet value for ${inMsg}`;
                }
                else if (parseInt(inMsg,10)>=0){
                    Player.findOne({name: currGame.getOverideTarget()}).then( overridePlayer => {
                        overridePlayer.setWallet(parseInt(inMsg,10));
                        outMsg="New Wallet Set";
                        helper.sender(JSON.parse(`{"recipient":{"id":"${overridePlayer.getPlayerId()}"},"message":{"text":"Admin has overrode your wallet to ${inMsg}"}}`));
                        currGame.setOverrideTarget("");
                        this.setState("INGAME"); 
                        overridePlayer.contact(currGame);
                        if (!overridePlayer.admin){
                            this.contact(currGame);
                        }
                });}
                else {
                    outMsg= "Invalid Input, please enter a positive number.";
                }
            }

            //if user is in game 
            else if (this.state != "WELCOMED" && this.state != "WAITINGPIN" && !outMsg){
                if (inJson.entry[0].messaging[0].postback){ // user entering buttons 
                    outMsg= this.stateInGameFunction(inMsg, currGame); //Only call when INGAME and input is as a button  
                    if (!outMsg){
                        outMsg= this.stateListAll(inMsg, currGame);
                    }
                    if (inMsg == "Admin Control" && this.admin){
                        helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.threeButton("Admin", "Next Round", "Pick Winner", "Help")}}`));
                        currGame.save();
                        //return NaN;
                    }
                }
                //Handle written entry 
                else if (inJson.entry[0].messaging[0].message.text) {
                    var intVal = parseInt(inJson.entry[0].messaging[0].message.text, 10);
                    if (intVal && intVal >= 0){
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
                console.log(`WE MADE IT: ${outMsg}`);
                var text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${outMsg}"}}`;
                helper.sender(JSON.parse(text));
                return text; 
            };
    }) }

    adminButton(){
        var outMsg= helper.oneButton("Admin", "Admin Control");
        var text=`{"recipient":{"id":"${this.id}"},"message":${outMsg}}`;
        helper.sender(JSON.parse(text));
    }

    welcomeUser(inMsg){
        if (inMsg == "New Game"){
            var currGame = new gameModel();
            currGame.setAdminId(this.id);
            this.setGameCode(currGame.getGameCode());
            this.setState("INGAME"); 
            currGame.addPlayer(this.id);
            this.setAdmin(); 
            var text=`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton(`Game Pin: ${this.gameCode}`, "Start Game")}}`
            helper.sender(JSON.parse(text));
            currGame.save();
            }
        else if (inMsg == "Join Game"){
            this.setState("WAITINGPIN");
            this.messagePlayer("Please enter gamepin");
        }
    }
    joinGame(inMsg){
        gameModel.findOne({gameCode:inMsg}).then( currGame => {
            if (currGame){
                this.setState("INGAME");
                this.setGameCode(inMsg);
                currGame.addPlayer(this.id);
                currGame.messageAdmin(`${this.name} has joined the game.`); 
                this.messagePlayer("You're in this game now"); 
            }
            else {
                this.messagePlayer("Game Not Found"); 
            }
        });
    }

    stateInGameFunction(inMsg, currGame){
        if (inMsg == "Start Game" && this.admin){
            this.setState("INITWALLET");
            this.messagePlayer("How much should each player start with?");
        }
        else if (inMsg== "Pick Winner" && this.admin ){ 
            this.listAllUsers(this, currGame);
            this.setState("LISTALL");
        }
        else if (inMsg== "Next Round" && this.admin ){ 
            this.resetBet(currGame);
            currGame.setLastMove(inMsg, this.name, 0,0);
        }
        else if (inMsg == "Help" && this.admin){
            this.setState("HELP");
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.threeButton("Chose a Command", "End Game", "Menu", "Override")}}`));
        }
        else if (inMsg == "Raise"){
            this.setState("RAISE");
            this.messagePlayer("How much do you want to raise by?");
        }
        else if (inMsg == "Call"){
            this.setState("Call");
            this.raiseBet(0, currGame);
            this.logAll(currGame);
            this.state="INGAME";
        }
    }
    stateListAll(inMsg, currGame){
        if (this.state=="LISTALL" && inMsg!="Pick Winner"){ //determine winner and credit pot 
            Player.findOne({name: inMsg}).then( winner => {
                var newWallet = currGame.getPot() + winner.wallet;
                winner.setWallet(newWallet);
                this.setState("INGAME");
                currGame.setLastMove("WIN", winner.getPlayerName(), currGame.getPot(),0);
                currGame.resetPot();
                winner.logAll(currGame);
            });
        }
    }

    processInt(intVal, currGame){
        if (this.state=="INITWALLET"){
            this.initWallet(intVal, currGame);
            this.setState("INGAME");
            this.messagePlayer("Initialized");
        }
        else if(this.state=="RAISE"){
            this.raiseBet(intVal, currGame);
            this.logAll(currGame);
            this.setState("INGAME");
        }
    }

    helpFunction(inMsg, currGame){
        currGame.resetLastMove();
        if (inMsg== "End Game"){
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.twoButton("Are you sure you want to end game? You will not be able to return to this game.", "Yes- End Game", "No- Return to Game")}}`));
            this.setState("ENDING"); 
        }
        else if (inMsg == "Menu"){
            helper.sender(JSON.parse(`{"recipient":{"id":"${this.id}"},"message":${helper.oneButton("<INSERT HELP COMMANDS>", "Return to Game")}}`));
        }
        else if (inMsg == "Override"){
            this.setState("OVERRIDE");
            this.listAllUsers(this, currGame);
            this.messagePlayer("Which users' wallet do you want to override?");
        }
        else if (inMsg == "Return to Game"){
            this.logAll(currGame);
            this.setState("INGAME");
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
        console.log(`TABLE BET: ${currGame.getTableBet()}`);
        this.setWallet(this.wallet-difference-intVal);
        currGame.setLastMove(this.state, this.name, intVal, difference);
        return difference; 
    }

    allIn(currGame){
        this.setState("ALLIN");
        this.addMyBet(this.wallet);
        currGame.addPot(this.wallet);
        currGame.setTableBet(Math.max(currGame.getTableBet(), this.getMyBet()));
        this.setWallet(0);
    }
    messagePlayer(message){
        var text=`{"recipient":{"id":"${this.id}"},"message":{"text":"${message}"}}`
        helper.sender(JSON.parse(text));
    }

    initWallet(value, currGame){
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            if (playerId== this.id && false){
                this.setWallet(value);
            }
            else {Player.findOne({id: playerId}).then(tarPlayer =>{
                if (tarPlayer){
                    tarPlayer.setWallet(value);
                    tarPlayer.contact(currGame);
                }
                });
            } 
        }
    }

    logAll(currGame){
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            if (playerId== this.id){
                this.contact(currGame);
            }
            else {Player.findOne({id: playerId}).then(tarPlayer =>{
                if (tarPlayer){
                    tarPlayer.contact(currGame);
                }
            });
        }}
    }

    listAllUsers(admin, currGame){
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            Player.findOne({id: playerId}).then(tarPlayer => {
                if (tarPlayer){
                    var name= tarPlayer.getPlayerName();
                    var outMsg = helper.oneButton(name,name);
                    var text=`{"recipient":{"id":"${admin.getPlayerId()}"},"message":${outMsg}}`
                    helper.sender(JSON.parse(text));
                }
        });
    }}

    resetBet(currGame){
        currGame.setTableBet(0);
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            Player.findOne({id: playerId}).then(tarPlayer => { 
                if (tarPlayer){
                    tarPlayer.resetMyBet();
                    tarPlayer.contact(currGame);
                }
                });
        }
    }
    messagePlayersEnd(currGame){
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            Player.findOne({id: playerId}).then( tarPlayer => {
                if (tarPlayer){
                    var text=`{"recipient":{"id":"${tarPlayer.getPlayerId()}"},"message":{"text":"GAME OVER, Admin has ended the game. Thanks for playing. Messaging the bot again will allow you to create a New Game or Join a Game."}}`
                    helper.sender(JSON.parse(text));
                }
            });
        }
    }
    deletePlayers(currGame){
        for (var i =0; i<currGame.players.length; i++){
            var playerId = currGame.players[i];
            if (playerId){
                Player.deleteOne({id: playerId}).exec();
            }
        }
    }
}

const schema = {
    name: { type: mongoose.SchemaTypes.String, default: ''},
    id: { type: mongoose.SchemaTypes.Number},
    gameCode:{ type: mongoose.SchemaTypes.String,default: ''},
    state:{ type: mongoose.SchemaTypes.String,default: 'WELCOMED'},
    wallet:{ type: mongoose.SchemaTypes.Number,default: 0},
    admin:{ type: mongoose.SchemaTypes.Boolean,default: false },  
    myBet:{ type: mongoose.SchemaTypes.Number,default: 0}
};
const collectionName = "player"; // Name of the collection of documents
playerSchema = mongoose.Schema(schema);
playerSchema.loadClass(playerClass);
console.log(playerSchema);
const Player = mongoose.model(collectionName, playerSchema);
module.exports = Player;