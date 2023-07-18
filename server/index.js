'use strict';

const express = require('express');
const morgan = require('morgan');
const planesDao = require('./plane-dao');
const userDao = require('./user-dao');
const cors = require('cors');
const { check, body, validationResult, } = require('express-validator'); 

// init express
const app = new express();
const port = 3001;

// set up middlewares
app.use(express.json());
app.use(morgan('dev'));
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
}
app.use(cors(corsOptions));

const passport = require('passport');                             
const LocalStrategy = require('passport-local');                  

passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user) {
    return callback(null, false, 'Incorrect username or password');  
  }

  return callback(null, user); 
}));

passport.serializeUser(function (user, callback) {
  callback(null, user);
});

passport.deserializeUser(function (user, callback) { 
  return callback(null, user); 
});

const session = require('express-session');

app.use(session({
  secret: "secret sentence",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
}

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** Users APIs ***/

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info});
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(req.user);
      });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/sessions/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

/*** Planes APIs ***/

// GET /api/planes
app.get(`/api/planes`, async (req, res) => {
  await planesDao.listPlanes()
    .then(planes => res.json(planes))
    .catch(() => res.status(500).end());
});

// GET /api/planes/<id>
app.get(`/api/planes/:id`, [
  check('id').isInt().withMessage('Invalid id parameter'),
], async (req, res) => {
  try {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const planeId = req.params.id;
    const result = await planesDao.getPlane(planeId);
    if (result.error)
      res.status(404).json(result);
    else
      res.status(200).json(result);
  }
  catch (err) {
      res.status(500).end();
  }
});

// POST /api/planes
app.post(`/api/planes`, [
  body('requested').isArray().withMessage('requested must be an array'),
  body('requested.*.planeId').isInt().withMessage('Invalid planeId property'),
  body('requested.*.userId').isInt().withMessage('Invalid userId property'),
  body('requested.*.F').isInt().withMessage('Invalid F property'),
  body('requested.*.P').isString().withMessage('Invalid P property'),
], isLoggedIn, async (req, res) => {
  try {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }

    const order = req.body;
    const result = await planesDao.createReservation(order);
    if (result.error)
      // if the response contains a filed 'error' it's returned an error code 400 with the response
      res.status(400).json(result);
    else 
      res.status(200).json(result);
  }
  catch (err) {
    res.status(500).end();
  }
});

// DELETE /api/planes/
app.delete('/api/planes/', [
  body('planeId').isInt().withMessage('Invalid planeId property'),
  body('userId').isInt().withMessage('Invalid userId property'),
], isLoggedIn, async (req, res) => {
  try {
    const planeId = req.body.planeId;
    const userId = req.body.userId;
    const result = await planesDao.deleteReservation(planeId, userId);
    if (result.error)
      res.status(400).json(result);
    else
      res.status(200).json(result);
  }
  catch {
    res.status(503).end();
  }
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});