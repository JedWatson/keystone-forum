var keystone = require('keystone'),
	_ = require('underscore'),
	globals = require('../lib/globals'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.init);
keystone.pre('routes', middleware.loadTags);
keystone.pre('render', middleware.flashMessages);

// Handle 404 errors
keystone.set('404', function(req, res, next) {
	res.notfound();
});

// Handle other errors
keystone.set('500', function(err, req, res, next) {
	var title, message;
	if (err instanceof Error) {
		message = err.message;
		err = err.stack;
	}
	res.err(err, title, message);
});

// Load Routes
var routes = {
	api: importRoutes('./api'),
	views: importRoutes('./views'),
	auth: importRoutes('./auth')
};

// Bind Routes
exports = module.exports = function(app) {
	
	// Forum
	app.get('/', routes.views.index);
	app.get('/' + globals.forum.routePatterns.filters, routes.views.index);
	app.get('/' + globals.forum.routePatterns.filters + '/:tag?', routes.views.index);
	
	app.all('/topic/:topic', routes.views.topic);
	
	
	// Session
	app.all('/join', routes.views.join);
	app.all('/login', routes.views.signin);
	app.get('/signout', routes.views.signout);
	app.all('/forgot-password', routes.views['forgot-password']);
	app.all('/reset-password/:key', routes.views['reset-password']);
	
	
	// Auth
	app.get('/auth/github', routes.auth.github);
	app.get('/auth/twitter', routes.auth.twitter);
	app.get('/auth/google', routes.auth.google);
	
	
	// User
	app.all('/settings*', middleware.requireUser);
	app.all('/settings', routes.views.settings);
	
	app.all('/new-topic', middleware.requireUser);
	app.all('/new-topic', routes.views['new-topic']);
	
	app.all('/profile/:profile', routes.views.profile);
	
	// API
	app.all('/api*', keystone.initAPI);

}
