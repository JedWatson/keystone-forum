var _ = require('underscore'),
	keystone = require('keystone'),
	Types = keystone.Field.Types;

/** 
	Forum Topics
	============
 */

var ForumReply = new keystone.List('ForumReply', {
	label: 'Replies',
	singular: 'Reply'
});

ForumReply.add({
	author: { type: Types.Relationship, initial: true, ref: 'User', index: true },
	topic: { type: Types.Relationship, initial: true, ref: 'ForumTopic', index: true },
	state: { type: Types.Select, options: 'published, archived', default: 'published', index: true },
	publishedOn: { type: Types.Date, default: Date.now, noedit: true, index: true }
});

ForumReply.add('Content', {
	content: { type: Types.Markdown, height: 300, required: true }
});

/** 
	Methods
	=======
*/

ForumReply.schema.pre('save', function(next) {
	
	this.wasNew = this.isNew;
	
	if (!this.isModified('publishedOn') && this.isModified('postState') && this.postState == 'published') {
		this.publishedOn = new Date();
	}
	
	next();
	
});

ForumReply.schema.post('save', function() {
	
	if (!this.wasNew) {
		return;
	}
	
	if (this.topic) {
		keystone.list('ForumTopic').model.findById(this.topic).exec(function(err, topic) {
			return topic && topic.save();
		});
	}
	
	if (this.author) {
		keystone.list('User').model.findById(this.author).exec(function(err, user) {
			return user && user.wasActive().save();
		});
	}
	
});


/** 
	Registration
	============
*/

ForumReply.addPattern('standard meta');
ForumReply.defaultColumns = 'topic, author, publishedOn';
ForumReply.register();


