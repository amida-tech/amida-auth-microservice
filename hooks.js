const hooks = require('hooks');
const request = require('request');

var token = undefined;

hooks.beforeAll((transaction, done) => {
  console.log('*** beforeAll: Get admin token ***')
  let t1 = transaction[0]
  let url = `${t1.protocol}\/\/${t1.host}:${t1.port}/api/v2/auth/login`
  request.post({url: url, body: {username: 'admin', password: 'admin'}, json: true}, function(err, res, body) { 
    token = body.token
    done()
  })
});

hooks.beforeEach((transaction, done) => {
  console.log('*** beforeEach: Setting admin token')
  transaction.request.headers.Authorization = `Bearer ${token}`;
  console.log('Auth: ', transaction.request.headers.Authorization)
  done();
});
