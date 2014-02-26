var _ = require('underscore'),
	keystone = require('keystone'),
	Types = keystone.Field.Types;




/// ==============================
// Forum Replies
// ==============================

var ForumReply = new keystone.List('ForumReply', {
	label: 'Replies',
	singular: 'Reply'
});

ForumReply.add({
	author: { type: Types.Relationship, initial: true, ref: 'User', index: true },
	topic: { type: Types.Relationship, initial: true, ref: 'ForumTopic', index: true },
	state: { type: Types.Select, options: 'published, archived', default: 'published', index: true },
	createdAt: { type: Types.Date, default: Date.now, noedit: true, index: true },
	publishedAt: { type: Types.Date, collapse: true, noedit: true, index: true }
});

ForumReply.add('Content', {
	content: { type: Types.Markdown, height: 300, required: true }
});



// Pre-Save
// ------------------------------

ForumReply.schema.pre('save', function(next) {
	
	this.wasNew = this.isNew;
	
	this.wasModified = {
		topic: this.isModified('topic'),
		author: this.isModified('author'),
		category: this.isModified('category')
	};
	
	if (!this.isModified('publishedAt') && this.isModified('state') && this.state == 'published') {
		this.publishedAt = new Date();
	}
	
	next();
	
});



// Post-Save
// ------------------------------

ForumReply.schema.post('save', function() {
	
	if (this.wasModified.topic && this.topic) {
		keystone.list('ForumTopic').model.findById(this.topic).exec(function(err, topic) {
			return topic && topic.save();
		});
	}
	
	if (this.wasModified.author && this.author) {
		keystone.list('User').model.findById(this.author).exec(function(err, user) {
			return user && user.wasActive().save();
		});
	}
	
	if (this.wasModified.category && this.category) {
		keystone.list('ForumCategory').model.findById(this.category).exec(function(err, category) {
			return category && category.wasActive().save();
		});
	}
	
});




// Methods
// ------------------------------

ForumReply.schema.methods.notifyTopicWatchers = function(callback) {
	
	var topicReply = this;
	
	async.parallel({
		watchers: keystone.list('User').model.find.where('_id').in(this.watchedBy).exec,
		topic: keystone.list('Topic').model.findById(this.topic).exec
	}, function(err, results) {
		
		if (err) return callback(err);
		
		new keystone.Email('notification-new-reply').send({
			to: results.watchers,
			from: {
				name: 'KeystoneJS Forum',
				email: 'forums@keystonejs.com'
			},
			subject: '(KeystoneJS reply) ' + results.topic.name,
			topic: results.topic,
			topicReply: topicReply
		}, callback);
		
	});
	
}




// Registration
// ------------------------------

ForumReply.addPattern('standard meta');
ForumReply.defaultColumns = 'topic, author|17%, publishedAt|17%';
ForumReply.register();


