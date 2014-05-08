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
	state: { type: Types.Select, options: 'published, archived', default: 'published', index: true },
	createdAt: { type: Types.Date, default: Date.now, noedit: true, index: true }
});

Reply.add('Content', {
	content: { type: Types.Markdown, height: 300, required: true }
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

Reply.schema.methods.notifyTopicWatchers = function(callback) {
	
	var topicReply = this;
	
	async.parallel({
		watchers: keystone.list('User').model.find.where('_id').in(this.watchedBy).exec,
		topic: keystone.list('Topic').model.findById(this.topic).exec
	}, function(err, results) {
		
		if (err) return callback(err);
		
		new keystone.Email('new-reply').send({
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

Reply.addPattern('standard meta');
Reply.defaultColumns = 'topic, author|17%, createdAt|17%';
Reply.register();


