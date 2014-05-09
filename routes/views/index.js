var keystone = require('keystone'),
	_ = require('underscore'),
	async = require('async'),
	globals = require('../../lib/globals'),
	Topic = keystone.list('Topic');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	locals.current.filter = _.where(globals.forum.filters, { value: req.params.filter })[0] || _.where(globals.forum.filters, { value: 'newest' })[0];
	locals.current.tag = _.where(req.tags, { key: req.params.tag })[0];
	
	
	// QUERY topics

	var topicsQuery = Topic.paginate({
			page: req.query.page || 1,
			perPage: 20,
			maxPages: 10
		})
		.where('state', 'published')
		.where('author').ne(null)
		.populate('author tags');
		
		
	
	// FILTER topics
	
	if (locals.current.filter.value == 'newest') {
		topicsQuery.sort('-createdAt')
	} else if (locals.current.filter.value == 'active') {
		topicsQuery.sort('-replyCount')
	} else if (locals.current.filter.value == 'unanswered') {
		topicsQuery.where('replyCount', 0)
	} else if (locals.current.filter.value == 'featured') {
		topicsQuery.where('isFeatured', true)
		topicsQuery.sort('-createdAt')
	}
		
	
	// CATEGORISE topics
	
	if (locals.current.tag) {
		topicsQuery.where('tags').in([locals.current.tag]);
	}


	// RUN topics query on render

	view.on('render', function(next) {
		
		topicsQuery.exec(function(err, topics) {
			if (err) {
				res.err(err, 'Error loading topics', 'Sorry, there was an error loading ' + locals.current.filter.label + ' topics');
			} else {
				locals.topics = topics;
				next();
			}
		});

		locals.title = (locals.current.filter.label + ' Topics') + (locals.current.tag ? (' about ' + locals.current.tag.name) : '');
		
	});
	
	view.render('site/index');
	
}
