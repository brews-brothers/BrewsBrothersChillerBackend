require('dotenv').load();
var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var db = require('mongodb');
var promise = require('bluebird');
var request = require('request');


function Batches(){
  return knex('batches');
}

function Users(){
  return knex('users');
}


/* GET batches for dashboard */



router.get('/', function(req, res, next){
  Batches().where('user_id', req.user.id).select().then(function(batches) {
    return promise.map(batches, function(batch) {
      var batchId = batch.id;
      return new Promise(function(res, rej){
        db.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db){
        var brews = db.collection('brews');
        // console.log(batch);
         brews.find({
          brew_id:batchId
        }).limit(1).next(function(err, data){
          console.log(data);
          batch.created = data.created,
          batch.lastRun = data.lastRun,
          batch.logs = data.logs,
          batch.notes = data.notes
          batch.schedule = data.schedule;
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
        notes: ''
      }, function(){
        res.send("success");
      })
    });
  });
});

router.delete('/', function(req, res, next){
  Batches().where('id', req.body.id).del()
  .then(function(){
    res.end();
  })
})
router.post('/saveBrew', function(req, res, next){
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
  if(req.user.pi_id){
    var salt = bcrypt.genSaltSync(5);
    var hash = bcrypt.hashSync(process.env.SERVER_SECRET, salt);
    request.post('http://'+req.user.pi_id+'/startycle', {password: hash, sechdule: req.body.sechdule});
  }else{
    res.send('need a pi ip address');
  }

})
module.exports = router;
