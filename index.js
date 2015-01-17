var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var fs = require('fs');
//var multer = require('multer');
var busboy = require('connect-busboy');

var app = express();

app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


//...
app.use(busboy()); 
//...
app.post('/api/v1/audio', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/uploads/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            res.send('audio uploaded successfully');
        });
    });
});

app.get('/', function (req, res) {
  res.send('Audio Cloud');
});

app.get('/ping', function (req, res) {
  res.send('Pong!');
});

app.post('/api/v1/audio', function (req, res) {
	console.log("Got POST /api/v1/audio");
});



app.listen(80);
