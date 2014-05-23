var keystone = require('keystone'),
	_ = require('underscore'),
	User = keystone.list('User'),
	Topic = keystone.list('Topic'),
	Reply = keystone.list('Reply');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	locals.performFunction = req.query.performFunction || false;
	
	
	// LOAD the Topic
	
	view.on('init', function(next) {
		
		Topic.model.findOne()
			.where({ key: req.params.topic })
			.where('author').ne(null)
			.populate('author tags')
			.exec(function(err, topic) {
				if (err) return res.err(err);
				if (!topic) return res.notfound('Topic not found', 'That topic has been moved or deleted.');
				locals.topic = topic;
				next();
			});
		
	});
	
	
	
	
	// WATCH the Topic
	
	view.on('get', { watch: true }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to watch a topic.');
			return next();
		}
		
		locals.topic.watchedBy.push(req.user.id);
		
		locals.topic.save(function(err) {
			if (err) { console.error("===== Watch Topic failed to save ====="); console.error(err); }
			return res.redirect(locals.topic.url); // tidy up the url
		});
	});
	
	
	
	
	// UNWATCH the Topic
	
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
			if (err) { console.error("===== Unwatch Topic failed to save ====="); console.error(err); }
			return res.redirect(locals.topic.url); // tidy up the url
		});
	});
	
	
	
	
	// CREATE a Reply
	
	view.on('post', { action: 'comment.create' }, function(next) {
		
		var newReply = new Reply.model({
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

				// email topic watchers
				newReply.notifyTopicWatchers(function(err) {
					if (err) {
						console.error("===== Create Reply failed to send emails =====");
						console.error(err);
					}
				});

				// subscribe the reply author to the topic
				if (req.body.watch) {
					locals.topic.watchedBy.push(req.user.id);
					locals.topic.save(function(err) {
						console.error("===== Subscribe reply author to Topic failed =====");
						console.error(err);
					});
				}
				
				// show the success message then scroll to their reply 
				req.flash('success', 'Thank you for your reply.' + (req.body.watch ? ' You are now watching this topic.' : ''));
				locals.performFunction = 'scrollToLastComment';
				
				next();
			}
		});
		
	});
	
	
	
	
	// DELETE (archive) a Reply
	
	view.on('get', { remove: 'comment' }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to delete a reply.');
			return next();
		}
		
		Reply.model.findOne({
				_id: req.query.comment,
				state: 'published',
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
					
					// tidy up the url
					return res.redirect(locals.topic.url);
				});
			});
	});
	
	
	
	
	// DELETE (archive) the Topic
	
	view.on('get', { remove: 'topic' }, function(next) {
		
		if (!req.user) {
			req.flash('error', 'You must be signed in to delete a topic.');
			return next();
		}
		
		locals.topic.state = 'archived';
		
		locals.topic.save(function(err) {
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
			if (locals.topic.author.id != req.user.id && !req.user.isAdmin) {
				req.flash('error', 'You must be the author of a topic to delete it.');
				return next();
			}
			if (err) return res.err(err);
			req.flash('success', 'Your topic has been deleted.');
			return res.redirect(req.user.url);
		});
	});

	
	// SET page info
	
	view.on('render', function(next) {
		
		locals.title = locals.topic.name;
		locals.metadescription = keystone.utils.cropString(keystone.utils.htmlToText(locals.topic.content.html), 200, '...', true);
		
		locals.topic.populate('watchedBy');
		
		for (var i = 0; i < locals.topic.watchedBy.length; i++) {
			if (req.user && req.user.id == locals.topic.watchedBy[i]) {
				locals.watchedByUser = true;
				break;
			}
		}
		
		
		// load replies last so they're aware of create/delete

		Reply.model.find()
			.where( 'topic', locals.topic.id )
			.where( 'author' ).ne( null )
			.or([{ state: 'published' }, { state: 'archived' }])
			.populate( 'author', 'name key photo' )
			.sort('createdAt')
			.exec(function(err, replies) {
				if (err) return res.err(err);
				if (!replies) return res.notfound('Topic replies not found');
				locals.replies = replies;
				next();
			});
		
	});
	
	
	view.render('site/topic');
	
}
