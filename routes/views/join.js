var keystone = require('keystone'),
	async = require('async'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	if (req.user) {
		return res.redirect('/settings');
	}
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'join';
	locals.form = req.body;
	locals.title = 'Join';
	req.session.journeyOrigin = req.query.journeyOrigin;
	
	var data = {};
	
	view.on('post', { action: 'join' }, function(next) {
		
		async.series([
			
			function(done) {
				if (!req.body.join_name || !req.body.join_email || !req.body.join_password) {
					req.flash('error', 'Please enter a name, email and password.');
					return done(true);
				}
				if (req.body.join_password != req.body.join_passwordConfirm) {
					req.flash('error', 'Passwords must match.');
					return done(true);
				}
				return done();
			},
			
			function(done) {
				keystone.list('User').model.findOne({ email: req.body.join_email }, function(err, user) {
					if (err || user) {
						req.flash('error', 'User already exists with that email address.');
						return done(true);
					}
					return done();
				});
			},
			
			function(done) {
				var name = req.body.join_name.split(' ');
				var userData = {
					name: {
						first: name.length ? name[0] : '',
						last: name.length > 1 ? name[1] : ''
					},
					email: req.body.join_email,
					password: req.body.join_password
				};
				data.newUser = new User.model(userData);
				data.newUser.save(function(err) {
					return done(err);
				});
			}
			
		], function(err){
			
			if (err) return next();
			
			var onSuccess = function() {
				req.user.verifyEmail(req, res, function(err) {
					if (err) {
						console.error("===== Verification Email failed to send =====");
						console.error(err);
					}
				});
				res.redirect('/auth/verify');
			}
			
			var onFail = function(e) {
				req.flash('error', 'There was a problem signing you in, please try again.');
				return next();
			}
			
			keystone.session.signin(data.newUser._id, req, res, onSuccess, onFail);
			
		});
		
	});
	
	view.render('site/join');
	
}
