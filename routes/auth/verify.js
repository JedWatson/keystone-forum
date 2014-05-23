var keystone = require('keystone'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'profile';
	locals.title = 'Verify your email address - KeystoneJS';


	// UPDATE the User
	
	view.on('init', function(next) {
		if (!req.user) {
			req.flash('error', 'Please sign in to access this page.');
			return res.redirect('/login');
		} else if (!req.params.key) {
			return next();
		} else if (req.params.key && (req.user.emailVerificationKey === req.params.key)) {
			req.user.isVerified = true;
			req.user.save(function(err) {
				if (err) {
					console.error("===== Reset Password failed to send email =====");
					console.error(err);
				}
				req.flash('success', 'Welcome to the KeystoneJS forum, this is your profile.' );
				res.redirect('/settings');
			
			});
		} else {
			req.flash('error', "Sorry, that verification key isn't valid.");
			return next();
		}
	});


	// EMAIL the Verification Email
	
	view.on('get', { resendVerificationEmail: true }, function(next) {
			
		req.user.verifyEmail(function(err) {
			if (err) {
				console.error("===== Verification Email failed to send =====");
				console.error(err);
			}
		});
		req.flash('success', 'We have sent you a link to confirm your email address.');
		res.redirect('/auth/verify');
		
	});

	view.render('auth/verify');
	
}
