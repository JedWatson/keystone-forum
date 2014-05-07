var keystone = require('keystone'),
	Topic = keystone.list('Topic'),
	Reply = keystone.list('Reply');

/**
	Route handler for testing emails
*/

exports = module.exports = function(req, res) {
	
	var data = {};

	// save callback

	var renderCallback = function(err, email) {
		if (err) {
			res.status(500).render('500', {
				req: req,
				env: process.env.NODE_ENV,
				errorTitle: 'Error rendering email template ' + req.params.key,
				errorMessage: err
			});
		} else {
			res.send(email.html);
		}
	};
	
	
	// LOAD a random Topic

	var loadTopic = function(callback) {
		Topic.model.findOne()
			.where('author').ne(null)
			.where('state', 'published')
			.sort('-createdAt')
			.exec(function(err, topic) {
				
				data.topic = topic;
				callback();
				
			});
	}
	
	
	// LOAD a random Reply

	var loadReply = function(callback) {
		Reply.model.findOne()
			.where('author').ne(null)
			.where('state', 'published')
			.sort('-createdAt')
			.exec(function(err, reply) {
				
				data.reply = reply;
				callback();
				
			});
	}
	
	
	switch (req.params.key) {

		case 'forgotten-password':
			
			var email = new keystone.Email('forgotten-password');
			
			email.render({
				subject: 'Forgotten Password',
			}, renderCallback);
			
		break;

		case 'notification-new-reply':
			
			var email = new keystone.Email('notification-new-reply');
			
			loadReply(function() {
				email.render({
					subject: 'KeystoneJS reply',
					reply: data.reply,
				}, renderCallback);
			});
			
		break;

		default:
			res.status(404).render('404', { req: req, env: process.env.NODE_ENV });
	}
	
}
