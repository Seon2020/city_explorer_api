'use strict';

// App dependencies 
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Load environment variables from .env
require('dotenv').config();

//add postgres client 
const client = new pg.Client(process.env.DATABASE_URL);

// App setup 
const PORT = process.env.PORT || 3000;

// Start express
const app = express();

// use CORS
app.use(cors());

//Location Route 
app.get('/location', (request, response) => {
  let city = request.query.city;
  //reference key in env file
  let key = process.env.GEOCODE_API_KEY;
  //Check to see if result was cached previously
  const sqlQuery = `SELECT * FROM location WHERE search_query=$1`;
  // query with cached result and city instance as params (brackets to indicate row)
  client.query(sqlQuery, [city])
  // then pass the output in the .then
    .then(output => {
  // If that row exists (AKA returns true)
      if (output.rowCount) {
  //used the cached data
        response.status(200).send(output.rows[0]);
  //else use locationiq data
      } else {
  //define the URL to retrieve data
        const URL = `https://us1.locationiq.com/v1/search.php/?key=${key}&q=${city}&format=json`;
  // superagent call passing in URL as param
        superagent.get(URL)
  // pass data in the .then statement
          .then(data => {
  //create new location object with the data and store in variable
            let location = new Location(data.body[0], city);
  // Code to insert values into the location table for next time
            const insertSql = `INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
  // Create parametrized queries with SQL code and new location object results as params          
            client.query(insertSql, [location.search_query, location.formatted_query, location.latitude, location.longitude])
  // Then send results to client side
              .then(results =>
                response.status(200).send(location));
          });
      };
    })
  // call handleError function if necessary 
    .catch(error => {
      handleError(request, response, error);
})})

// Weather Route
app.get('/weather', (request, response) => {
  let key = process.env.WEATHER_API_KEY;
  let lat = request.query.latitude;
  let lon = request.query.longitude;

  const URL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
  
  superagent.get(URL)
    .then(data => {
      let weather = data.body.data.map(val => {
        return new Weather(val);
      });
      response.status(200).send(weather);
    })
    .catch (error => {
      handleError();
    });
})

// Trails Route
app.get('/trails', (request, response) => {
  let key = process.env.TRAIL_API_KEY;
  let lat = request.query.latitude;
  let lon = request.query.longitude;

  const URL = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;

  superagent.get(URL)
    .then(data => {
      let trail = data.body.trails.map(val => {
        return new Trail(val);
      });
      response.status(200).send(trail);
    })
    .catch(error => {
      handleError();
    });
})

// Any route that is not /location will run the function
app.use("*", noHandlerFound);

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

// Trail Constructor 
function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionStatus;
  this.condition_date = obj.conditionDate.slice(0,10);
  this.condition_time = obj.conditionDate.slice(11,20);
}

//Error function
function handleError(req, res, error) {
  res.status(500).send("Sorry, something went wrong");
};

function noHandlerFound(req, res) {
  res.status(404).send('Not Found');
};

// Connect to database and start server
client.connect()
  .then( () => {
    app.listen(PORT, () => {
        console.log(`server is now listening on port ${PORT}`);
    });
  })
  .catch(error => {
    console.log('ERROR', error);
  });