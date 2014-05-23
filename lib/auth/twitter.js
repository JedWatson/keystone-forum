var async = require('async'),
	_ = require('underscore');

var passport = require('passport'),
	passportTwitterStrategy = require('passport-twitter').Strategy;

var keystone = require('keystone'),
	User = keystone.list('User');

var credentials = {
	consumerKey: process.env.TWITTER_CONSUMER_KEY,
	consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
	callbackURL: process.env.TWITTER_CALLBACK_URL
};

exports.authenticateUser = function(req, res, next)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.twitter] - Triggered authentication process...');
	console.log('------------------------------------------------------------');
	
	// Initalise Twitter credentials
	var twitterStrategy = new passportTwitterStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		done(null, {
			accessToken: accessToken,
			refreshToken: refreshToken,
			profile: profile
		});
	});
	
	// Pass through authentication to passport
	passport.use(twitterStrategy);
	
	// Save user data once returning from Twitter
	if (_.has(req.query, 'cb')) {
		
		console.log('[services.twitter] - Callback workflow detected, attempting to process data...');
		console.log('------------------------------------------------------------');
		
		passport.authenticate('twitter', { session: false }, function(err, data, info) {
		
			if (err || !data) {
				console.log("[services.twitter] - Error retrieving Twitter account data - " + JSON.stringify(err) );
				return res.redirect('/login');
			}
			
			console.log('[services.twitter] - Successfully retrieved Twitter account data, processing...');
			console.log('------------------------------------------------------------');
			
			var name = data.profile && data.profile.displayName ? data.profile.displayName.split(' ') : [];
			
			var urls = JSON.parse(data.profile._raw).entities.url.urls || [];
			
			var auth = {
				type: 'twitter',
				
				name: {
					first: name.length ? name[0] : '',
					last: name.length > 1 ? name[1] : ''
				},
				
				website: urls.length ? urls[0].expanded_url : '',
				
				profileId: data.profile.id,
				
				username: data.profile.username,
				accessToken: data.accessToken,
				refreshToken: data.refreshToken
			}
			
			req.session.auth = auth;
			
			return res.redirect('/auth/confirm');
			
		})(req, res, next);
	
	// Perform inital authentication request to Twitter
	} else {
		
		console.log('[services.twitter] - Authentication workflow detected, attempting to request access...');
		console.log('------------------------------------------------------------');
		
		passport.authenticate('twitter', { scope: ['user:email'] })(req, res, next);
	
	}
	
};
