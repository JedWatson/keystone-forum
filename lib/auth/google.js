var async = require('async'),
	_ = require('underscore');

var passport = require('passport'),
	passportGoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var keystone = require('keystone'),
	User = keystone.list('User');

var credentials = {
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	
	scope: 'profile email'
};

exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.google] - Triggered authentication process...' );
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		googleUser: false, // Google user
		forumUser: false // KeystoneJS Forum user
	}
	
	// Initalise Google credentials
	var googleStrategy = new passportGoogleStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	});
	
	// Pass through authentication to passport
	passport.use(googleStrategy);
	
	// Determine workflow
	var workflow = _.has(req.query, 'cb') ? 'save' : false;
	
	// Function to process Facebook response and decide whether we should create or update a user
	var processFacebookUser = function(googleUser) {
	
		data.googleUser = googleUser;
		
		// console.log(googleUser);
		
		if (req.user) {
		
			console.log('[services.google] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.forumUser = req.user;
			
			return saveForumUser();
		
		} else {
		
			console.log('[services.google] - No user signed in, attempting to match via email...');
			console.log('------------------------------------------------------------');
			
			var email = data.googleUser.profile.emails;
			
			if ( !email.length ) {
				console.log("[services.google] - No email address detected, creating new user...");
				console.log('------------------------------------------------------------');
				return createForumUser();
			}
			
			User.model.findOne({ email: _.first(data.googleUser.profile.emails).value }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.google] - No matching user found via email, creating new user...");
					console.log('------------------------------------------------------------');
					return createForumUser();
				}
				
				console.log("[services.google] - Matched user via email, updating user..." );
				console.log('------------------------------------------------------------');
				
				data.forumUser = user;
				
				return saveForumUser();
				
			});
		
		}
	
	}
	
	/*
	// Function to create KeystoneJS Forum user
	var createForumUser = function() {
		
		console.log('[services.google] - Creating KeystoneJS Forum user...' );
		console.log('------------------------------------------------------------');
		
		// Define data
		var email = data.googleUser.profile.emails;
		
		// Structure data
		var userData = {
			name: {
				first: data.googleUser.profile.name.givenName,
				last: data.googleUser.profile.name.familyName
			},
			email: email.length ? _.first(data.googleUser.profile.emails).value : null,
			password: Math.random().toString(36).slice(-8)
		};
		
		console.log('[services.google] - KeystoneJS Forum user create data:', userData );
		
		// Create user
		data.forumUser = new User.model(userData);
		
		console.log('[services.google] - Created new instance of KeystoneJS Forum user.' );
		console.log('------------------------------------------------------------');
		
		return saveForumUser();
		
	}
	
	// Function to save KeystoneJS Forum user
	var saveForumUser = function() {
		
		// Save the KeystoneJS Forum user data
		console.log('[services.google] - Saving KeystoneJS Forum user...' );
		console.log('------------------------------------------------------------');
		
		var userData = {
			services: {
				google: {
					isConfigured: true,
					
					profileId: data.googleUser.profile.id,
					
					username: data.googleUser.profile.username,
					accessToken: data.googleUser.accessToken
				}
			}
		};
		
		console.log('[services.google] - KeystoneJS Forum user update data:', userData );
		
		data.forumUser.set(userData);
		
		data.forumUser.save(function(err) {
			
			if (err) {
				console.log(err);
				console.log("[services.google] - Error saving KeystoneJS Forum user.");
				console.log('------------------------------------------------------------');
				return callback(err);
				
			} else {
				
				console.log("[services.google] - Saved KeystoneJS Forum user.");
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
	
		console.log('[services.google] - Signing in KeystoneJS Forum user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.google] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.google] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin(String(data.forumUser._id), req, res, onSuccess, onFail);
	
	}
	*/
	
	// Perform workflow
	switch( workflow ) {
	
		// Save Google user data once returning from Google
		case 'save':
		
			console.log('[services.google] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('google', {}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.google] - Error retrieving Google account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.google] - Successfully retrieved Google account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processFacebookUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with Google
		default:
		
			console.log('[services.google] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('google', { accessType: 'offline', approvalPrompt: 'force' })(req, res, next);
	
	}
	
};
