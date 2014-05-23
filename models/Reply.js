var _ = require('underscore'),
	keystone = require('keystone'),
	Types = keystone.Field.Types;




/// ==============================
// Forum Replies
// ==============================

var Reply = new keystone.List('Reply', {
	label: 'Replies',
	singular: 'Reply'
});

Reply.add({
	author: { type: Types.Relationship, initial: true, ref: 'User', index: true },
	topic: { type: Types.Relationship, initial: true, ref: 'Topic', index: true },
	state: { type: Types.Select, options: 'published, archived, spam', default: 'published', index: true },
	createdAt: { type: Types.Date, default: Date.now, noedit: true, index: true }
});

Reply.add('Content', {
	content: { type: Types.Markdown, height: 300, required: true, initial: true }
});



// Pre-Save
// ------------------------------

Reply.schema.pre('save', function(next) {
	
	this.wasNew = this.isNew;
	
	this.wasModified = {
		topic: this.isModified('topic'),
		author: this.isModified('author'),
		tag: this.isModified('tag')
	};
	
	next();
	
});



// Post-Save
// ------------------------------

Reply.schema.post('save', function() {
	
	if (this.wasModified.topic && this.topic) {
		keystone.list('Topic').model.findById(this.topic).exec(function(err, topic) {
			return topic && topic.save();
		});
	}
	
	if (this.wasModified.author && this.author) {
		keystone.list('User').model.findById(this.author).exec(function(err, user) {
			return user && user.wasActive().save();
		});
	}
	
	if (this.wasModified.tag && this.tag) {
		keystone.list('Tag').model.findById(this.tag).exec(function(err, tag) {
			return tag && tag.save();
		});
	}
	
});




// Methods
// ------------------------------

Reply.schema.methods.notifyTopicWatchers = function(req, res, next) {
	
	var reply = this;
	var data = {};
	
	
	// TODO find a better way to populate/get the reply author
	
	keystone.list('Reply').model.findById(reply.id).populate('author', 'name').exec(function(err, result) {
		if (err || !result) return next(err);
		data.author = result.author;
	});
	
	keystone.list('Topic').model.findById(reply.topic).populate('watchedBy').exec(function(err, topic) {
		
		if (err || !topic.watchedBy.length) return next(err);
		
		topic.watchedBy.forEach(function(watcher) {
			new keystone.Email('new-reply').send({
				subject: 'Re: ' + topic.name,
				topic: topic,
				reply: reply,
				baseURL: req.protocol + '://' + req.get('host'),
				to: watcher.email,
				from: {
					name: data.author.name.full,
					email: 'forum@keystonejs.com'
				}
			}, next);
		});
	});
	
}




// Registration
// ------------------------------

Reply.addPattern('standard meta');
Reply.defaultColumns = 'topic, author|17%, createdAt|17%';
Reply.register();


