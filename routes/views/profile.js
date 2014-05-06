var keystone = require('keystone'),
	User = keystone.list('User'),
	Topic = keystone.list('Topic'),
	Reply = keystone.list('Reply');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'profile';
	
	
	// LOAD User
	// ------------------------------
	
	view.on('init', function(next) {
		
		User.model.findOne()
			.where({ key: req.params.profile })
			.exec(function(err, profile) {
				if (err) return res.err(err);
				if (!profile) return res.notfound('Profile not found');
				locals.profile = profile;
				next();
			});
		
	});
	
	
	// LOAD Topics
	// ------------------------------
	
	view.on('init', function(next) {
		
		Topic.model.find()
			.where( 'state', 'published' )
			.where('author', locals.profile.id)
			.populate( 'author', 'name photo' )
			.populate( 'tags' )
			.sort('-createdAt')
			.exec(function(err, topics) {
				if (err) return res.err(err);
				locals.topics = topics;
				next();
			});
		
	});

	
	// LOAD replies
	view.on('init', function(next) {
		
		Reply.model.find()
			.where( 'state', 'published' )
			.where('author', locals.profile.id)
			.populate( 'author', 'name photo' )
			.sort('-createdAt')
			.exec(function(err, replies) {
				if (err) return res.err(err);
				locals.replies = replies;
				next();
			});
		
	});

	
	// Set page info
	// ------------------------------
	
	view.on('render', function(next) {
		locals.page.title = locals.profile.name.full + ' on KeystoneJS Forum';
		next();
	});
	
	
	view.render('site/profile');
	
}
