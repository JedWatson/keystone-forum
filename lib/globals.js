var _ = require('underscore');

/** Forums */

exports.forum = {

	filters: [
		{ label: 'Newest',        value: 'newest' },
		{ label: 'Active',        value: 'active' },
		{ label: 'Unanswered',    value: 'unanswered' },
		{ label: 'Featured',      value: 'featured' }
	]
	
};


exports.forum.routePatterns = {
	filters: ':filter(' + _.pluck(exports.forum.filters, 'value').join('|') + ')'
};