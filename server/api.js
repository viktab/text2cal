/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

const socketManager = require("./server-socket");

const client_id = "510499010330-j3k8ennpjumilg50pnb247og0u4t5plt.apps.googleusercontent.com";
const client_secret = "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";
const redirect_uris = ["http:/127.0.0.1/5000"]; //TODO add heroku link

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing
  res.send({});
});

router.post("/schedule", (req, res) => {
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  getAccessToken(auth);
  const schedule = req.body.content;
  var s = new Date(2022, 3, 22, 16, 00, 00);
  var start = s.toISOString();
  var e = new Date(2022, 3, 22, 18, 00, 00);
  var end = e.toISOString();
  var event = {
    'summary': 'testing',
    'description': 'It worked :0',
    'start': {
      'dateTime': start,
      'timeZone': 'America/New_York'
    },
    'end': {
      'dateTime': end,
      'timeZone': 'America/New_York'
    },
  };
  console.log(auth);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
  res.send({});
});

router.get("/code", (req, res) => {
  // Get url to ask user for token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.send({url: authUrl});
});

router.post("/usercode", (req, res) => {
  console.log("setting code");
  console.log(req.body.code);
  req.session.code = req.body.code;
  res.send({});
});

router.post("/addevent", (req, res) => {
  console.log(req.session.code);
  console.log(oAuth2Client);
  oAuth2Client.getToken(req.session.code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log(token);
    oAuth2Client.setCredentials(token);
    const event = {
      'summary': req.body.name,
      'description': req.body.description,
      'start': {
        'date': req.body.start
      },
      'end': {
        'date': req.body.end
      },
    };
  
    const calendar = google.calendar({version: 'v3', oAuth2Client});
    calendar.events.insert({
      auth: oAuth2Client,
      calendarId: 'primary',
      resource: event,
    }, function(err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        console.log(err);
        return;
      }
      console.log('Event created: %s', event.htmlLink);
    });
    res.send({});
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: "https://www.googleapis.com/auth/calendar",
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
    });
  });
}

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Create oAuth2Client with credentials
  const credentials = JSON.parse(content);
  const {client_secret, client_id, redirect_uris} = credentials.web;
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
});

module.exports = router;
