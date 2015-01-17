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
    console.log("Handling POST /api/v1/audio");
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        var fileno = Date.now(); 
        console.log("fileno:" + fileno);
        var newfilename = fileno+'.mp3';
        console.log("Saving audio file ");
        fstream = fs.createWriteStream(__dirname + '/uploads/' + newfilename);
        file.pipe(fstream);
        fstream.on('close', function () {
            res.end(fileno+'');
        });
    });
});

app.get('/api/v1/audio/:audioId', function(req, res){
   console.log("Inside Get /api/v1/audio/:audioId");
   var audioId = req.params.audioId;
   console.log("Audio ID:" + audioId);
   var filePath = path.join(__dirname, '/uploads/'+audioId+'.mp3');
   var stat = fs.statSync(filePath);

   res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': stat.size
   });

   var readStream = fs.createReadStream(filePath);
   // We replaced all the event handlers with a simple call to readStream.pipe()
   console.log("Sending audio file");
   readStream.pipe(res);
});

app.get('/api/v1/numbertext', function(req, res){
  console.log("Handling /api/v1/numbertext");
  var nt = req.query.nt;
  console.log('nt:'+nt);
  res.end(nt+'');
});
app.get('/', function (req, res) {
  res.send('Audio Cloud');
});

app.get('/ping', function (req, res) {
  res.send('Pong!');
});

app.listen(80);
