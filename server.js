'use strict';

// App dependencies 
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Load environment variables from .env
require('dotenv').config();

// App setup 
const PORT = process.env.PORT || 3000;

// Start express
const app = express();

// use CORS
app.use(cors());

// Any route that is not /location will run the function
app.use("*", noHandlerFound);

//Location Route 
app.get('/location', (request,response) => {
  let city = request.query.city;
  //reference key in env file
  let key = process.env.LOCATIONIQ_API_KEY;
  const URL = `https://us1.locationiq.com/v1/search.php/?key=${key}&q=${city}&format=json`;
  superagent.get(URL)
    .then(data => {
      let location = new Location(data.body[0], city);
      response.status(200).json(location);
    })
    .catch((error) => {
      errorHandler();
    })
};

// Weather Route
app.get('/weather', (request, response) => {
  try {
  const forecast = require('./data/weather.json').data;
  let weatherArr = forecast.map(value => new Weather(value));
  response.send(weatherArr);
}
  catch (error) {
    handleError();
  }
});



// Location Constructor 
function Location(obj, query) {
  this.latitude = obj.lat;
  this.longitude = obj.lon;
  this.search_query = query;
  this.formatted_query = obj.display_name;
};

// Weather Constructor 
function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = new Date(obj.valid_date).toDateString();
};

//Error function
function handleError(req, res){
  res.status(500).send("Sorry, something went wrong");
};

function noHandlerFound(req, res) {
  res.status(404).send('Not Found');
};

// Start server
app.listen(PORT, () => {
  console.log(`server is now listening on port ${PORT}`);
});