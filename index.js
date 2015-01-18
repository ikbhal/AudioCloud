var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var fs = require('fs');
//var multer = require('multer');
var busboy = require('connect-busboy');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/audiocloud');
var db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("Connected to mongodb");
}); 

//schema
var userSchema = new Schema({
  phone:  String,
  audio: [{ filename: String, tag:String, date: Date,
    stats: {
        voteups: { type: Number, default: 0},
        votedowns: { type:  Number, default:0},
        flags: { type: Number, default:0}
    }
  }],
  date: { type: Date, default: Date.now },
});

//model
var User = mongoose.model('User', userSchema);

// Save user first time using phone
userSchema.statics.saveFirstTime = function(phone,cb){
  
    console.log("saving user with phone no");
    
    var user = new User({
      phone: phone
    });

    user.save(function(err, user){
      console.log("user " + util.inspect(user) + " is saved");
      cb(err,user); 
    });

   return user;
};

// Get user by phone no
userSchema.statics.findByPhone = function(phone, cb) {
    console.log("Find user by phone : " + phone);
   
   User.findOne({phone:phone}, function(err, user){
     console.log("Got user " + user);
     cb(err, user);
   });
};

/**
   input: filename, tag
*/
userSchema.methods.addAudio = function(filename, tag, cb) {
    console.log("Add audio with filename:" + filename + ", tag:" + tag);

    this.audio.push({filename:filename, tag:tag, date:Date.now()});

    this.save(function(err, user){
        console.log("Save the user with audio data " + util.inspect(user));
        cb(err,user);
    });
};

/*
Audio vote up
*/
userSchema.methods.voteupAudio = function(filename, cb) {
   console.log("Vote up audio filename:" + filename);
   for(var i=0;this.audio.lenth;i++){
        if(this.audio[i].filename == filename){
            this.audio[i].stats.voteups = this.audio[i].stats.voteups+1;            

            //save audio
            this.save(function(err, user){
                console.log("After adding vote " + util.inspect(user));
                cb(err,user);
            });
            break;
        }
   } 
};


/*
Audio vote down
*/
userSchema.methods.votedownAudio = function(filename, cb) {
   console.log("Vote down audio filename:" + filename);
   for(var i=0;this.audio.lenth;i++){
        if(this.audio[i].filename == filename){
            this.audio[i].stats.votedowns = this.audio[i].stats.votedowns+1;            

            //save audio
            this.save(function(err, user){
                console.log("After adding vote down " + util.inspect(user));
                cb(err,user);
            });
            break;
        }
   } 
};


/*
Audio flag it
*/
userSchema.methods.flagAudio = function(filename, cb) {
   console.log("flag audio filename:" + filename);
   for(var i=0;this.audio.lenth;i++){
        if(this.audio[i].filename == filename){
            this.audio[i].stats.flags = this.audio[i].stats.flags+1;            

            //save audio
            this.save(function(err, user){
                console.log("After adding flag " + util.inspect(user));
                cb(err,user);
            });
            break;
        }
   } 
};

/*
get next, previous, first, last audio filenames/no
*/
userSchema.methods.getNavAudio = function(nav, current){
 console.log("Inside getNavAudio");
 switch(nav){
  case 3: //firstname
     if(typeof this.audio[0] != 'undefined'){
         return this.audio[0].filename;
     }
     return -1;
  case 4://last
     if(typeof this.audio[this.aduio.length-1] != 'undefined') 
         return this.audio[this.audio.length-1].filename;
     return -1;
  case 2://previous
     if(typeof this.audio[current-1] != 'undefined')
        return this.audio[current-1].filename;
     else
        return -1;
  case 1://next
      if(typeof this.audio[current+1] != 'undefined')
          return this.audio[current+1].filename;
      else
         return -1;
  default:
      return -1;
 };
};
var app = express();

app.use("/public", express.static(path.join(__dirname, 'public')));
//app.use(bodyParser.json());

//app.use(bodyParser.urlencoded({extended:false}));
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


//...
app.use(busboy()); 

// Save user first time
app.post('/api/v1/user', urlencodedParser, function(req,res){
    console.log("Inside post /api/v1/user");
    var phone = req.body.phone;
    console.log("phone:"+phone);
    res.end('saveuser');
});
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




//Upload audio, create user if not exist
app.post('/api/v2/audio', function(req, res) {
    console.log("Handling POST /api/v2/audio");
    var phone = req.query.phone;
    var tag = req.query.tag;
    console.log("phone:"+phone+",tag:" + tag);
    var fstream;
    req.pip(req.busboy);
    req.busboy.on('file', function(filename, file, filename) {
      console.log("Uploading: " + filename);
      var fileno = Date.now();
      console.log("fileno:" + fileno);
      var newfilename = fileno +'.mp3';
      console.log("Saving audio file " + newfilename);
      fstream = fs.createWriteStream(__dirname + '/uploads' + newfilename);
      file.pipe(fstream);
      fstream.on('close', function(){

       //Save in db
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
