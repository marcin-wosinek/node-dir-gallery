var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 1337;

http.createServer(function(request, response) {
  var uri = url.parse(request.url).pathname,
    output = ['<html>'], name,
    files, errorFiles,
    href, linkId,
    domain = '',
    fileName = path.join(process.cwd(), uri),
    render = function(name, domain, uri) {
      var output = [],
        prefix = '',
        errors = 0,
        href,
        linkId,
        errorFile = 'images/' + name + '/errors.txt';

      // image
      if (name.match(/(.png|.jpg)/)) {
        linkId = name.match(/_(\d{1,5})\w*?\.png/)[1];
        prefix = name.match(/_\d{1,5}(\w*?)\.png/)[1];
        href = name.replace(/_\d{1,5}\w*?\.png/g, '').replace(/_/g, '/')
          .replace(/\$1/g, '?').replace(/\$2/g, '&');
        output = [
          '<li><h3 id="image-' + linkId + '">',
          '<strong title="index in *urls.txt">' + linkId + '</strong> : ',
          ' <a href="' + domain + href + '" class="title pure-button pure-button-primary" target="blank">' + domain + href + (prefix ? '#' + prefix : '') + '</a>',
          ' <a href="#image-' + linkId + '"><em class="pure-button button-small">#permlink</em></a></h3>',
          '<img src="/images' + uri + "/" + name + '" class="pure-img" /></li>'
        ];
      }
      // folder
      else if (fs.statSync('images' + uri + '/' + name).isDirectory()) {
        href = uri + '/' + name;
        if (fs.existsSync(errorFile)) {
          errors = fs.readFileSync(errorFile);
        }
        output.push([
          '<div class="pure-g">',
          '<h3 class="pure-u-1-5"><a href="' + href + '">' + name + '</a></h3>',
          '<div class="pure-u-4-5"><strong class="badge">' + errors + ' warnings, errors</strong>',
          //' <a href="' + href + '/remove/ask" class="remove pure-button button-small pure-button-primary">remove folder</a>',
          '</div></div><hr/>'
        ].join(''));
      }
      return output.join('');
    },
    filter = '<div class="filter-container"><label>Filter <input id="filter"/><em></em></label></div>',
    resources = [
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<script src="http://minifiedjs.com/download/minified-web.js"></script>',
      '<script>var _ = require("minified");',
      'function ready() {',
      '  _.$("#filter").on("keyup",function() {',
      '    var value = this[0].value, counter = 0;',
      '    _.$("ul li .title").each(function(node) {',
      '      if (node.innerHTML.indexOf(value) != -1) {',
      '       node.parentNode.parentNode.style.display = "block"; counter++;',
      '      } else {',
      '       node.parentNode.parentNode.style.display = "none"; }',
      '    });',
      '    _.$(".filter-container em").fill("(" + counter + ")");',
      '  });',
      '}',
      '_.$.ready(ready);',
      '</script>',
      '<link rel="stylesheet" href="http://yui.yahooapis.com/pure/0.5.0/pure-min.css">',
      '<style>',
      'body {padding: 50px 10px 10px;}',
      'h2 {background: #eee; padding: 10px;}',
      'h3 {margin: .5em 0;}',
      'ul{padding:0}',
      'hr {border: 0; height: 1px; background-color: #eee;}',
      'ul li {border-bottom: solid 1px #f8f8f8;}',
      '.errors * {color: rgb(202, 60, 60);}',
      '.errors .pure-button-primary {background-color: rgb(202, 60, 60);}',
      '.badge {background: #ddd; border-radius: 6px; padding: 3px; margin-left: 15px;font-size: .7em}',
      '.filter-container {color: #fff; font-size: 2em; position: fixed; top: 0; left: 0; width: 100%; background: #000; padding: 5px;}',
      '</style>'
    ];

  // confirm remove folder
  if (uri.match('/remove/ask')) {
    href = uri.replace('/remove/ask', '');

    if (fs.existsSync('images' + href)) {
      response.writeHead(200, {'Content-Type': 'text/html'});
      output.push('<head>' + resources.join('') + '</head>');
      output.push([
        '<h2>Remove folder "' + href + '"?</h2>',
        ' <a href="' + href + '/remove" class="remove pure-button pure-button-primary">yes remove</a>',
        ' <a href="' + href + '" class="remove pure-button">no</a>'
      ].join(''));
      response.end(output.join(''));
    }
  }
  // remove folder
  else if (uri.match('/remove')) {
    href = ('images' + uri).replace('/remove', '');

    if (fs.statSync(href).isDirectory()) {
      fs.readdirSync(href).forEach(function(file, index) {
        var curPath = href + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        }
        else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(href);

      response.writeHead(200, {'Content-Type': 'text/html'});
      output.push('<head>' + resources.join('') + '</head>');
      output.push('<h2>Folder removed: <em>' + href + '</em></h2>');
      response.end(output.join(''));
    }
  }
  else if (!uri.match('.png')) {
    // to solve issue with slashes
    if (uri.length === 1) {
      uri = '';
    }

    if (uri.match('INT5')) {
      domain = 'http://synergy5-int.roche.com';
    }
    else if (uri.match('INT')) {
      domain = 'http://synergy-int.roche.com';
    }
    else if (uri.match('UAT5')) {
      domain = 'http://synergy5-uat.roche.com';
    }
    else if (uri.match('UAT')) {
      domain = 'http://synergy-uat.roche.com';
    }
    else if (uri.match('UAT5-EMAP')) {
      domain = 'http://synergy5-emap.roche.com';
    }
    else if (uri.match('DEMO5')) {
      domain = 'http://synergy5-demo.roche.com';
    }
    else if (uri.match('PROD5')) {
      domain = 'http://synergy.intranet.roche.com';
    }
    else if (uri.match('PROD')) {
      domain = 'http://synergy.roche.com';
    }

    try {
      files = fs.readdirSync('images' + uri);
    }
    catch (e) {
      response.writeHead(404, {'Content-Type': 'text/html'});
      response.write("<h2>404 Dir doesn't exists</h2>");
      response.end();
      return;
    }

    response.writeHead(200, {'Content-Type': 'text/html'});
    output.push('<head>' + resources.join('') + '</head>');

    // render images
    if (domain !== '') {
      output.push(filter);

      errorFiles = files.filter(function(element) {
        return element.indexOf('error.png') !== -1;
      });
      files = files.filter(function(element) {
        return element.indexOf('error.png') === -1;
      });

      // with errors
      if (errorFiles.length) {
        output.push('<ul class="errors">');
        for (var i in errorFiles) {
          output.push(render(errorFiles[i], domain, uri));
        }
        output.push('</ul>');
      }
      else {
        output.push('<h2>NO ERRORS:</h2>');
      }

      // without errors
      output.push('<ul>');
      for (var i in files) {
        output.push(render(files[i], domain, uri));
      }

      output.push('</ul></body></html>');
    }
    // render folders
    else {
      output.push('<div class="filter-container"><strong>ENVIRONMENTS:</strong></div>');
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
      response.writeHead(404, {'Content-Type': 'text/html'});
      response.write('404 Not Found\n');
      response.end();
      return;
    }

    if (fs.statSync(fileName).isDirectory()) {
      fileName += '/index.html';
    }

    fs.readFile(fileName, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
}).listen(port);

console.log('Servert started at ' + port);
