var keystone = require('keystone');

module.exports = function(req, res) {
	
	res.send("HI");
	
	// send email
	new keystone.Email('notification-new-reply').send({
		// reply: newReply,
		link: 'http://forum.keystonejs.com' + locals.topic.url,
		subject: '[KeystoneJS]' + locals.topic.name
	}, {
		to: 'joss.mackison@gmail.com',
		from: {
			name: 'KeystoneJS Forum',
			email: 'forum@keystonejs.com'
		}
	});
	
}
	