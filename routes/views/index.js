var keystone = require('keystone'),
	_ = require('underscore'),
	async = require('async'),
	globals = require('../../lib/globals'),
	Topic = keystone.list('Topic');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	locals.current.filter = _.where(globals.forum.topic.filters, { value: req.params.filter })[0] || _.where(globals.forum.topic.filters, { value: 'newest' })[0];
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
		
	var topicsCount = Topic.model.count()
		.where('state', 'published')
		.where('author').ne(null);
		
	
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
		
	
	// CATEGORISED topics
	
	if (locals.current.tag) {
		topicsQuery.where('tags').in([locals.current.tag]);
	}


	// COUNT and QUERY topics on render

	view.on('render', function(next) {
		async.parallel({
			topics: function(done) {
				topicsQuery.exec(done);
			},
			count: function(done) {
				topicsCount.exec(done);
			}
		}, function(err, results) {
			if (err) {
				res.err(err, 'Error loading topics', 'Sorry, there was an error loading ' + locals.current.filter.label + ' topics');
			} else {
				locals.topics = results.topics;
				locals.topicCount = results.count;
				next();
			}
		});
		
	});
	
	view.render('site/index');
	
}
