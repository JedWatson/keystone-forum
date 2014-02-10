var keystone = require('keystone'),
	_ = require('underscore'),
	globals = require('../lib/globals'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.init);
keystone.pre('routes', middleware.loadCategories);
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
	authentication: importRoutes('./authentication')
};

// Bind Routes
exports = module.exports = function(app) {
	
	// Forum
	app.get('/', routes.views.index);
	app.get('/' + globals.forum.routePatterns.filters, routes.views.index);
	app.get('/' + globals.forum.routePatterns.filters + '/:category?', routes.views.index);
	
	app.all('/topic/:topic', routes.views.topic);
	
	
	// Session
	app.all('/join', routes.views.join);
	app.all('/login', routes.views.signin);
	app.get('/signout', routes.views.signout);
	app.all('/forgot-password', routes.views['forgot-password']);
	app.all('/reset-password/:key', routes.views['reset-password']);
	
	
	// Authentication
	app.get('/authentication/github', routes.authentication.github);
	app.get('/authentication/twitter', routes.authentication.twitter);
	
	
	// User
	app.all('/me*', middleware.requireUser);
	app.all('/me', routes.views.me);
	app.all('/me/ask', routes.views.ask);
	
	app.all('/profile/:profile', routes.views.profile);
	
	// API
	app.all('/api*', keystone.initAPI);

}
