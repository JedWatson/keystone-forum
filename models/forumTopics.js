var keystone = require('keystone'),
	_ = require('underscore'),
	async = require('async'),
	utils = keystone.utils,
	Types = keystone.Field.Types;


// ==============================
// Forum Topics
// ==============================

var ForumTopic = new keystone.List('ForumTopic', {
	autokey: { from: 'name', path: 'key', unique: true },
	label: 'Topics',
	singular: 'Topic'
});

ForumTopic.add({
	name: { type: String, label: 'Title', required: true },
	author: { type: Types.Relationship, initial: true, ref: 'User', index: true },
	likedBy: { type: Types.Relationship, ref: 'User', index: true },
	state: { type: Types.Select, options: 'published, archived', default: 'published', index: true },
	publishedOn: { type: Types.Date, default: Date.now, noedit: true, index: true },
	category: { type: Types.Relationship, ref: 'ForumCategory', initial: true, required: true, index: true }
});

/** Content */

ForumTopic.add('Content', {
	image: { type: Types.CloudinaryImage, collapse: true },
	content: {
		summary: { type: Types.Textarea, hidden: true },
		full: { type: Types.Markdown, height: 400 }
	}
});

/** Meta */

ForumTopic.add('Meta', {
	replyCount: { type: Number, default: 0, collapse: true, noedit: true },
	lastReplyDate: { type: Date, collapse: true, noedit: true },
	lastReplyAuthor: { type: Types.Relationship, ref: 'User', collapse: true, noedit: true }
});




// Virtuals
// ------------------------------

ForumTopic.schema.virtual('url').get(function() {
	return '/topic/' + this.key;
});




// Relationships
// ------------------------------

ForumTopic.relationship({ path: 'replies', ref: 'ForumReply', refPath: 'topic' });




// Methods
// ------------------------------

ForumTopic.schema.pre('save', function(next) {
	
	var topic = this;
	
	this.wasNew = this.isNew;
	
	if (this.isModified('content.full')) {
		this.content.summary = utils.cropHTMLString(this.content.full, 160, '...', true);
	}
	
	if (!this.isModified('publishedOn') && this.isModified('state') && this.state == 'published') {
		this.publishedOn = new Date();
	}
	
	async.parallel([
		
		// cache the last reply date and author
		function(done) {
			keystone.list('ForumReply').model.findOne().where('topic', topic.id).where('state', 'published').sort('-createdOn').exec(function(err, reply) {
				if (reply) {
					topic.lastReplyDate = reply.createdOn;
					topic.lastReplyAuthor = reply.author;
				}
				done(err);
			});
		},
		
		// cache the count of replies to this topic
		function(done) {
			keystone.list('ForumReply').model.count().where('topic', topic.id).where('state', 'published').exec(function(err, count) {
				topic.replyCount = count || 0;
				done(err);
			});
		}
		
	], next);
	
});


ForumTopic.schema.post('save', function() {
	
	if (!this.wasNew) {
		return;
	}
	
	if (this.author) {
		keystone.list('User').model.findById(this.author).exec(function(err, user) {
			return user && user.wasActive().save();
		});
	}
	
	if (this.category) {
		keystone.list('ForumCategory').model.findById(this.category).exec(function(err, category) {
			return category && category.wasActive().save();
		});
	}
	
});




// Registration
// ------------------------------

ForumTopic.addPattern('standard meta');
ForumTopic.defaultColumns = 'name';
ForumTopic.register();


