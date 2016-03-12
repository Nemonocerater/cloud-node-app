'use strict';

var extend = require('lodash').assign;
var mysql = require('mysql');

var database = 'global-users';

module.exports = function(config) {

	function getConnection() {
		return mysql.createConnection(extend({
			database: config.databases.global_users
		}, config.mysql));
	}

	function save_password_reset(reset_hash, username, callback) {
		var connection = getConnection();
		connection.query(
			'INSERT INTO `password_reset` (`reset_hash`, `username`) VALUES (?, ?)',
			[reset_hash, username],
			callback
		);
		connection.end();
	}

	function get_password_reset(reset_hash, callback) {
		var connection = getConnection();
		connection.query(
			'SELECT * FROM `password_reset` WHERE `reset_hash`=?',
			[reset_hash],
			function select_reset_hash(err, results) {
				if (err) { callback(err); }
				if (results.length > 0) {
					callback(null, results[0]);
				} else {
					callback();
				}
			}
		);
		connection.end();
	}

	/**
	 * This is a bizarre function that deletes userhashes for a certain user, but...
	 * it also deletes all reset hashes older than 4 hours ago.
	 *
	 * Not the cleanest approach, but we can do this outside of sending the response
	 * back to the client.  Then just dump the load burden on the app servers outside
	 * of any specific client response.
	 */
	function clear_old_reset_hashes(username, callback) {
		var duration = 14400; // 14,400 = 4 hours (in seconds)
		var connection = getConnection();
		connection.query(
			'DELETE FROM `password_reset` WHERE `username`=? OR `created_at` < (UNIX_TIMESTAMP() - ?)',
			[username, duration],
			callback
		);
		connection.end();
	}

	return {
		save_password_reset: save_password_reset,
		get_password_reset: get_password_reset,
		clear_old_reset_hashes: clear_old_reset_hashes
	};

};
