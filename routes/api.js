'use strict';

var axios = require('axios');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB, ({useNewUrlParser: true, useUnifiedTopology: true}));

function compareStocks(stockArr) {
  let relLikesArr = [];
  let relLikesDiff = stockArr[0].likes - stockArr[1].likes;
  if (stockArr[0].likes > stockArr[1].likes) {
    relLikesArr.push(relLikesDiff);
    relLikesArr.push(relLikesDiff*-1);
  } else if (stockArr[0].likes < stockArr[1].likes) {
    relLikesArr.push(relLikesDiff*-1);
    relLikesArr.push(relLikesDiff);
  } else {
    relLikesArr = [0,0];
  }

  return {"stockData": [
    {
      "stock": stockArr[0].stock,
      "price": stockArr[0].price,
      "rel_likes": relLikesArr[0]
    },
    {
      "stock": stockArr[1].stock,
      "price": stockArr[1].price,
      "rel_likes": relLikesArr[1]
    }
  ]}
}

module.exports = function (app) {

  var stockSchema = new mongoose.Schema({
    stock: String,
    likes: [{type: String}]
  })

  const Stock = mongoose.model("Stock", stockSchema);

  app.route('/api/stock-prices')
    .get(function (req, res){
      let stockType = req.query.stock;
      let stockTypeIsArray = Array.isArray(stockType);
      let like = !!req.query.like;
      let stockResArray;
      let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (stockTypeIsArray) {
        stockResArray = [];
        for (let i = 0; i < 2; i++) {
          let stockName = stockType[i].toUpperCase();
          var config = {
            method: 'get',
            url: `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`,
          };
          axios(config)
            .then((response) => {
              if (response.data == "Unknown symbol") {
                // stockResArray.push({ "error": "external source error" });
                // if (i === 1) res.json(compareStocks(stockResArray))
                res.json({"error": "error"});
              } else {
                Stock.findOne({stock: stockName}, async (err, doc) => {
                  if (err) {
                    console.log(err);
                  } else {
                    if (!doc) {
                      var newStockInDatabase = new Stock({
                        stock: stockName,
                        likes: like ? [ip] : []
                      })
                      await newStockInDatabase.save();
                    }
                    else {
                      if (like && !doc.likes.includes(ip)) doc.likes.push(ip)
                      await doc.save();
                    }
                    stockResArray.push({
                      "stock": response.data.symbol,
                      "price": response.data.latestPrice,
                      "likes": doc.likes.length
                    })
                    if (i === 1) await res.json(compareStocks(stockResArray))
                  }
                })
              }
            })
        }
        
      } else {
        let stockName = stockType.toUpperCase();
        var config = {
          method: 'get',
          url: `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`,
        };
        axios(config)
          .then(function (response) {
            if (response.data == "Unknown symbol") {
              res.json({
                "stockData": {
                  "error": "external source error"
                }
              })
            } else {
              Stock.findOne({stock: stockName}, async (err, doc) => {
                if (err) {
                  console.log(err);
                } else {
                  if (!doc) {
                    var newStockInDatabase = new Stock({
                      stock: stockName,
                      likes: like ? [ip] : []
                    })
                    await newStockInDatabase.save();
                  }
                  else {
                    if (like && !doc.likes.includes(ip)) doc.likes.push(ip)
                    await doc.save();
                  }
                  let output = {
                    "stockData": {
                      "stock": response.data.symbol,
                      "price": response.data.latestPrice,
                      "likes": doc.likes.length
                    }
                  }
                  res.json(output);
                }
              })
              
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    });
    
};
