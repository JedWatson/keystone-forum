var keystone = require('keystone'),
	async = require('async'),
	Types = keystone.Field.Types;


// ==============================
// Forum Categories
// ==============================

var ForumCategory = new keystone.List('ForumCategory', {
	sortable: true,
	autokey: { from: 'name', path: 'key', unique: true },
	label: 'Categories',
	singular: 'Category'
});

ForumCategory.add({
	name: { type: String, required: true, initial: true, index: true }
});




// Meta
// ------------------------------

ForumCategory.add('Meta', {
	topicCount: { type: Number, default: 0, collapse: true, noedit: true },
	replyCount: { type: Number, default: 0, collapse: true, noedit: true },
	lastActiveDate: { type: Date, collapse: true, noedit: true }
});




// Relationships
// ------------------------------

ForumCategory.relationship({ path: 'topic', ref: 'ForumTopic', refPath: 'category' });




// Methods
// ------------------------------

ForumCategory.schema.methods.wasActive = function() {
	this.lastActiveDate = new Date();
	return this;
}

ForumCategory.schema.pre('save', function(next) {
	
	var category = this;
	
	this.wasNew = this.isNew;
	
	async.parallel([
		
		// cache the count of topics to this category
		function(done) {
			keystone.list('ForumTopic').model.count().where('category', category.id).where('state', 'published').exec(function(err, count) {
				category.topicCount = count || 0;
				done(err);
			});
		},
		
		// cache the count of replies to this category
		function(done) {
			keystone.list('ForumReply').model.count().where('category', category.id).where('state', 'published').exec(function(err, count) {
				category.replyCount = count || 0;
				done(err);
			});
		}
		
	], next);
	
});

ForumCategory.addPattern('standard meta');
ForumCategory.defaultColumns = 'name, topicCount, lastActiveDate';
ForumCategory.register();
