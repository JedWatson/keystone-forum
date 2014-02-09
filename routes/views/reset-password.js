var keystone = require('keystone'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	view.on('init', function(next) {
		
		console.log(req.params.key);
		
		User.model.findOne().where('resetPasswordKey', req.params.key).exec(function(err, user) {
			if (err) return next(err);
			if (!user) {
				req.flash('error', "Sorry, that reset password key isn't valid.");
				return res.redirect('/forgot-password');
			}
			locals.found = user;
			next();
		});
		
	});
	
	view.on('post', { action: 'reset-password' }, function(next) {
		
		if (req.body.password != req.body.password_confirm) {
			req.flash('error', 'Please make sure both passwords match.');
			return next();
		}
		
		locals.found.password = req.body.password;
		locals.found.resetPasswordKey = '';
		locals.found.save(function(err) {
			if (err) return next(err);
			req.flash('success', 'We changed your password, please sign in.');
			res.redirect('/signin');
		});
		
	});
	
	view.render('site/reset-password');
	
}
