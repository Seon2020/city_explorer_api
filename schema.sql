DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS weather;
DROP TABLE IF EXISTS trails;

CREATE TABLE location (
  id SERIAL PRIMARY KEY,
  latitude FLOAT,
  longitude FLOAT,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255)
);

CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time DATE
);

CREATE TABLE trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  length FLOAT, 
  stars FLOAT,
  star_votes INT,
  summary VARCHAR(255),
  trail_url VARCHAR(255),
  conditions VARCHAR(255),
  condition_date DATE,
  condition_time TIME
);


