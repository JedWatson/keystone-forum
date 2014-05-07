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

exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.twitter] - Triggered authentication process...');
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		twitterUser: false, // Twitter user
		forumUser: false // KeystoneJS Forum user
	}
	
	// Initalise Twitter credentials
	var twitterStrategy = new passportTwitterStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	});
	
	// Pass through authentication to passport
	passport.use(twitterStrategy);
	
	// Determine workflow
	var workflow = _.has(req.query, 'cb') ? 'save' : false;
	
	// Function to process Twitter response and decide whether we should create or update a user
	var processTwitterUser = function(twitterUser) {
	
		data.twitterUser = twitterUser;
		
		// console.log(twitterUser);
		
		if (req.user) {
		
			console.log('[services.twitter] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.forumUser = req.user;
			
			return saveForumUser();
		
		} else {
		
			console.log('[services.twitter] - No user signed in, attempting to match via id...');
			console.log('------------------------------------------------------------');
			
			User.model.findOne({ 'services.twitter.profileId': data.twitterUser.profile.id }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.twitter] - No matching user found via id, creating new user..." );
					console.log('------------------------------------------------------------');
					return createForumUser();
				}
				
				console.log("[services.twitter] - Matched user via id, updating user..." );
				console.log('------------------------------------------------------------');
				
				data.forumUser = user;
				
				return saveForumUser();
				
			});
		
		}
	
	}
	
	// Function to create KeystoneJS Forum user
	var createForumUser = function() {
		
		console.log('[services.twitter] - Creating KeystoneJS Forum user...');
		console.log('------------------------------------------------------------');
		
		// Define data
		var splitName = data.twitterUser.profile && data.twitterUser.profile.displayName ? data.twitterUser.profile.displayName.split(' ') : [],
			firstName = (splitName.length ? splitName[0] : ''),
			lastName = (splitName.length > 1 ? splitName[1] : '');
		
		// Structure data
		var userData = {
			name: {
				first: firstName,
				last: lastName
			},
			email: null, // Twitter API does not return email
			password: Math.random().toString(36).slice(-8),
			
			twitter: data.twitterUser.profile.username
		};
		
		console.log('[services.twitter] - KeystoneJS Forum user create data:', userData );
		
		// Create user
		data.forumUser = new User.model(userData);
		
		console.log('[services.twitter] - Created new instance of KeystoneJS Forum user.');
		console.log('------------------------------------------------------------');
		
		return saveForumUser();
		
	}
	
	// Function to save KeystoneJS Forum user
	var saveForumUser = function() {
		
		// Save the KeystoneJS Forum user data
		console.log('[services.twitter] - Saving KeystoneJS Forum user...');
		console.log('------------------------------------------------------------');
		
		var userData = {
			twitter: data.twitterUser.profile.username,
			
			services: {
				twitter: {
					isConfigured: true,
					
					profileId: data.twitterUser.profile.id,
					
					username: data.twitterUser.profile.username,
					accessToken: data.twitterUser.accessToken
				}
			}
		};
		
		console.log('[services.twitter] - KeystoneJS Forum user update data:', userData );
		
		data.forumUser.set(userData);
		
		data.forumUser.save(function(err) {
			
			if (err) {
				console.log(err);
				console.log("[services.twitter] - Error saving KeystoneJS Forum user.");
				console.log('------------------------------------------------------------');
				return callback(err);
				
			} else {
				
				console.log("[services.twitter] - Saved KeystoneJS Forum user.");
				console.log('------------------------------------------------------------');
				
				if ( req.user ) {
					return callback();
				} else {
					return signinForumUser();
				}
				
			}
			
		});
		
	}
	
	// Function to sign in KeystoneJS Forum user
	var signinForumUser = function() {
	
		console.log('[services.twitter] - Signing in KeystoneJS Forum user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.twitter] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.twitter] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin(String(data.forumUser._id), req, res, onSuccess, onFail);
	
	}
	
	// Perform workflow
	switch( workflow ) {
	
		// Save Twitter user data once returning from Twitter
		case 'save':
		
			console.log('[services.twitter] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('twitter', {}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.twitter] - Error retrieving Twitter account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.twitter] - Successfully retrieved Twitter account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processTwitterUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with Twitter
		default:
		
			console.log('[services.twitter] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('twitter', { scope: ['email'] })(req, res, next);
	
	}
	
};
