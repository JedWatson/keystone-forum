var keystone = require('keystone'),
	_ = require('underscore'),
	globals = require('../../lib/globals'),
	ForumTopic = keystone.list('ForumTopic');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'forum';
	locals.current.filter = _.where(globals.forum.topic.filters, { value: req.params.filter })[0] || _.where(globals.forum.topic.filters, { value: 'newest' })[0];
	locals.current.category = _.where(req.categories, { key: req.params.category })[0];
	
	
	// QUERY Topics

	var query = ForumTopic.paginate({
		page: req.query.page || 1
	});
	
	query.where('state', 'published')
		.where('author').ne(null)
		.populate('author category')
		
	
	// FILTER topics
	if (locals.current.filter.value == 'newest') {
		query.sort('-publishedOn')
	} else if (locals.current.filter.value == 'popular') {
		query.sort('-replyCount')
	} else if (locals.current.filter.value == 'unanswered') {
		query.where('replyCount', 0)
	} else if (locals.current.filter.value == 'featured') {
		query.where('author.isAdmin', true)
		// TODO how can you do nested queries?
	}
		
	
	// CATEGORISED topics
	
	if (locals.current.category) {
		query.where('category', locals.current.category)
	}
	
	


	// RENDER topics

	view.on('init', function(next) {
		query.exec(function(err, topics) {
			if (err) {
				res.err(err, 'Error loading topics', 'Sorry, there was an error loading ' + locals.current.filter + ' topics');
			} else {
				locals.topics = topics;
				next();
			}
		});
	});
	
	view.render('site/index');
	
}
