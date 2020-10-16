const { strict } = require("assert")

'use strict'; 

// Load environment variables from .env
require('dotenv').config();

// App dependencies 
const express = require('express');
const cors = require('cors');

// App setup 
const PORT = process.env.PORT || 3000;

// Start express
const app = express();

// use CORS
app.use(cors());

//Location Route 
app.get('/location', (request, response) => {
  let city = request.query.city;
  //Get data from source
  let data = require('./data/location.json')[0];
  let location = new Location(data, city);
  response.send(location);
});

// Weather Route
app.get('/weather', (request, response) => {
  let forecast = require('./data/weather.json');
  let weatherArr = [];
  forecast.data.forEach(value => {
    weatherArr.push(new Weather(value));
  });
  response.send(WeatherArr);
});



// Location Constructor 
function Location(obj, query) {
  this.latitude = obj.lat;
  this.longitude = obj.lon;
  this.search_query = query;
  this.formatted_query = obj.display_name;
}

// Weather Constructor 
function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = new Date(obj.valid_date).toDateString();
}

// Start server
app.listen(PORT, () => {
  console.log(`server is now listening on port ${PORT}`);
});