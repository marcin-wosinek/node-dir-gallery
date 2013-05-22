var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
  var images = fs.readdirSync('images');
  console.log(images);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337);
