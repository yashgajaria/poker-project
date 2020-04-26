const Str = require('@supercharge/strings');
helper        = require("./helper.js");
var db = require('./db.js');

module.exports = class Game {
    gameCode;
    players;
    pot;
    bet;
    minBet;  
    lastMove; 
    overrideTarget;
    adminId;    
    constructor() {
        this.gameCode = Str.random(6).toUpperCase();
        this.players= []; 
        this.pot = 0;
        this.bet = 0;
        this.lastMove= NaN;
        this.adminId="";    
    }
    getGameCode(){
        return this.gameCode
    }
    getPot(){
        return this.pot; 
    }
    getOverideTarget(){
        return this.overrideTarget;
    }
    addPlayer(playerId){
        this.players.push(playerId);
    }
    setTableBet(intVal){
        this.bet=intVal;
    }
    setAdminId(adminId){
        this.adminId=adminId;
    }
    resetPot(){
        this.pot=0;
    }
    resetBet(){
        this.bet=0;
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                tarPlayer.resetMyBet();
            }
        }
    }
    setOverrideTarget(name){
        this.overrideTarget=name; 
    }
    setLastMove(state, name, intVal){
        if (state=="RAISE"){
            this.lastMove= `${name} raised by ${intVal}`
        }
        else if (state=="Call" && intVal>0){
            this.lastMove= `${name} called with ${intVal}`
        }
        else if (state=="Next Round"){
            this.lastMove= "New Round"
        }
        else if (state=="WIN"){
            this.lastMove= `${name} won $${intVal}!`
        }
        else if (state=="ALLIN" && intVal>0){
            this.lastMove= `${name} went ALL IN!`
        }
        // else if (state=="Call" && intVal<=0){
        //     this.lastMove= `${name} went ALL IN!`
        // }
        else if (intVal==0){
            this.lastMove= `${name} checked`
        }

        
    }
    resetLastMove(){
        this.lastMove=NaN;
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
                tarPlayer.contact(this.pot, this.lastMove);
            }
        }
    }
    addPot(value){
        this.pot=this.pot+value;
    }
    getTableBet(){
        return this.bet;
    }
    addTableBet(value){
        this.bet+=value;
    }
    listAllUsers(admin){
        //console.log(this.players.length);
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

    deletePlayers(){
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            if (playerId){
                db.deletePlayer(playerId);
            }
        }

    }

    deletePlayerById(playerId){
        for (var i =0; i<this.players.length; i++){
            if (playerId == this.players[i]){
                players.splice(i, 1); 
            }  
          }
    }

    messagePlayersEnd(){
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                var text=`{"recipient":{"id":"${tarPlayer.getPlayerId()}"},"message":{"text":"GAME OVER, Admin has ended the game. Thanks for playing. Messaging the bot again will allow you to create a New Game or Join a Game."}}`
                helper.sender(JSON.parse(text));
            }
        }
    }

    messageAdmin(message){
        var text=`{"recipient":{"id":"${this.adminId}"},"message":{"text":"${message}"}}`
        helper.sender(JSON.parse(text));
    }

} //
