var keystone = require('keystone'),
	_ = require('underscore'),
	ForumTopic = keystone.list('ForumTopic');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'ask';
	locals.title = 'Create a blog post - SydJS';
		
	locals.form = {
		name: '',
		category: '',
		content: {
			full: ''
		}
	}
	
	
	
	
	// CREATE Topic
	// ------------------------------
	// 
	view.on('post', { action: 'topic.create' }, function(next) {
		
		var newTopic = new ForumTopic.model({
			author: req.user,
			state: 'published'
		});
		
		var updater = newTopic.getUpdateHandler(req);
		
		updater.process(req.body, {
			fields: 'name, category, content.full',
			flashErrors: true,
			logErrors: true
		}, function(err) {
			
			if (err) {
				locals.validationErrors = err.errors;
				
				_.extend(locals.form, req.body);
				
				return next();
			} else {
				newTopic.notifyForumSubscribers();
				return res.redirect('/topic/' + newTopic.key);
			}
		
		});
	
	});
	
	view.render('me/ask');
	
}
