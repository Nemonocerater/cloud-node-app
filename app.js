'use strict';

var path = require('path');
var express = require('express');
var session = require('cookie-session');
var config = require('./config');

var app = express();

app.disable('etag'); // stops some web caching
app.set('trust proxy', true); // tell express it's ok that we are behind a proxy

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(session({
	name: 'session',
	secret: config.secret,
	signed: true
}));

// Add Login Functionality
var user_model = require('./model-user')(config);
app.use('/auth', require('./auth')(user_model));
//user_model.generate_reset_hash('joe@example.com', function () {});

// Basic 404 handler
app.use(function (req, res) {
	res.status(404).send('Not Found');
});

// Basic error handler
app.use(function (err, req, res, next) {
	/* jshint unused:false */
	console.error(err);
	// If our routes specified a specific response, then send that. Otherwise,
	// send a generic message so as not to leak anything.
	res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
	// Start the server
	var server = app.listen(config.port, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('App listening at http://%s:%s', host, port);
	});
}

module.exports = app;
