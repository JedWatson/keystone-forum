var keystone = require('keystone'),
	Types = keystone.Field.Types;

/** 
	Forum Categories
	===============
 */

var ForumCategory = new keystone.List('ForumCategory', {
	sortable: true,
	autokey: { from: 'name', path: 'key', unique: true },
	label: 'Categories',
	singular: 'Category'
});

ForumCategory.add({
	name: { type: String, required: true, initial: true, index: true }
});

ForumCategory.relationship({ path: 'topic', ref: 'ForumTopic', refPath: 'category' });

ForumCategory.addPattern('standard meta');
ForumCategory.register();
