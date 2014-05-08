var keystone = require('keystone'),
	_ = require('underscore'),
	Topic = keystone.list('Topic');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'new-topic';
	locals.title = 'New Topic';
	
	locals.form = {
		name: '',
		tags: '',
		content: ''
	}
	
	
	
	
	// CREATE Topic
	// ------------------------------
	// 
	view.on('post', { action: 'topic.create' }, function(next) {
		
		var newTopic = new Topic.model({
			author: req.user,
			watchedBy: req.user,
			state: 'published'
		});
		
		var updater = newTopic.getUpdateHandler(req);
		
		updater.process(req.body, {
			fields: 'name, tags, content',
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
	
	view.render('site/new-topic');
	
}
