var _ = require('underscore');

/** Forums */

exports.forum = {

	filters: [
		{ label: 'Newest',        value: 'newest',      icon: 'entypo-clock' },
		{ label: 'Active',        value: 'active',      icon: 'entypo-star' },
		{ label: 'Unanswered',    value: 'unanswered',  icon: 'entypo-help' },
		{ label: 'Featured',      value: 'featured',    icon: 'entypo-trophy' }
	]
	
};


exports.forum.routePatterns = {
	filters: ':filter(' + _.pluck(exports.forum.filters, 'value').join('|') + ')'
};