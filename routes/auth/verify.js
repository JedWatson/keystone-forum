var keystone = require('keystone'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'profile';
	locals.title = 'Verify your email address - KeystoneJS';
	
	// Set existing user if already logged in
	if (req.user) {
		locals.existingUser = req.user;
	}
	
	// Function to handle email verification and signin
	var verifyAndSignIn = function() {
	
		console.log('[auth.verify] - Signing in user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
			console.log("[auth.verify] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			user.isVerified = true;
			user.save();
			req.flash('success', 'Welcome to the KeystoneJS forum, this is your profile.' );
			res.redirect('/settings');
		}
		
		var onFail = function(err) {
			console.log("[auth.verify] - Failed signing in.");
			console.log('------------------------------------------------------------');
			return res.redirect('/login');
		}
		
		keystone.session.signin(locals.existingUser.id, req, res, onSuccess, onFail);
	
	}
	
	
	// UPDATE the User
	
	view.on('init', function(next) {
		if (locals.existingUser) {
			return verifyAndSignIn();
		} else if (!req.query.email || !req.query.key) {
			return next();
		} else {
			User.model.findOne().where('email', req.query.email).where('emailVerificationKey', req.query.key).exec(function(err, foundUser) {
				if (err) {
					next(err);
				} else if (!foundUser) {
					req.flash('error', "Sorry, that verification key isn't valid.");
					next();
				} else {
					locals.existingUser = foundUser;
					return verifyAndSignIn();
				}
			});
		}
	});
	
	
	// SEND the Verification Email
	
	view.on('get', { resendVerificationEmail: true }, function(next) {
			
		req.user.verifyEmail(req, res, function(err) {
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
