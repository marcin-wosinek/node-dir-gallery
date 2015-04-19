var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  port = process.argv[2] || 1337,
  express = require('express'),
  serveIndex = require('serve-index'),
  app = express();

app.use('/public', express.static(__dirname + '/public'));
app.use('/images', serveIndex(__dirname + '/images'));
app.use('/images', express.static(__dirname + '/images'));

var resources = [
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta http-equiv="content-type" content="text/html; charset=utf-8"/>',
  '<script src="http://minifiedjs.com/download/minified-web.js"></script>',
  '<script src="/public/script.js"></script>',
  '<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">',
  '<link rel="stylesheet" href="http://yui.yahooapis.com/pure/0.5.0/pure-min.css">',
  '<link rel="stylesheet" href="/public/site.css">'
];

var domains = {
'INT5': 'http://synergy5-int.roche.com',
'UAT5': 'http://synergy5-uat.roche.com',
'UAT5-EMAP': 'http://synergy5-emap.roche.com',
'DEMO5': 'http://synergy5-demo.roche.com',
'PROD5': 'http://synergy.intranet.roche.com'
};

// confirm remove folder
app.use('/remove/ask', function(request, response) {
  var uri = url.parse(request.url).pathname,
    output = [],
    href = uri.replace('/remove/ask', '');

  if (fs.existsSync('images' + href)) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    output.push('<head>' + resources.join('') + '</head>');
    output.push([
      '<h2>Remove folder "' + href + '"?</h2>',
      ' <a href="/remove' + href + '" class="remove pure-button pure-button-primary">yes remove</a>',
      ' <a href="' + href + '" class="remove pure-button">no</a>'
    ].join(''));
    response.end(output.join(''));
  }
});

// remove folder
app.use('/remove', function(request, response) {
  var uri = url.parse(request.url).pathname,
    output = [],
    path = './images' + uri;

  response.writeHead(200, {'Content-Type': 'text/html'});
  output.push('<head>' + resources.join('') + '</head>');

  try {
    if (fs.statSync(path).isDirectory()) {
      fs.readdirSync(path).forEach(function(file, index) {
        var curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        }
        else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }

    output.push('<h2>Folder removed: <em>' + path + '</em></h2>');
    output.push('<a href="/">Return</a>');
  }
  catch (e) {
    output.push('<h2>Cannot remove folder: <em>' + path + '</em></h2>');
    output.push('<pre>' + e + '</pre>');
    output.push('<a href="/">Return</a>');
  }

  response.end(output.join(''));
});

app.use(function(request, response) {
var uri = url.parse(request.url).pathname,
  output = ['<html>'], name, parseName,
  files, errorFiles,
  href, linkId,
  domain = '',
  fileName = path.join(process.cwd(), uri),
  render = function(name, domain, uri) {
    var output = [],
      prefix = '',
      data = 0,
      href,
      linkId,
      errorFile = 'images/' + name + '/errors.json';

    // image
    if (name.match(/(.png|.jpg)/)) {
      linkId = name.match(/_(\d{1,5})\w*?\.png/)[1];
      prefix = name.match(/_\d{1,5}(\w*?)\.png/)[1];
      href = name.replace(/_\d{1,5}\w*?\.png/g, '').replace(/_/g, '/')
        .replace(/\$1/g, '?').replace(/\$2/g, '&').replace(/\$3/g, '#');

      output = [
        '<li><h3 id="image-' + linkId + '">',
        ' <a href="#image-' + linkId + '">',
        '<em class="pure-button button-small"><i class="fa fa-link"></i></em>',
        '</a>',
        ' <a href="' + domain + href + '" title="index :' + linkId + '" class="title pure-button button-small pure-button-primary" target="blank">',
        domain + href + (prefix ? '#' + prefix : '') + '</a>',
        '</h3>',
        '<img src="/images' + uri + "/" + name + '" class="pure-img" /></li>'
      ];
    }
    // folder
    else if (fs.statSync('images' + uri + '/' + name).isDirectory()) {
      href = uri + '/' + name;
      parseName = name.match(/(\w+)-(\d+-\d+-\d+)_(.+)/);

      if (fs.existsSync(errorFile)) {
        data = JSON.parse(fs.readFileSync(errorFile));
      }

      output.push([
        '<div class="pure-g">',
          '<h3 class="pure-u-5-6">',
          '<a href="' + href + '">',
          ' <strong class="pure-u-1-8">' + parseName[1] + '</strong>',
          ' <small class="time pure-u-5-8">' + parseName[2] + ' ' + parseName[3] + '</small>',
          '</a>',
          ' <small>' + data.images + ' images loaded in ' + parseInt(data.loaded, 10) + 's</small>',
          '</h3>',
          '<div class="pure-u-1-6">',
            '<strong class="badge warning">' + data.warnings + ' warnings</strong>',
            '<strong class="badge error">' + data.errors + ' errors</strong> ',
            '<a href="/remove/ask' + href + '" class="remove pure-button button-small pure-button-primary" title="remove folder">',
            '<i class="fa fa-trash-o"></i></a>',
          '</div>',
        '</div><hr/>'
        ].join(''));
      }
      return output.join('');
    },
    renderFilter = function(length) {
      return '<div class="filter-container"><label>Filter <input id="filter"/> <em>' + length + ' images </em></label> ' +
      '<a href="/portal/view" title="use filter" class="pure-button button-small filter-item">view</a> ' +
      '<a href="/portal/manage" title="use filter" class="pure-button button-small filter-item">manage</a> ' +
      '<a href="admin/" title="use filter" class="pure-button button-small filter-item">admin</a>  ' +
      '<a href="#compact" class="action-resize pure-button button-small pure-button-primary" title="smaller img"><i class="fa fa-arrows-alt"></i></a> ' +
      '<a href="#grid-2-columns" class="action-grid pure-button button-small pure-button-primary" title="grid img"><i class="fa fa-th-large"></i></a> ' +
      '<a href="#grid-3-columns" class="action-grid3 pure-button button-small pure-button-primary" title="grid img"><i class="fa fa-th"></i></a>' +
      '</div>';
    },
    folders = [
      '<div class="filter-container">',
      '<strong>ENVIRONMENTS:</strong></div>'
    ];

  if (!uri.match('.png')) {
    // to solve issue with slashes
    if (uri.length === 1) {
      uri = '';
    }

    for(var item in domains) {
      if (uri.match(item)) {
        domain = domains[item];
      }
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
      output.push(renderFilter(files.length));

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

      // without errors
      output.push('<ul class="list">');
      for (var i in files) {
        output.push(render(files[i], domain, uri));
      }

      output.push('</ul></body></html>');
    }
    // render folders
    else {
      output.push(folders.join(''));
      for (var i in files) {
        output.push(render(files[i], domain, uri));
      }
      output.push('</body></html>');
    }
    response.end(output.join(''));
    return;
  }
});

app.listen(port);
console.log('Server started at ' + port);