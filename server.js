'use strict';

// App dependencies 
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Load environment variables from .env
require('dotenv').config();

// Declare port
const PORT = process.env.PORT || 3000;

// Start express
const app = express();

// use CORS
app.use(cors());

//add postgres client 
const client = new pg.Client(process.env.DATABASE_URL);

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

//Movie route
app.get('/movies', (request, response) => {
  let key = process.env.MOVIE_API_KEY;
  let city = request.query.search_query;

  const URL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&language=en-US&query=${city}&page=1&include_adult=false`;

  superagent.get(URL)
    .then(data => {
    // results is the array that contains standard movie list objects 
      let movies = data.body.results.map(val => {
        return new Movie(val);
      });
      response.status(200).send(movies);
    })
    .catch(error => {
      handleError(request, response, error);
    });
})

// Yelp route
app.get('/yelp', (request, response) => {
  const numPerPage = 5;
  let page = request.query.page || 1;
  const URL = 'https://api.yelp.com/v3/businesses/search';

  const queryParams = {
    term: 'restaurants',
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    limit: numPerPage, 
    offset: ((page - 1) * numPerPage + 1)
  };

  superagent.get(URL)
  .auth(process.env.YELP_API_KEY, {type: 'bearer'})
  .query(queryParams)
  .then(data => {
    const results = data.body.businesses;
    const output = [];
    results.forEach(val => {
      output.push(new Restaurant(val));
    });
    response.status(200).send(output);
  })
  .catch(error => {
    handleError(request, response, error);
  });
})

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
      handleError(request, response, error);
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
      handleError(request, response, error);
    });
})

// Any route that is not found
app.use("*", noHandlerFound);

// Location Constructor 
function Location(obj, query) {
  this.latitude = obj.lat;
  this.longitude = obj.lon;
  this.search_query = query;
  this.formatted_query = obj.display_name;
}

// Movie Constructor 
function Movie(obj) {
  this.title = obj.original_title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
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
function handleError(request, response, error) {
  res.status(500).send("Sorry, something went wrong");
};

function noHandlerFound(request, response) {
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