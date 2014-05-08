var keystone = require('keystone'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'profile';
	locals.form = req.body;
	locals.returnto = req.query.returnto;


	// CREATE a User
	
	view.on('post', { action: 'confirm.details' }, function(next) {
		
		var newUser = new User.model({
			state: 'enabled'
		});
		
		var updater = newUser.getUpdateHandler(req);
		
		updater.process(req.body, {
			fields: 'name, email, photo',
			flashErrors: true,
			logErrors: true
		}, function(err) {
			if (err) {
				locals.validationErrors = err.errors;
			} else {
				
				// show the success message then scroll to their reply 
				req.flash('success', 'Thank you for your reply.');
				locals.performFunction = 'scrollToLastComment';
				
			}
		});
		
	});

	
	// TODO: Create the user only after they confirm details

	view.render('auth/confirm');
	
}
