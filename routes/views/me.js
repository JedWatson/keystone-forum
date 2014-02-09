var keystone = require('keystone'),
	moment = require('moment');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'me';
	
	view.on('post', { action: 'profile.top' }, function(next) {
	
		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'name,email,twitter,website,github',
			flashErrors: true
		}, function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your changes have been saved.');
			return next();
		
		});
	
	});
	
	view.on('post', { action: 'profile.bottom' }, function(next) {
	
		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'isPublic,bio,photo,mentoring.available,mentoring.free,mentoring.paid,mentoring.swap,mentoring.have,mentoring.want',
			flashErrors: true
		}, function(err) {
		
			if (err) {
				return next();
			}
			
			req.flash('success', 'Your changes have been saved.');
			return next();
		
		});
	
	});
	
	view.on('post', { action: 'profile.password' }, function(next) {
	
		if (!req.body.password || !req.body.password_confirm) {
			req.flash('error', 'Please enter a password.');
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
	
	view.render('site/me');
	
}
