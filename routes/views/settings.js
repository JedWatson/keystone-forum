var keystone = require('keystone'),
	moment = require('moment'),
	_ = require('underscore'),
	config = require('../../config');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'settings';
	locals.title = 'Settings';
	
	
	// Update the User
	
	view.on('post', { action: 'user.update' }, function(next) {
	
		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'name, email, website, bio, photo, notifications.topics',
			flashErrors: true
		}, function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your profile changes have been saved.');
			return next();
		
		});
	
	});
	
	
	// Update the password
	
	view.on('post', { action: 'user.password' }, function(next) {
	
		if (!req.body.password || !req.body.password_confirm) {
			req.flash('error', 'Please complete all password fields.');
			return next();
		}
	
		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'password',
			flashErrors: true
		}, function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your password has been updated.');
			return next();
		
		});
	
	});
	
	
	// Disconnect anything
	
	view.on('init', function(next) {
	
		if (!_.has(req.query, 'disconnect')) return next();
		
		var serviceName = '';
		
		switch(req.query.disconnect)
		{
			case 'twitter': req.user.services.twitter.isConfigured = null; serviceName = 'Twitter'; break;
			case 'github': req.user.services.github.isConfigured = null; serviceName = 'GitHub'; break;
			case 'google': req.user.services.google .isConfigured= null; serviceName = 'Google'; break;
		}
		
		req.user.save(function(err) {
		
			if (err) {
				req.flash('success', 'The service could not be disconnected, please try again.');
				return next();
			}
			
			req.flash('success', serviceName + ' has been successfully disconnected.');
			return res.redirect('/settings');
		
		});
	
	});
	
	
	view.render('site/settings');
	
}



