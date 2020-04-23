require('dotenv').config();
var express        = require('express'),
    server         = require('request');

// get env var for tokens
const token = process.env['TOKEN_MESS'];

//Helper functions to send to user based on ID, and JSON
module.exports = {
sender: function sendMessage(jsonObject){
 var reqObj = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: jsonObject
};
console.log(JSON.stringify(reqObj));
server(reqObj, function(error, response, body) {
    if (error) {
    console.log('Error sending message: ', JSON.stringify(error));
    //cb(false)
    } else if (response.body.error) {
    console.log("API Error: " + JSON.stringify(response.body.error));
    //cb(false)
    } else{
    //cb(true)
    console.log(true)
    }
})},

getFirstName: function getFirstName(messengerId, playerObj){
    var reqObj = {
        url: `https://graph.facebook.com/${messengerId}?fields=first_name,last_name,profile_pic&access_token=${token}`,
        method: 'GET'
    };
    server(reqObj, function(error, response, body) {
        if (error) {
        console.log('Error sending message: ', JSON.stringify(error));
        //cb(false)
        } else if (response.body.error) {
        console.log("API Error: " + JSON.stringify(response.body.error));
        //cb(false)
        } else{
            name=JSON.parse(body).first_name;
            playerObj.setName(name);
        }
    })

},

twoButton: function buttonJson(writtenText, buttonOne, buttonTwo){
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
},
oneButton: function buttonJson(writtenText, buttonOne){
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
            }
          ] 
        } 
      }
    }`
    return outMsg; 
},
threeButton: function buttonJson(writtenText, buttonOne, buttonTwo, buttonThree){
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
            },
            { 
              "type":"postback", 
              "title":"${buttonThree}", 
              "payload":"DEVELOPER_DEFINED_PAYLOAD" 
            }  
          ] 
        } 
      }
    }`
    return outMsg; 
}


};



   

