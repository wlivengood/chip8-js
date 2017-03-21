const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('bin'));

app.get('/', function (req, res, next) {
	res.sendFile(__dirname + '/index.html');
})

app.get('/games/:game', function(req, res, next) {
	const options = {root: __dirname + '/games/'};
	const fileName = req.params.game;
	res.sendFile(fileName, options, function(err){
		if (err)
			res.status(err.status).end();
	});
});

app.listen(port, function() {
	console.log("listening on Port " + port);
});