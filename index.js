const express = require('express'); //Imports express.js
const path = require('path');
const app = express();
const port = 3000; //app port
const fs = require('fs'); //Imports filesystem module
const log = require('log-to-file'); //Imports log-to-file package
var captchaCount = 0;

app.use(express.static('cdn')); //Serves files for the bot to use
app.use(express.json()); //Parses JSON body from POST requests

//Main page route
app.get('/', function (req, res) {
  res.sendStatus(200)
});

//BungoGIFs route
app.get('/bungogifs', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const bungogifs = require('./v2/data/bungogifs.json');
  var item = bungogifs[Math.floor(Math.random() * bungogifs.length)];
  res.json(item);
  log(`GET /v2/bungogifs 200 OK || Requested by: ${ip}`, 'requests.log');
});

//BungoMemes route
app.get('/bungomemes', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const bungomemes = require('./v2/data/bungomemes.json');
  var item = bungomemes[Math.floor(Math.random() * bungomemes.length)];
  res.json(item);
  log(`GET /v2/bungomemes 200 OK || Requested by: ${ip}`, 'requests.log');
});

//Command info general route
app.get('/commands', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const commands = JSON.parse(fs.readFileSync('./v2/data/commands.json'));
  res.json(commands);
  log(`GET /v2/commands 200 OK || Requested by: ${ip}`, 'requests.log');
});

//Command info search route
app.get('/commands/:name', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const commands = JSON.parse(fs.readFileSync('./v2/data/commands.json'));
  var param = req.params.name;
  if (param in commands) {
    var item = commands[param];
    res.json(item);
    log(`GET /v2/commands/${param} 200 OK || Requested by: ${ip}`, 'requests.log');
  } else {
    res.status(404).json({message: "command " + param + " not found!", status: 404});
    log(`GET /v2/commands/${param} 404 NOT FOUND || Requested by: ${ip}`, 'requests.log');
  }
});

//Data file route
app.get('/data/:filename', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var filePath = './v2/data/' + req.params.filename;
  const file = JSON.parse(fs.readFileSync(filePath));
  res.json(file);
    log(`GET ${filePath} 200 OK || Requested by: ${ip}`, 'requests.log');
});

//POST route for BungoGIFs
app.post('/bungogifs', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const array = JSON.parse(fs.readFileSync('./v2/data/bungogifs.json'));
  var data = req.body;
  array.push(data);
  fs.writeFileSync('./v2/data/bungogifs.json', JSON.stringify(array));
  res.status(201).send(req.body);
  log(`POST /v2/bungogifs {${data}} 201 CREATED || Requested by: ${ip}`, 'requests.log');
});

//POST route for BungoGIFs
app.post('/bungomemes', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const array = JSON.parse(fs.readFileSync('./v2/data/bungomemes.json'));
  var data = req.body;
  array.push(data);
  fs.writeFileSync('./v2/data/bungomemes.json', JSON.stringify(array));
  res.status(201).send(req.body);
  log(`POST /v2/bungomemes {${data}} 201 CREATED || Requested by: ${ip}`, 'requests.log');
});

//Serves the captcha images saved locally
app.get('/captcha/:filename', function(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let filename = req.params.filename;
  let filepath = './captcha/' + filename;
  if (fs.existsSync(filepath)) {
    let options = {
      root: path.join(__dirname + '/captcha/')
    }
    
    res.status(200).sendFile(filename, options);
    log(`GET /captcha/${filename} 200 OK || Requested by: ${ip}`, 'requests.log');
  } else {
    res.status(404).json({message: `captcha file '${filename}' not found!`, status: 404});
    log(`GET /captcha/${filename} 404 NOT FOUND || Requested by: ${ip}`, 'requests.log');
  }
});

//Route for captcha service
app.get('/captcha', function (req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  async function captcha() {
    const randomString = require('random-base64-string');
    const filename = randomString(10);
    const { randomBytes } = require('crypto'); 
    const code = randomBytes(10).toString('hex').substring(0, 6).toUpperCase();
    const { CaptchaGenerator, resolveImage } = require("captcha-canvas");
    const fs = require("fs");
    const bg = await resolveImage("./cdn/media/bsd-bg.jpg");

    const captcha = new CaptchaGenerator()
      .setDimension(150, 450)
      .setCaptcha({text: code, size: 60, color: "#ffa52e"})
      .setDecoy({opacity: 0})
      .setTrace({color: "#ffa52e", opacity: 0});
    
    const buffer = await captcha.generateSync({background: bg});
    fs.writeFileSync(`./captcha/${filename}.png`, buffer);
    res.json({text: captcha.text, image: `https://eca.astrookai.repl.co/captcha/${filename}.png`});
  }

  captcha();
  log(`Captcha '${captcha.value}' has been created!`, 'requests.log');
  log(`GET /captcha [${captcha.value}] 200 OK || Requested by: ${ip}`, 'requests.log');
});

// RRoute that send APi's uptime
app.get('/uptime', function (req, res) {
  const os = require('os');
  var uptime_seconds = os.uptime();
      uptime_minutes = uptime_seconds/60;
      uptime_hours = uptime_minutes/60;

  uptime_hours = Math.floor(uptime_hours);
  uptime_minutes = Math.floor(uptime_minutes);
  uptime_seconds = Math.floor(uptime_seconds);
  
  uptime_hours = uptime_hours%60;
  uptime_minutes = uptime_minutes%60;
  uptime_seconds = uptime_seconds%60;

  let uptime = `${uptime_hours}h ${uptime_minutes}m ${uptime_seconds}s`
  
  res.json({uptime: uptime});;
}); 

// Allows the server to run
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});