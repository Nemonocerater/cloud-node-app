
module.exports = exports = function (app, config) {
	var user_model = require('./model-user')(config);
	var password_reset_model = require('./model-password-reset')(config);
	var user_manager = require('./user-manager')(user_model, password_reset_model);
	app.use('/auth', require('./auth')(user_manager));
}
