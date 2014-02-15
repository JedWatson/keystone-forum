var keystone = require('keystone'),
	ForumTopic = keystone.list('ForumTopic'),
	ForumReply = keystone.list('ForumReply');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	
	
	// LOAD Topic
	// ------------------------------
	
	view.on('init', function(next) {
		
		ForumTopic.model.findOne()
			.where({ key: req.params.topic })
			.where('author').ne(null)
			.populate('author category')
			.exec(function(err, topic) {
				if (err) return res.err(err);
				if (!topic) return res.notfound('Topic not found');
				locals.topic = topic;
				next();
			});
		
	});
	
	
	
	
	// LOAD replies on the Topic
	view.on('init', function(next) {
		
		ForumReply.model.find()
			.where( 'topic', locals.topic.id )
			.where( 'state', 'published' )
			.where( 'author' ).ne( null )
			.populate( 'author', 'name key photo' )
			.sort('-publishedAt')
			.exec(function(err, replies) {
				if (err) return res.err(err);
				if (!replies) return res.notfound('Topic replies not found');
				locals.replies = replies;
				next();
			});
		
	});
	
	
	
	
	// DELETE the Topic
	view.on('get', { remove: true }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to delete a topic.');
			return next();
		}
		
		locals.topic.remove(function(err) {
			if (err) {
				if (err.name == 'CastError') {
					req.flash('error', 'The topic ' + req.params.topic + ' could not be found.');
					return next();
				}
				return res.err(err);
			}
			if (!locals.topic) {
				req.flash('error', 'The topic ' + req.params.topic + ' could not be found.');
				return next();
			}
			if (locals.topic.author != req.user.id && !req.user.isAdmin) {
				req.flash('error', 'You must be the author of a topic to delete it.');
				return next();
			}
			if (err) return res.err(err);
			req.flash('success', 'Your topic has been deleted.');
			return res.redirect(req.user.url);
		});
	});
	
	
	
	
	// CREATE a reply
	// ------------------------------
	
	view.on('post', { action: 'comment.create' }, function(next) {
		
		var newReply = new ForumReply.model({
			state: 'published',
			topic: locals.topic.id,
			author: locals.current.user.id
		});
		
		var updater = newReply.getUpdateHandler(req);
		
		updater.process(req.body, {
			fields: 'content',
			flashErrors: true,
			logErrors: true
		}, function(err) {
			if (err) {
				data.validationErrors = err.errors;
			} else {
				req.flash('success', 'You replied to this topic');
				
				
				// SEND email notification
				if (keystone.get('env') == 'production') {
					new keystone.Email('listing/comment').send({
						subject: locals.current.user.name.first + ' replied to your topic - ' + locals.topic.title,
						
						authorName: locals.current.user.name.full,
						authorPath: locals.current.user.url,
						media: locals.topic.title,
						mediaPath: locals.topic.url,
						commentType: 'Topic',
						commentContent: newReply.content
					},{
						to: locals.topic.author.email,
						from: {
							name: 'KeystoneJS Forum',
							email: 'system@keystonejs.com'
						}
					});
				}
				
				return res.redirect(locals.topic.url + '#comment-id-' + newReply.id);
			}
			next();
		});
		
	});
	
	
	
	
	// DELETE a reply
	view.on('get', { remove: 'comment' }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to delete a reply.');
			return next();
		}
		
		ForumReply.model.findOne({
				_id: req.query.comment,
				topic: locals.topic.id
			})
			.exec(function(err, comment) {
				if (err) {
					if (err.name == 'CastError') {
						req.flash('error', 'The reply ' + req.query.comment + ' could not be found.');
						return next();
					}
					return res.err(err);
				}
				
				if (!comment) {
					req.flash('error', 'The reply ' + req.query.comment + ' could not be found.');
					return next();
				}
				if (comment.author != req.user.id && !req.user.isAdmin) {
					req.flash('error', 'Sorry, you must be the author of a reply to delete it.');
					return next();
				}
				comment.replyState = 'archived';
				comment.save(function(err) {
					if (err) return res.err(err);
					req.flash('success', 'Your reply has been deleted.');
					return res.redirect(locals.topic.url);
				});
			});
	});
	
	
	// LOAD topics from the Topic's Author
	// ------------------------------
	
	view.on('init', function(next) {
		
		ForumTopic.model.find()
			.where('_id').ne(locals.topic.id)
			.where('author', locals.topic.author)
			.sort('-publishedAt')
			.limit(4)
			.populate('author')
			.exec(function(err, authorTopics) {
				if (err) return res.err(err);
				locals.authorTopics = authorTopics;
				next();
			});
		
	});

	
	// Set page info
	// ------------------------------
	
	view.on('render', function(next) {
		locals.page.name = locals.topic.title;
		locals.page.title = locals.page.name + ' on KeystoneJS Forum';
		next();
	});
	
	
	view.render('site/topic');
	
}
