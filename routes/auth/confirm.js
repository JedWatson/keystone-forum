var keystone = require('keystone'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'profile';
	locals.form = req.body;


	// UPDATE the User
	
	view.on('post', { action: 'confirm.details' }, function(next) {
		
		var updater = req.user.getUpdateHandler(req);
		
		updater.process(req.body, {
			fields: 'name, email, website',
			flashErrors: true,
			logErrors: true
		}, function(err) {
			if (err) {
				locals.validationErrors = err.errors;
				next();
			} else {
				if (req.query && req.query.returnto) {
					return res.redirect(req.query.returnto + '?performFunction=focusOnCommentField');
				} else {
					return res.redirect('/settings');
				}
				
			}
		});
		
	});

	
	// TODO: Create the user only after they confirm details

	view.render('auth/confirm');
	
}
