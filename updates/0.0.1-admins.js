var keystone = require('keystone'),
	async = require('async'),
	User = keystone.list('User');

var admins = [
	{ email: 'boris@thinkmill.com.au', password: 'allthetopics', name: { first: 'Boris', last: 'Bozic' } },
	{ email: 'joss@thinkmill.com.au', password: 'allthetopics', name: { first: 'Joss', last: 'Mackison' } },
	{ email: 'jed@thinkmill.com.au', password: 'allthetopics', name: { first: 'Jed', last: 'Watson' } },
	{ email: 'tuan@thinkmill.com.au', password: 'allthetopics', name: { first: 'Tuan', last: 'Hoang' } },
	{ email: 'tom@thinkmill.com.au', password: 'allthetopics', name: { first: 'Tom', last: 'Walker' } }
];

function createAdmin(admin, done) {
	User.model.findOne({ email: admin.email }).exec(function(err, user) {
		admin.isAdmin = true;
		new User.model(admin).save(function(err) {
			if (err) {
				console.error("Error adding admin " + admin.email + " to the database:");
				console.error(err);
			} else {
				console.log("Added admin " + admin.email + " to the database.");
			}
			done();
		});
	});
}

exports = module.exports = function(done) {
	async.forEach(admins, createAdmin, done);
};