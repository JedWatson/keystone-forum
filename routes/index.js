var keystone = require('keystone'),
	_ = require('underscore'),
	globals = require('../lib/globals'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.init);
keystone.pre('routes', middleware.loadTags);
keystone.pre('routes', middleware.countTopics);
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
	dev: importRoutes('./dev'),
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
	
	
	// Authentication
	app.get('/auth/confirm', routes.auth.confirm);
	app.get('/auth/:service', routes.auth.service);
	
	// User
	app.all('/settings*', middleware.requireUser);
	app.all('/settings', routes.views.settings);
	
	app.all('/new-topic', middleware.requireUser);
	app.all('/new-topic', routes.views['new-topic']);
	
	app.all('/profile/:profile', routes.views.profile);
	
	
	// Test Emails
	app.get('/email/:key', routes.dev.email);
	
	
	// API
	app.all('/api*', keystone.initAPI);

}
