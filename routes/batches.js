require('dotenv').load();
var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var db = require('mongodb');
var promise = require('bluebird');
var request = require('request');
var bcrypt = require('bcrypt');
var unirest = require('unirest');



function Batches(){
  return knex('batches');
}

function Users(){
  return knex('users');
}


/* GET batches for dashboard */
//test
router.get('/', function(req, res, next){
  Batches().where('user_id', req.user.id).select().then(function(batches) {
    console.log(batches);
    return promise.map(batches, function(batch) {
      var batchId = batch.id;
      return new Promise(function(res, rej){
        db.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db){
        var brews = db.collection('brews');
        // console.log(batch);
         brews.find({
          brew_id:batchId
        }).limit(1).next(function(err, data){
          if(data){
            batch.created = data.created,
            batch.lastRun = data.lastRun,
            batch.logs = data.logs,
            batch.notes = data.notes
            batch.schedule = data.schedule;
          }
          res(batch)
          })
        })
      });
    })
  }).then(function(batches) {
    res.send(batches);
  })
})

router.post('/', function(req, res, next){
  console.log(req.body);
  Batches().insert({
    user_id: req.user.id,
    beer_id: req.body.styleNumber,
    name: req.body.name
  }, 'id').then(function(data){
    db.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db){
      var brews = db.collection('brews');
      brews.insert({
        brew_id:data[0],
        schedule: req.body.schedule,
        logs: [],
        notes: []
      }, function(){
        res.send("success");
      })
    });
  });
});

router.delete('/:id', function(req, res, next){
  console.log(req.params.id);
  Batches().where('id', req.params.id).del()
  .then(function(){
    db.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db){
      var brews = db.collection('brews');
      brews.remove({brew_id:req.params.id}, function(){
        res.send("success");
      })
    });
  })
})
router.post('/savebrew', function(req, res, next){
  console.log(req.body);
  db.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db){
    var brews = db.collection('brews');
    brews.update(
      {brew_id:req.body.id},
      {
        brew_id:req.body.id,
        schedule: req.body.schedule,
        created: req.body.created,
        lastRun: req.body.lastRun,
        logs: req.body.logs,
        notes: req.body.notes
      },
      {upsert:true}, function(){
      res.send("success");
    })
  });
})
router.post('/startbrew', function(req, res, next){
  console.log(req.body);
  if(req.user.pi_id){
    console.log('have pi id');
    // var salt = bcrypt.genSaltSync(5);
    // var hash = bcrypt.hashSync(process.env.SERVER_SECRET, salt);
    var hash='hello'
    var schedule = JSON.stringify(req.body.schedule)
    console.log(req.user.pi_id);
    unirest.post(req.user.pi_id+'/startcycle').send({ "password": hash, "schedule": schedule }).end(function (response) {
      console.log(response.body);
      res.send('starting your brew');
    });
    // var toSend = req.body.schedule
    // request.post(req.user.pi_id+'/startcycle', {form:{password: hash, schedule: toSend}});
    // res.send('sent the schedule');
  }else{
    res.send('need a pi ip address');
  }

})
module.exports = router;
