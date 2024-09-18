const http = require('http');
http.createServer(function (req, res) {
    res.write("Starbucks");
    res.end();
}).listen(8080);
