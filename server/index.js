const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/games/:game', function(req, res, next) {
	const options = {root: __dirname + '/games/'};
	const fileName = req.params.game;
	res.sendFile(fileName, options, function(err){
		if (err)
			res.status(err.status).end();
	});
});

app.listen(1337, function() {
	console.log("listening on Port 1337");
});