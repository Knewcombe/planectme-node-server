// server.js

    // set up ========================
		var https = require('https');
		var fs = require('fs');
		var express  = require('./node_modules/express');
    var app      = express();                               // create our app w/ express
    var morgan = require('./node_modules/morgan');             // log requests to the console (express4)
    var bodyParser = require('./node_modules/body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('./node_modules/method-override'); // simulate DELETE and PUT (express4)
    // configuration =================
		var config = require('./config/config.js'); // get our config file
		var jwt = require('./node_modules/jsonwebtoken'); // used to create, sign, and verify tokens

		var key = fs.readFileSync('./cert/private.key.pem');
		var cert = fs.readFileSync('./cert/planectme.pem');
		// var ca = fs.readFileSync(path.resolve(__dirname, '../cert/cai.pem'));

		var port = process.env.PORT || 443; // used to create, sign, and verify tokens
		app.set('superSecret', config.secret);

    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

		app.use(function(req, res, next){

			//planectme-33bda.firebaseapp.com - https://www.plannect.me
			// Website you wish to allow to connect
	    res.header('Access-Control-Allow-Origin', '*');
			//https://planectme-33bda.firebaseapp.com/*

	    // Request methods you wish to allow
	    res.header('Access-Control-Allow-Methods', 'GET, POST');

	    // Request headers you wish to allow
	    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	    // Set to true if you need the website to include cookies in the requests sent
	    // to the API (e.g. in case you use sessions)
	    res.header('Access-Control-Allow-Credentials', true);

	    // Pass to next layer of middleware
			next();
		});

		// =======================
		// routes ================
		// =======================
		// basic route
		var user_route = require('./routes/user_route.js'); //User routes
		var extra_route = require('./routes/extra_route.js'); //extra routes
		var auth_route = require('./routes/auth_route.js'); //extra routes
		var profile_route = require('./routes/profile_route.js');
		var validate_route = require('./routes/validate_route.js');

		app.use('/api', validate_route);
		app.use('/api/users', user_route);
		app.use('/auth', auth_route);
		app.use('/extra', extra_route);
		app.use('/api/profiles', profile_route);

		// listen (start app with node server) ======================================
		https.createServer({
			key: key,
			cert: cert
		}, app).listen(port);
		// app.listen(port);
		console.log("App listening on port" + port);
