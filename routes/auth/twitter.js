var async = require('async'),
	keystone = require('keystone');

var twitter = require('../../lib/auth/twitter');

exports = module.exports = function(req, res, next) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	async.series([
		
		function(cb) {
			
			// TODO: Work out in what cases we may actually want to sign out the user
			return cb();
			
			if (!req.user) return cb();
			
			keystone.session.signout(req, res, function() {
				return cb();
			});
			
		}
		
	], function(err) {
	
		twitter.authenticateUser(req, res, next, function(err, type) {
		
			/*
				/signin
				
					- Success: /profile/{user.id} (signed in, redirected)
					- Fail: /signin (error displayed)
			*/
			
			// Define redirects for success and fail responses
			var redirects = {
				success: '/settings',
				fail: '/login'
			}
			
			// Redirect based on response
			if (err) {
			
				console.log('[auth.twitter] - Twitter authentication failed - ' + JSON.stringify(err));
				console.log('------------------------------------------------------------');
				
				return res.redirect(redirects.fail);
			
			} else {
			
				console.log('[auth.twitter] - Twitter authentication was successful.');
				console.log('------------------------------------------------------------');
				
				return res.redirect(redirects.success);
			
			}
		
		});
	
	});

};
