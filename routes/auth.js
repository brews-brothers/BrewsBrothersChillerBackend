var express = require('express');
var router = express.Router();
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var knex = require('../db/knex');
var jwt = require('jsonwebtoken');

var env = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL
}

passport.use(new GoogleStrategy(
  env,
  function(token, tokenSecret, profile, done) {
    var user = profile.emails[0].value;
    console.log(profile.emails[0].value);

    // knex('users').select().where('oauthid', user.oauthid).first()
    //   .then(function(person) {
    //     if (!person) {
    //       knex('users').insert({
    //         first_name: user.first_name,
    //         last_name: user.last_name,
    //         oauthid: user.oauthid,
    //         profile_image_url: user.profile_image_url,
    //         current_cash: 10000
    //       }, 'id').then(function(id) {
    //         user.id = id[0];
            // done(null, user);
          // });
        // } else {
        //   user.id = person.id;

        // }
      // })
      console.log(token+' = token');
      // console.log(profile);
        done(null, user);
  }
));

  router.get('/google/callback', function(req, res, next) {
    passport.authenticate('google', function(err, user, info) {
      console.log('made it here 2')
      if (err) {
        next(err);
      } else if (user) {
        var token = jwt.sign(user, process.env.JWT_SECRET, {
          expiresIn:15778463
        })
        // res.setHeader('x-token',token);
        var authUrl = 'http://localhost:8080/#/authenticate/'+token;
        res.redirect(authUrl);
      } else if (info) {
        next(info);
      }
    })(req, res, next);
  });

  router.get('/google', passport.authenticate('google', {
      // scope: 'profile'
      scope: 'email'
    }),
    function(req, res) {
      // The request will be redirected to Facebook for authentication, so this
      // function will not be called.

      console.log(req.user)
      res.end('success')
    });

    router.get('/logout', function(req, res, next){
      req.logout();
      res.send('logged out')
    })


module.exports = {
  router: router,
  passport: passport
}
