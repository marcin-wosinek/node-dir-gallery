var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  if (uri == '/') {
    var output = '';
    var images = fs.readdirSync('images');

    response.writeHead(200, {'Content-Type': 'text/html'});

    for (var i in images) {
      var name = images[i];

      if (name.indexOf('.png') > 0) {
        // Is image
        output += '<h1>' + name + '</h1>';
        output += '<img src="/images/' + name + '" /><br />';
      }
      else {
        output += '<h1><a href="' + name + '">' + name + '</a></h1>';
      }
    }

    response.end(output);

    return;
  }

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(1337);
