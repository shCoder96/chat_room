const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

let cache = {};

const send404 = (response) => {
    response.writeHead(404, {'Content-Type' : 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
};

const sendFile = (response, filePath, fileContents) => {
    response.writeHead(200,
        {'Content-Type' : mime.getType(path.basename(filePath))}
    );
    response.end(fileContents);
};
const serveStatic = (response, cache, absPath) => {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    }
    else {
        fs.access(absPath, fs.R_OK, (err, data) => {
            if (err) {
                send404(response);
            } else {
                cache[absPath] = data;
                sendFile(response, absPath, data);
            }
        });
    }
};

const server = http.createServer();

server.on('request', (request, response) => {
   let filePath = false;
   request.url == '/' ? filePath = 'public/index.html' : filePath = 'public' + request.url;
   let absPath = './' + filePath;
   serveStatic(response, cache, absPath);
   console.log(absPath)
}).listen(3000, () => console.log('Server is running with localhost:3000'));

