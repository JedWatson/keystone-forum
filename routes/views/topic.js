var keystone = require('keystone'),
	_ = require('underscore'),
	User = keystone.list('User'),
	ForumTopic = keystone.list('ForumTopic'),
	ForumReply = keystone.list('ForumReply');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	locals.newComment = false;
	
	
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
	// view.on('init', function(next) {
		
	// 	ForumReply.model.find()
	// 		.where( 'topic', locals.topic.id )
	// 		.where( 'state', 'published' )
	// 		.where( 'author' ).ne( null )
	// 		.populate( 'author', 'name key photo' )
	// 		.sort('publishedAt')
	// 		.exec(function(err, replies) {
	// 			if (err) return res.err(err);
	// 			if (!replies) return res.notfound('Topic replies not found');
	// 			locals.replies = replies;
	// 			next();
	// 		});
		
	// });
	
	
	
	
	// WATCH a topic
	view.on('get', { watch: true }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to watch a topic.');
			return next();
		}
		
		locals.topic.watchedBy.push(req.user.id);
		
		locals.topic.save(function(err) {
			if (err) return res.err(err);
			// req.flash('success', 'You will receive email notifications about this topic.');
			// return res.redirect(locals.topic.url);
			next();
		});
	});
	
	
	
	
	// UNWATCH a topic
	view.on('get', { unwatch: true }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to unwatch a topic.');
			return next();
		}
		
		for (var i = 0; i < locals.topic.watchedBy.length; i++) {
			if (locals.topic.watchedBy[i] == req.user.id) {
				locals.topic.watchedBy.splice(i, 1);
				break;
			}
		}
		
		locals.topic.save(function(err) {
			if (err) return res.err(err);
			// req.flash('success', 'You will NOT receive anymore email notifications about this topic.');
			// return res.redirect(locals.topic.url);
			next();
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
				locals.validationErrors = err.errors;
			} else {
				
				// may be unecessary, but whatever
				req.flash('success', 'Thank you for your reply.');
				
				// used to scroll down to the comments
				// return res.redirect(locals.topic.url + '#comment-id-' + newReply.id);
				locals.newComment = newReply.id;
				
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
				comment.state = 'archived';
				comment.save(function(err) {
					if (err) return res.err(err);
					req.flash('success', 'Your reply has been removed.');
					// return res.redirect(locals.topic.url);
					next();
				});
			});
	});
	
	
	
	
	// DELETE the Topic
	view.on('get', { remove: 'topic' }, function(next) {
		
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
		
		locals.topic.populate('watchedBy');
		
		for (var i = 0; i < locals.topic.watchedBy.length; i++) {
			if (req.user && req.user.id == locals.topic.watchedBy[i]) {
				locals.watchedByUser = true;
				break;
			}
		}
		
		
		// load replies last so they're aware of create/delete

		ForumReply.model.find()
			.where( 'topic', locals.topic.id )
			.where( 'state', 'published' )
			.where( 'author' ).ne( null )
			.populate( 'author', 'name key photo' )
			.sort('publishedAt')
			.exec(function(err, replies) {
				if (err) return res.err(err);
				if (!replies) return res.notfound('Topic replies not found');
				locals.replies = replies;
				next();
			});
		
	});
	
	
	view.render('site/topic');
	
}
