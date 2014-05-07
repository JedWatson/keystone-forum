var keystone = require('keystone'),
	moment = require('moment'),
	_ = require('underscore'),
	config = require('../../config');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'settings';
	
	
	// Update the User
	
	view.on('post', { action: 'user.update' }, function(next) {
	
		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'name, email, website, bio, photo, notifications.topics',
			flashErrors: true
		}, function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your changes have been saved.');
			return next();
		
		});
	
	});
	
	
	// Update the password if native user accounts are enabled
	
	if (config.enableNativeUserAccounts) {
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
				
				req.flash('success', 'Your changes have been saved.');
				return next();
			
			});
		
		});
	}
	
	
	// Deauth anything
	
	/*
	view.on('init', function(next) {
	
		if (!_.has(req.query, 'deauth')) return next();
		
		switch(req.query.deauth)
		{
			case 'twitter':
				req.user.services.twitter = false;
			break;
			
			case 'github':
				req.user.services.github = false;
			break;
			
			case 'google':
				req.user.services.google = false;
			break;
		}
		
		console.log(req.user.services)
		
		req.user.save(function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your changes have been saved.');
			return next();
		
		});
	
	});
	*/
	
	
	view.render('site/settings');
	
}



