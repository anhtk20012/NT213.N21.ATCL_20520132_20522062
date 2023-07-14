var needle = require('needle');
var express = require('express');
var app = express();
var commandLineArgs = require('command-line-args');

const parseUrl = require("parse-url");

// Currently this app is also vulnerable to reflective XSS as well.

var cli = [
  { name: 'port', alias: 'p', type: Number, defaultOption:80 }
]
var options = commandLineArgs(cli)

const isLocal = () => (req, res, next) => (req.connection.remoteAddress === '::ffff:127.0.0.1'|| req.connection.remoteAddress === '::1' ? true:false)
  ? next()
  : res.json({'state':'You\'re not locally'});

app.get('/', function(request, response){
  var params = request.params;

  if (request.query['mime'] == 'plain'){
    var mime = 'plain';
  } else {
    var mime = 'html';
  };

  if (request.query['url'] ){ 

    var url = request.query['url'];
    parsed = parseUrl(url);

  } else {

    response.writeHead(200, {'Content-Type': 'text/'+mime});
    response.write('<h1>SSRF demo.</h1>\n\n');
    response.write('<h2>I am an application. I want to be useful, so if you specify the url parameter, I\'ll request the page for you:</h2><br><br>\n\n\n');
    response.write('<h2>Example: http://IP:PORT/?url=https://ifconfig.me</h2><br><br>\n\n\n');
	  response.end();

  }

  if(parsed.resource == '127.0.0.1'){

    response.writeHead(404, {'Content-Type': 'text/'+mime});
    response.write('<h1>SSRF demo.</h1>\n\n');
    response.write('<h2>You can\'t access as local: <font color="red">'+url+'</font> for you\n</h2><br><br>\n\n\n');
    response.end();
    console.log('not local')

  } else{

    url = parsed.href;
    needle.get(url, { timeout: 3000 }, function(error, response1) {

      if (!error && response1.statusCode == 200) {
        response.writeHead(200, {'Content-Type': 'text/'+mime});
        response.write('<h1>SSRF demo.</h1>\n\n');
        response.write('<h2>I am an application. I want to be useful, so I requested: <font color="red">'+url+'</font> for you\n</h2><br><br>\n\n\n');
        console.log(response1.body);
        response.write(response1.body);
        response.end();

      } else {

        response.writeHead(404, {'Content-Type': 'text/'+mime});
        response.write('<h1>SSRF demo.</h1>\n\n');
        response.write('<h2>I wanted to be useful, but I could not find: <font color="red">'+url+'</font> for you\n</h2><br><br>\n\n\n');
        response.end();
        console.log('error')
  
      }
    });
  }
})

app.get('/only4local', isLocal(), (req, res) => {

  if (req.query['file']){ 

    var fs = require('fs');
    var filePath = req.query['file'];
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){

      if (!err) {

        console.log('received data: ' + data);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();

      } else {

        res.end();
        console.log(err);
        
      }
    });
  }
});

if (options.port) {
	var port = options.port
} else {
	var port = 8000
}

app.listen(port);
console.log('\n###############################################')
console.log('#\n#  Server listening for connections on port:'+port);
console.log('#  Connect to server using the following url: \n#  -- http://[server]:'+port+'/?url=[URL]')
console.log('#\n###############################################')
