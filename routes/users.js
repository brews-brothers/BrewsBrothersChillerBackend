var express = require('express');
var router = express.Router();
var knex = require('../db/knex');


/* GET users listing. */
router.put('/pinumber', function(req, res, next) {
  knex('users').where({email: req.user.email}).update('pi_id', req.body.piIpAddress).then(function(){
    res.send('updated');
  }).catch(function(err){
    throw err;
  })
});

module.exports = router;
