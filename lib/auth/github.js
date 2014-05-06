var async = require('async'),
	_ = require('underscore'),
	request = require('request');

var passport = require('passport'),
	passportGithubStrategy = require('passport-github').Strategy;

var keystone = require('keystone');
	User = keystone.list('User');

var credentials = {
	clientID: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	callbackURL: process.env.GITHUB_CALLBACK_URL
};

exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.github] - Triggered authentication process...');
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		githubUser: false, // Github user
		forumUser: false // KeystoneJS Forum user
	}
	
	// Initalise GitHub credentials
	var githubStrategy = new passportGithubStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	});
	
	// Pass through authentication to passport
	passport.use(githubStrategy);
	
	// Determine workflow
	var workflow = _.has(req.query, 'callback') ? 'save' : false;
	
	// Function to process Github response and decide whether we should create or update a user
	var processGithubUser = function(githubUser) {
	
		data.githubUser = githubUser;
		
		console.log(githubUser);
		
		if (req.user) {
		
			console.log('[services.github] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.forumUser = req.user;
			
			return saveForumUser();
		
		} else {
		
			console.log('[services.github] - No user signed in, attempting to match via id...');
			console.log('------------------------------------------------------------');
			
			User.model.findOne({ 'services.github.profileId': data.githubUser.profile.id }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.github] - No matching user found via id, creating new user...");
					console.log('------------------------------------------------------------');
					return createForumUser();
				}
				
				console.log("[services.github] - Matched user via id, updating user...");
				console.log('------------------------------------------------------------');
				
				data.forumUser = user;
				
				return saveForumUser();
				
			});
		
		}
	
	}
	
	// Function to create GitHub user
	var createForumUser = function() {
		
		console.log('[services.github] - Creating GitHub user...');
		console.log('------------------------------------------------------------');
		
		// Define data
		var splitName = data.githubUser.profile && data.githubUser.profile.displayName ? data.githubUser.profile.displayName.split(' ') : [],
			firstName = (splitName.length ? splitName[0] : ''),
			lastName = (splitName.length > 1 ? splitName[1] : '');
		
		// Structure data
		var userData = {
			name: {
				first: firstName,
				last: lastName
			},
			email: null, // GitHub API should return emails but isn't
			password: Math.random().toString(36).slice(-8),
			
			github: data.githubUser.profile.username,
			website: data.githubUser.profile._json.blog
		};
		
		console.log('[services.github] - GitHub user create data:', userData );
		
		// Create user
		data.forumUser = new User.model(userData);
		
		console.log('[services.github] - Created new instance of GitHub user.');
		console.log('------------------------------------------------------------');
		
		return saveForumUser();
		
	}
	
	// Function to save GitHub user
	var saveForumUser = function() {
		
		// Save the GitHub user data
		console.log('[services.github] - Saving GitHub user...');
		console.log('------------------------------------------------------------');
		
		var userData = {
			github: data.githubUser.profile.username,
			website: data.githubUser.profile._json.blog,
			
			services: {
				github: {
					isConfigured: true,
					
					profileId: data.githubUser.profile.id,
					profileUrl: data.githubUser.profile.profileUrl,
					
					username: data.githubUser.profile.username,
					accessToken: data.githubUser.accessToken
				}
			}
		};
		
		async.series([
		
			function(done) {
			
				request({
					url: 'https://api.github.com/user/emails?access_token=' + userData.services.github.accessToken,
					headers: {
						'User-Agent': 'forums.keystonejs.com'
					}
				}, function(err, data) {
				
					if (err) {
						console.log(err);
						console.log("[services.github] - Error retrieving GitHub email addresses.");
						console.log('------------------------------------------------------------');
						return done();
						
					} else {
						
						console.log("[services.github] - Retrieved email addresses...");
						console.log('------------------------------------------------------------');
						
						var emails = JSON.parse(data.body);
						
						if (emails.length) {
							_.each(emails, function(e) {
								if (!e.primary) return;
								userData.email = e.email;
								return done();
							});
						} else {
							return done();
						}
						
					}
					
				});
			
			}
		
		], function(err) {
		
			console.log('[services.github] - GitHub user update data:', userData);
			
			data.forumUser.set(userData);
			
			data.forumUser.save(function(err) {
				
				if (err) {
					console.log(err);
					console.log("[services.github] - Error saving GitHub user.");
					console.log('------------------------------------------------------------');
					return callback(err);
					
				} else {
					
					console.log("[services.github] - Saved GitHub user.");
					console.log('------------------------------------------------------------');
					
					if ( req.user ) {
						return callback();
					} else {
						return signinForumUser();
					}
					
				}
				
			});
		
		});
		
	}
	
	// Function to sign in GitHub user
	var signinForumUser = function() {
	
		console.log('[services.github] - Signing in GitHub user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.github] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.github] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin(String(data.forumUser._id), req, res, onSuccess, onFail);
	
	}
	
	// Perform workflow
	switch( workflow ) {
	
		// Save GitHub user data once returning from GitHub
		case 'save':
		
			console.log('[services.github] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('github', {
				//
			}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.github] - Error retrieving GitHub account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.github] - Successfully retrieved GitHub account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processGithubUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with GitHub
		default:
		
			console.log('[services.github] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('github', {
				scope: ['user:email']
			})(req, res, next);
	
	}
	
};
