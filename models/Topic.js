var keystone = require('keystone'),
	_ = require('underscore'),
	async = require('async'),
	utils = keystone.utils,
	Types = keystone.Field.Types;


// ==============================
// Forum Topics
// ==============================

var Topic = new keystone.List('Topic', {
	autokey: { from: 'name', path: 'key', unique: true },
	label: 'Topics',
	singular: 'Topic'
});

Topic.add({
	name: { type: String, label: 'Title', required: true },
	author: { type: Types.Relationship, initial: true, ref: 'User', index: true },
	tags: { type: Types.Relationship, ref: 'Tag', many: true, initial: true, index: true }
});

/** Content */

Topic.add('Content', {
	image: { type: Types.CloudinaryImage, collapse: true },
	content: { type: Types.Markdown, height: 400, required: true }
});

/** State */

Topic.add('State', {
	state: { type: Types.Select, options: 'published, archived, spam', default: 'published', index: true },
	isFeatured: Boolean,
	isReviewed: Boolean,
	needsResolution: Boolean,
	isResolved: Boolean
});

/** Meta */

Topic.add('Meta', {
	watchedBy: { type: Types.Relationship, ref: 'User', many: true, index: true },
	createdAt: { type: Date, default: Date.now, noedit: true, index: true },
	lastActiveAt: { type: Date, default: Date.now, noedit: true, index: true },
	replyCount: { type: Number, default: 0, collapse: true, noedit: true },
	lastReplyAt: { type: Date, collapse: true, noedit: true },
	lastReplyAuthor: { type: Types.Relationship, ref: 'User', collapse: true, noedit: true }
});




// Virtuals
// ------------------------------

Topic.schema.virtual('url').get(function() {
	return '/topic/' + this.key;
});




// Relationships
// ------------------------------

Topic.relationship({ path: 'replies', ref: 'Reply', refPath: 'topic' });




// Pre-Save
// ------------------------------

Topic.schema.pre('save', function(next) {
	
	var topic = this;
	
	this._bubbleUpdate = this.isNew || this.isModified('state');
	
	async.parallel([
		
		// cache the last reply date and author
		function(done) {
			keystone.list('Reply').model.findOne().where('topic', topic.id).where('state', 'published').sort('-createdAt').exec(function(err, reply) {
				if (reply) {
					topic.lastReplyAt = reply.createdAt;
					topic.lastReplyAuthor = reply.author;
				}
				done(err);
			});
		},
		
		// cache the count of replies to this topic
		function(done) {
			keystone.list('Reply').model.count().where('topic', topic.id).where('state', 'published').exec(function(err, count) {
				topic.replyCount = count || 0;
				done(err);
			});
		}
		
	], next);
	
});




// Post-Save
// ------------------------------

Topic.schema.post('save', function() {
	
	if (!this._bubbleUpdate) {
		return;
	}
	
	if (this.author) {
		keystone.list('User').model.findById(this.author).exec(function(err, user) {
			return user && user.wasActive().save();
		});
	}
	if (this.tags) {
		keystone.list('Tag').model.find().where('_id').in(this.tags).exec(function(err, tags) {
			if (err) {
				console.error(err)	
			} else {
				tags.forEach(function(tag) {
					tag.save();
				});
			}
		});
	}
	
});




// Methods
// ------------------------------

Topic.schema.methods.notifyForumSubscribers = function(callback) {
	
	var topic = this;
	
	// keystone.list('User').model.find().select('name email').exec(function(err, results) {
	// 	console.log(results);
	// });
	
	// TODO
	// should use req.get('host')
	
	async.parallel({
		subscribers: keystone.list('User').model.find().where('notifications.topics', true).select('name email').exec
	}, function(err, results) {
		
		// console.log(results.subscribers);
		
		if (err) return callback(err);
		
		new keystone.Email('notification-new-topic').send({
			to: results.subscribers,
			from: {
				name: 'KeystoneJS Forum',
				email: 'forums@keystonejs.com'
			},
			subject: '(KeystoneJS topic) ' + topic.name,
			url: 'http://localhost:3000' + topic.url,
			topic: topic
		}, callback);
		
	});
	
}




// Registration
// ------------------------------

Topic.defaultSort = '-createdAt';
Topic.defaultColumns = 'name, replyCount|10%, tags|20%, createdAt|20%';
Topic.register();


