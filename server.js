const { strict } = require("assert")

'use strict'; 

// Load environment variables from .env
require('dotenv').config();

// App dependencies 
const express = require('express');
const cors = require('cors');

// App setup 
const PORT = process.env.PORT || 3000;

