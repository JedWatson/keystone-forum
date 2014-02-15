// Load .env for development environments
try { require('dotenv')().load(); }
catch(e) { if (e.code == 'MODULE_NOT_FOUND') {
	console.log("\nCould not find the 'dotenv' module. Have you run npm install?\n");
	process.exit();
} else {
	throw e;
}}

// Initialise New Relic if an app name and license key exists
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
	require('newrelic');
}

/**
 * Application Initialisation
 */

var keystone = require('keystone'),
	pkg = require('./package.json');

keystone.init({

	'name': 'KeystoneJS Forum',
	'brand': 'KeystoneJS Forum',
	'back': '/me',

	'favicon': 'public/favicon.ico',
	'less': 'public',
	'static': 'public',

	'views': 'templates/views',
	'view engine': 'jade',
	
	'emails': 'templates/emails',

	'auto update': true,
	'mongo': process.env.MONGO_URI || 'mongodb://localhost/' + pkg.name,

	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': process.env.COOKIE_SECRET || 'sydjs',
	
	// the default mandrill api key is a *test* key. it will 'work', but not send emails.
	'mandrill api key': process.env.MANDRILL_KEY || 'v17RkIoARDkqTqPSbvrmkw',

	'google api key': process.env.GOOGLE_BROWSER_KEY,
	'google server api key': process.env.GOOGLE_SERVER_KEY,

	'ga property': process.env.GA_PROPERTY,
	'ga domain': process.env.GA_DOMAIN,
	
	'chartbeat property': process.env.CHARTBEAT_PROPERTY,
	'chartbeat domain': process.env.CHARTBEAT_DOMAIN
	
});

keystone.import('models');

keystone.set('routes', require('./routes'));

keystone.set('locals', {
	_: require('underscore'),
	globals: require('./lib/globals'),
	js: 'javascript:;',
	env: keystone.get('env'),
	utils: keystone.utils,
	plural: keystone.utils.plural,
	google_api_key: keystone.get('google api key'),
	ga_property: keystone.get('ga property'),
	ga_domain: keystone.get('ga domain'),
	chartbeat_property: keystone.get('chartbeat property'),
	chartbeat_domain: keystone.get('chartbeat domain')
});

keystone.set('email locals', {
	keystoneURL: 'http://www.sydjs.com/keystone',
	logo: '/images/logo_email.jpg',
	logo_width: 120,
	logo_height: 112,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de'
	}
});

keystone.set('email tests', {
	'forgotten-password': {
		name: 'User',
		link: 'http://www.sydjs.com/reset-password/key'
	}
});

keystone.set('nav', {
	'users': ['users'],
	'topics': ['forum-topics', 'forum-categories', 'forum-replies']
});

keystone.start();
