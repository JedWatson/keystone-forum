var _ = require('underscore'),
	querystring = require('querystring'),
	keystone = require('keystone');


/**
	Initialise locals pre-routes
*/

exports.init = function(req, res, next) {
	
	// set locals
	
	var locals = res.locals,
		current = locals.current = {
			user: req.user
		};
	
	
	// set page basics
	
	locals.page = {
		title: 'KeystoneJS',
		path: req.url,
		url: req.protocol + '://' + req.get('host') + req.url
	};
	
	locals.qs_set = qs_set(req, res);
	
	next();
	
}


/**
	Make categories universally available
*/

exports.loadTags = function(req, res, next) {
	
	keystone.list('Tag').model.find().exec(function(err, tags) {
		if (err) {
			return res.status(500).render('500', {
				err: err
			});
		}
		req.tags = tags;
		res.locals.tags = tags;
		next();
	});
	
}


/**
	Count all topics
*/

exports.countTopics = function(req, res, next) {
	
	keystone.list('Topic').model.count().where('state', 'published').where('author').ne(null).exec(function(err, count) {
		req.totalTopicCount = count;
		res.locals.totalTopicCount = count;
		next();
	});
	
}


/**
	Inits the error handler functions into `req`
*/

exports.initErrorHandlers = function(req, res, next) {
	
	res.err = function(err, title, message) {
		res.status(500).render('errors/500', {
			err: err,
			errorTitle: title,
			errorMsg: message
		});
	}
	
	res.notfound = function(title, message) {
		res.status(404).render('errors/404', {
			errorTitle: title,
			errorMsg: message
		});
	}
	
	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length }) ? flashMessages : false;
	
	next();
	
};

/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/login');
	} else {
		next();
	}
	
}


/**
	Returns a closure that can be used within views to change a parameter in the query string
	while preserving the rest.
*/

var qs_set = exports.qs_set = function(req, res) {

	return function qs_set(obj) {

		var params = _.clone(req.query);

		for (var i in obj) {
			if (obj[i] === undefined || obj[i] === null) {
				delete params[i];
			} else if (obj.hasOwnProperty(i)) {
				params[i] = obj[i];
			}
		}

		var qs = querystring.stringify(params);

		return req.path + (qs ? '?' + qs : '');

	}

}