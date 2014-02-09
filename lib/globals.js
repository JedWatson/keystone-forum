var _ = require('underscore');

/** Forums */

exports.forum = {
	
	topic: {
		states: 'published, archived, deactivated',
	
		filters: [
			{ label: 'Newest',        value: 'newest' },
			{ label: 'Popular',        value: 'popular' },
			{ label: 'Unanswered',    value: 'unanswered'  }
		]
	},
	
	reply: {
		states: 'published, archived, deactivated'
	}
	
};


exports.forum.routePatterns = {
	filters: ':filter(' + _.pluck(exports.forum.topic.filters, 'value').join('|') + ')'
};