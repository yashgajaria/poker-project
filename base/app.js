require('dotenv').config();
var express        = require('express'),
    bodyParser     = require('body-parser'),
    http           = require('http'),
    server         = require('request'),
    app            = express();

// get env var for tokens
const token = process.env['TOKEN_MESS'];
const webhktoken = process.env['TOKEN_WEBHOOK'];


app.use(bodyParser.json()); 

// Post endpoint  
app.post('/', function(req, res){
    console.log(JSON.stringify(req.body))
    app.messageHandler(req.body, function(result){
        console.log("Async Handled: " + result)
    })
    res.send(req.body)
})

// connect to webhook 
app.get('/', function(req, res) {
    if (req.query['hub.verify_token'] === webhktoken) {
       res.send(req.query['hub.challenge']);
     } else {
       res.send('Error, wrong validation token');
     }
});

// Message handler - async function to handle incoming messages 
app.messageHandler = function(j, cb) {
    var g = require("./game.js");
    text=g(j); 
    //text = "Hello";
    var data = {
    "recipient":{
        "id":j.entry[0].messaging[0].sender.id
    },
    "message":{
        "text": text
        //"text":j.entry[0].messaging[0].message.text
    }
    };
    var reqObj = {
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
      json: data
    };
    console.log(JSON.stringify(reqObj))
    server(reqObj, function(error, response, body) {
      if (error) {
        console.log('Error sending message: ', JSON.stringify(error));
        cb(false)
      } else if (response.body.error) {
        console.log("API Error: " + JSON.stringify(response.body.error));
        cb(false)
      } else{
        cb(true)
      }
    });
}

// create a health check endpoint
app.get('/health', function(req, res) {
    res.send('okay');
});

// set port
app.set('port', process.env.PORT || 8080);


// start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});