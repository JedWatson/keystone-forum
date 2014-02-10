var _ = require('underscore');

/** Forums */

exports.forum = {
	
	topic: {
		states: 'published, archived, deactivated',
	
		filters: [
			{ label: 'Newest',        value: 'newest' },
			{ label: 'Active',        value: 'active' },
			{ label: 'Unanswered',    value: 'unanswered' },
			{ label: 'Featured',    value: 'featured' }
		]
	},
	
	reply: {
		states: 'published, archived, deactivated'
	}
	
};


exports.forum.routePatterns = {
	filters: ':filter(' + _.pluck(exports.forum.topic.filters, 'value').join('|') + ')'
};