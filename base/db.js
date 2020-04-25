//Tables 
var players = [];
var games = []; 

module.exports = {
    
    searchGames: function searchGames(gameCode){
        for (var i =0; i<games.length; i++){
            if (gameCode == games[i].getGameCode()){
                return games[i]; 
            }
            
          }
        return NaN; 
    }, 
    searchPlayers: function searchPlayers(playerId){
        for (var i =0; i<players.length; i++){
            if (playerId == players[i].getPlayerId()){
                return players[i]; 
            }  
          }
        return NaN; 
    }, 

    pushPlayer: function pushPlayer(playerObj){
        players.push(playerObj); 
    },

    pushGames: function pushGame(gameObj){
        games.push(gameObj); 
    },

    searchPlayersByName: function searchPlayersByName(name){
        for (var i =0; i<players.length; i++){
            if (name == players[i].getPlayerName()){
                return players[i]; 
            }  
          }
        return NaN; 
    },

    deletePlayer: function deletePlayer(playerId){
        for (var i =0; i<players.length; i++){
            if (playerId == players[i].getPlayerId()){
                players.splice(i, 1); 
            }  
          }
    },

    deleteGame: function deleteGame(gameCode) {
        for (var i =0; i<games.length; i++){
            if (gameCode == games[i].getGameCode()){
                games.splice(i,1); 
            }
            
          }
    }

}