const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('GET functions', () => {
    test('Viewing one stock: GET request to /api/stock-prices', () => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'likes');
          assert.property(res.body.stockData, 'price');
        })
    }),
    test('Viewing one stock and liking it: GET request to /api/stock-prices/', () => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isAtLeast(res.body.stockData.likes, 1);
          assert.property(res.body.stockData, 'likes');
          assert.property(res.body.stockData, 'price');
        })
    }),
    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', () => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'likes');
          assert.property(res.body.stockData, 'price');
          let currentLikes = res.body.stockData.likes;
          chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'goog', like: true})
            .end((err2, res2) => {
              assert.equal(res2.status, 200);
              assert.equal(res2.body.stockData.stock, 'GOOG');
              assert.property(res2.body.stockData, 'likes');
              assert.property(res2.body.stockData, 'price');
              assert.equal(currentLikes,res2.body.stockData.likes);
            })
        })
    }),
    test('Viewing two stocks: GET request to /api/stock-prices/', () => {
      chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=msft')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'MSFT');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');
        })
    }),
    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', () => {
      chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=msft&like=true')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'MSFT');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');
        })
    })
  })
});
