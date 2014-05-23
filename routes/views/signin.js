var async = require('async');

var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	if (req.user) {
		return res.redirect('/settings');
	}
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'login';
	locals.form = req.body;
	locals.title = 'Sign in';
	locals.journeyOrigin = req.session.journeyOrigin;
	
	view.on('post', { action: 'signin' }, function(next) {
		
		if (!req.body.signin_email || !req.body.signin_password) {
			req.flash('error', 'Please enter your username and password.');
			return next();
		}
	
		var onSuccess = function() {
			if (locals.journeyOrigin) {
				res.redirect(locals.journeyOrigin + '?performFunction=focusOnCommentField');
			} else {
				res.redirect('/settings');
			}
		}
		
		var onFail = function() {
			req.flash('error', 'Your username or password were incorrect, please try again.');
			return next();
		}
		
		keystone.session.signin({ email: req.body.signin_email, password: req.body.signin_password }, req, res, onSuccess, onFail);
		
	});
	
	view.render('site/signin');
	
}
