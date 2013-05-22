var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
  var images = fs.readdirSync('images');
  var output = '';

  res.writeHead(200, {'Content-Type': 'text/html'});

  for (var i in images) {
    output += '<img src="/images/' + images[i] + '" /><br />';
  }

  res.end(output);
}).listen(1337);
