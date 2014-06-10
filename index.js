var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 1337;

http.createServer(function(request, response) {
  var uri = url.parse(request.url).pathname,
    output = ['<html>'], name,
    files, errorFiles,
    href, linkId, resources,
    domain = '',
    fileName = path.join(process.cwd(), uri),
    render = function(name, domain, uri) {
      var output = [],
        errors = 0,
        href,
        linkId,
        errorFile = 'images/' + name + '/errors.txt';

      if (name.indexOf('.png') > 0) {
        linkId = name.match(/_(\d{1,5})\w*?\.png/)[1];
        href = name.replace(/_\d{1,5}\w*?\.png/g, '').replace(/_/g, '/')
          .replace(/\$1/g, '?').replace(/\$2/g, '&');
        output = ['<li><h3 id="image-' + linkId + '">',
          '<strong class="error" title="index in *urls.txt">' + linkId + '</strong> : ',
          ' <a href="' + domain + href + '" class="title" target="blank">' + domain + href + '</a>',
          ' <a href="#image-' + linkId + '"><em>#permlink</em></a></h3>',
          '<img src="/images' + uri + "/" + name + '" /></li>'];
      }
      // folder
      else if (fs.statSync('images' + uri + '/' + name).isDirectory()) {
        href = uri + '/' + name;
        if (fs.existsSync(errorFile)) {
          errors = fs.readFileSync(errorFile);
        }
        output.push('<h3><a href="' + href + '">' + name +
          '</a> <strong class="error" title="warnings, errors">' + errors + '</strong></h3>');
      }
      return output.join('');
    };

  if (uri.indexOf('.png') < 0) {
    // to solve issue with slashes
    if (uri.length === 1) {
      uri = '';
    }

    if (uri.match('INT')) {
      domain = 'http://synergy-int.roche.com';
    }
    else if (uri.match('INT5')) {
      domain = 'http://synergy5-int.roche.com';
    }
    else if (uri.match('UAT')) {
      domain = 'http://synergy-uat.roche.com';
    }
    else if (uri.match('UAT5')) {
      domain = 'http://synergy5-uat.roche.com';
    }
    else if (uri.match('UAT5-EMAP')) {
      domain = 'http://synergy5-emap.roche.com';
    }
    else if (uri.match('DEMO5')) {
      domain = 'http://synergy5-demo.roche.com';
    }
    else if (uri.match('PROD')) {
      domain = 'http://synergy.roche.com';
    }
    else if (uri.match('PROD5')) {
      domain = 'http://synergy.intranet.roche.com';
    }

    try {
      files = fs.readdirSync('images' + uri);
    }
    catch (e) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Dir doesn't exists\n");
      response.end();
      return;
    }

    resources = [
      '<script src="http://minifiedjs.com/download/minified-web.js"></script>',
      '<script>var _ = require("minified");',
      'function ready() {',
      '  _.$("#filter").on("keyup",function() {',
      '    var value = this[0].value;',
      '    _.$("ul li .title").each(function(node) {',
      '      if (node.innerHTML.indexOf(value) != -1) {',
      '       node.parentNode.parentNode.style.display = "block";',
      '      } else {',
      '       node.parentNode.parentNode.style.display = "none"; }',
      '    })',
      '  });',
      '}',
      '_.$.ready(ready);',
      '</script>',
      '<style>',
      'h1 {background: #eee; padding: 10px;}',
      'ul{padding:0}',
      'ul li {border-bottom: solid 1px #f8f8f8;}',
      '.errors a { color: c00;}',
      'li em {background: #eee; border-radius: 6px; padding: 3px; margin-left: 15px;font-size: .7em}',
      '.error {background: #ddd; border-radius: 6px; padding: 3px; margin-left: 15px;font-size: .7em}',
      '.filter-container {position: fixed; top: 0; left: 0; width: 100%; background: #000; padding: 5px;}',
      '</style>'
    ];

    response.writeHead(200, {'Content-Type': 'text/html'});
    output.push('<head>' + resources.join('') + '</head>');

    // render images
    if (domain !== '') {
      output.push('<div class="filter-container"><input id="filter" placeholder="filter images"/></div><br>');

      errorFiles = files.filter(function(element) {
        return element.indexOf('error.png') !== -1;
      });
      files = files.filter(function(element) {
        return element.indexOf('error.png') === -1;
      });

      if (errorFiles.length) {
        output.push('<h1>PAGES WITH ERRORS:</h3><ul class="errors">');
        for (var i in errorFiles) {
          output.push(render(errorFiles[i], domain, uri));
        }
        output.push('</ul>');
      }
      else {
        output.push('<h1>NO ERRORS:</h1>');
      }

      output.push('<h1>PAGES WITHOUT ERRORS:</h3><ul>');
      for (var i in files) {
        output.push(render(files[i], domain, uri));
      }

      output.push('</ul></body></html>');
    }
    else {
      output.push('<h1>ENVIRONMENTS:</h1>');
      for (var i in files) {
        output.push(render(files[i], domain, uri));
      }
      output.push('</body></html>');
    }
    response.end(output.join(''));

    return;
  }

  fs.exists(fileName, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(fileName).isDirectory()) {
      fileName += '/index.html';
    }

    fs.readFile(fileName, "binary", function(err, file) {
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
}).listen(port);

console.log('Servert started at ' + port);
