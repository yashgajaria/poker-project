const mongoose = require("../database");
const Str = require('@supercharge/strings');
helper        = require("../helper.js");

class gameClass {
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
    getQuery(){
        var query= {gameCode: this.gameCode};
        return query; 
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
    getLastMove(){
        return this.lastMove; 
    }
    addPlayer(playerId){
        this.players.push(playerId);
        var options = { multi: true};
        Game.update(this.getQuery(), {players: this.players}, options).then( ()=> {}); 
    }
    setTableBet(intVal){
        this.bet=intVal;
        var options = { multi: true};
        Game.update(this.getQuery(), {bet: intVal}, options).then( ()=> {}); 
    }
    setAdminId(adminId){
        this.adminId=adminId;
        var options = { multi: true};
        Game.update(this.getQuery(), {adminId: adminId}, options).then( ()=> {}); 
    }
    resetPot(){
        this.pot=0;
        var options = { multi: true};
        Game.update(this.getQuery(), {pot: 0}, options).then( ()=> {}); 
    }
    setOverrideTarget(name){
        this.overrideTarget=name; 
        var options = { multi: true};
        Game.update(this.getQuery(), {overrideTarget: this.overrideTarget}, options).then( ()=> {}); 
    }
    setLastMove(state, name, intVal, difference){
        if (state=="RAISE"){
            this.lastMove= `${name} raised by ${intVal}`
        }
        else if (state=="Call" && difference>0){
            this.lastMove= `${name} called with ${difference}`
        }
        else if (state=="Next Round"){
            this.lastMove= "New Round"
        }
        else if (state=="WIN"){
            this.lastMove= `${name} won $${intVal}!`
        }
        else if (state=="ALLIN" && (intVal>0 || difference>0)){
            this.lastMove= `${name} went ALL IN!`
        }
        else if (intVal==0){
            this.lastMove= `${name} checked`
        }
        var options = { multi: true};
        Game.update(this.getQuery(), {lastMove: this.lastMove}, options).then( ()=> {}); 

        
    }
    resetLastMove(){
        this.lastMove="";
        var options = { multi: true};
        Game.update(this.getQuery(), {lastMove: this.lastMove}, options).then( ()=> {}); 
    }
    addPot(value){
        this.pot=this.pot+value;
        var options = { multi: true};
        Game.update(this.getQuery(), {pot: this.pot}, options).then( ()=> {}); 
    }
    getTableBet(){
        return this.bet;
    }
    addTableBet(value){
        this.bet+=value;
        var options = { multi: true};
        Game.update(this.getQuery(), {bet: this.bet}, options).then( ()=> {});
    }
    deletePlayerById(playerId){
        for (var i =0; i<this.players.length; i++){
            if (playerId == this.players[i]){
                this.players.splice(i, 1); 
            }  
          }
    }

    messageAdmin(message){
        var text=`{"recipient":{"id":"${this.adminId}"},"message":{"text":"${message}"}}`
        helper.sender(JSON.parse(text));
    }

}

const schema = {
    gameCode:{ type: mongoose.SchemaTypes.String, default: Str.random(6).toUpperCase()},
    players:[mongoose.SchemaTypes.Number],
    pot:{ type: mongoose.SchemaTypes.Number, default: 0},
    bet:{ type: mongoose.SchemaTypes.Number, default: 0},
    minBet:{ type: mongoose.SchemaTypes.Number, default: 0},
    lastMove:{ type: mongoose.SchemaTypes.String, default: ""},
    overrideTarget:{ type: mongoose.SchemaTypes.String, default: ""},
    adminId:{ type: mongoose.SchemaTypes.Number, default:0}    
};
const collectionName = "Game"; // Name of the collection of documents
gameSchema = mongoose.Schema(schema);
gameSchema.loadClass(gameClass);
const Game = mongoose.model(collectionName, gameSchema);
module.exports = Game;