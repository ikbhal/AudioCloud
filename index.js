var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.get('/', function (req, res) {
  res.send('Audio Cloud');
});

app.get('/ping', function (req, res) {
  res.send('Pong!');
});

app.post('/api/v1/audio', function (req, res) {
	fs.readFile(req.files.audioFile.path, function (err, data) {
	  // ...
	  var newPath = __dirname + "/uploads/audioFile";
	  fs.writeFile(newPath, data, function (err) {
	    res.send('Post audio to cloud successfully');
	  });
	});
});



app.listen(80);
