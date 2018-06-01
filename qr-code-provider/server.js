const express = require('express');
const app = express();
const qr = require('./qr-manager').manager;

app.get('/', defaultPathHandler);
app.get('/code/:input/type/:type?', fetchImageHandler);
app.get('/code/:input', fetchImageHandler);

var server = app.listen(8082, 'localhost', function () {
    console.log(JSON.stringify(server.address()));
    var host = server.address().address;
    var port = server.address().port;

    console.log("Application listening at http://%s:%s", host, port)
});

function defaultPathHandler(req, res) {
    res.send('Welcome');
}


function fetchImageHandler(req, res) {
    console.log(JSON.stringify(req.params));

    let typeParam = req.params.type;
    let data = '';
    if (typeParam) typeParam = typeParam.toUpperCase();

    switch (typeParam) {
        case 'BUF':
            data = qr.getImageString(req.params.input, qr.supportedTypes.BUFFER);
            res.send(data);
            break;
        case 'UTF':
            data = qr.getImageString(req.params.input, qr.supportedTypes.UTF8);
            res.send(data);
            break;
        case 'IMG':
            data = qr.getImage(req.params.input);
            res.writeHead(200, {
                'Content-Type': 'image/png'
            });
            data.pipe(res);
            break;
        default:
            data = qr.getImageString(req.params.input, qr.supportedTypes.JSON);
            res.send(data);
            break;
    }


}