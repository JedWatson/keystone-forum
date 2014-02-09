var keystone = require('keystone'),
	async = require('async'),
	ForumCategory = keystone.list('ForumCategory');

var categories = ['Express', 'Mongoose', 'Node.js', 'Announcement', 'Demo', 'Forum'];

function createCategory(category, done) {
	ForumCategory.model.findOne({ name: category }, function(err, cat) {
		if (!cat) {
			new ForumCategory.model({ name: category })
				.save(function(err) {
					if (err) {
						console.error("Error adding category " + category + " to the database:");
						console.error(err);
					} else {
						console.log("Added category " + category + " to the database.");
					}
					done();
				});
			}
	});
}

exports = module.exports = function(done) {
	async.forEach(categories, createCategory, done);
};

// safe to run
exports.__defer__ = true;