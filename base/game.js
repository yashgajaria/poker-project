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
    constructor() {
        this.gameCode = Str.random(6).toUpperCase();
        this.players= []; 
        this.pot = 0;
        this.bet = 0;
        this.lastMove= NaN;    
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
        this.bet=0;
        for (var i =0; i<this.players.length; i++){
            var playerId = this.players[i];
            var tarPlayer= db.searchPlayers(playerId);
            if (tarPlayer){
                tarPlayer.resetMyBet();
            }
        }
    }
    setLastMove(state, name, intVal){
        if (state=="RAISE"){
            this.lastMove= `${name} raised by ${intVal}`
        }
        else if (state=="Call"){
            this.lastMove= `${name} called with ${intVal}`
        }
        else if (state=="Check"){
            this.lastMove= `${name} checked`
        }
        else if (state=="Next Round"){
            this.lastMove= "New Round"
        }
        else if (state=="WIN"){
            this.lastMove= `${name} won $${intVal}!`
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
    callBet(){
        return this.bet;
    }
    addBet(value){
        this.bet= this.bet+value;
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

} //
