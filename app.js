const fs = require('fs');
const express = require('express');
const app = express();
const Busboy = require('busboy');
const compression = require('compression');
const ffmpeg = require('fluent-ffmpeg');
const uniqueFilename = require('unique-filename');
const consts = require(__dirname + '/app/constants.js');
const endpoints = require(__dirname + '/app/endpoints.js');
const winston = require('winston');

app.use(compression());
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp': true});

for (let prop in endpoints.types) {
    if (endpoints.types.hasOwnProperty(prop)) {
        let ffmpegParams = endpoints.types[prop];
        let bytes = 0;
        app.post('/' + prop, function(req, res) {
            let hitLimit = false;
            let fileName = '';
            let savedFile = uniqueFilename(__dirname + '/uploads/');
            let busboy = new Busboy({
                headers: req.headers,
                limits: {
                    files: 1,
                    fileSize: consts.fileSizeLimit,
            }});
            busboy.on('filesLimit', function() {
                winston.error(JSON.stringify({
                    type: 'filesLimit',
                    message: 'Upload file size limit hit',
                }));
            });

            busboy.on('file', function(
                fieldname,
                file,
                filename,
                encoding,
                mimetype
            ) {
                file.on('limit', function(file) {
                    hitLimit = true;
                    let err = {file: filename, error: 'exceeds max size limit'};
                    err = JSON.stringify(err);
                    winston.error(err);
                    res.writeHead(500, {'Connection': 'close'});
                    res.end(err);
                });
                let log = {
                    file: filename,
                    encoding: encoding,
                    mimetype: mimetype,
                };
                winston.info(JSON.stringify(log));
                file.on('data', function(data) {
                    bytes += data.length;
                });
                file.on('end', function(data) {
                    log.bytes = bytes;
                    winston.info(JSON.stringify(log));
                });

                fileName = filename;
                winston.info(JSON.stringify({
                    action: 'Uploading',
                    name: fileName,
                }));
                let written = file.pipe(fs.createWriteStream(savedFile));

                if (written) {
                    winston.info(JSON.stringify({
                        action: 'saved',
                        path: savedFile,
                    }));
                }
            });
            busboy.on('finish', function() {
                if (hitLimit) {
                    fs.unlinkSync(savedFile);
                    return;
                }
                winston.info(JSON.stringify({
                    action: 'upload complete',
                    name: fileName,
                }));
                let outputFile = savedFile + '.' + ffmpegParams.extension;
                winston.info(JSON.stringify({
                    action: 'begin conversion',
                    from: savedFile,
                    to: outputFile,
                }));
                let ffmpegConvertCommand = ffmpeg(savedFile);
                ffmpegConvertCommand
                        .renice(15)
                        .outputOptions(ffmpegParams.outputOptions)
                        .on('error', function(err) {
                            let log = JSON.stringify({
                                type: 'ffmpeg',
                                message: err,
                            });
                            winston.error(log);
                            fs.unlinkSync(savedFile);
                            res.writeHead(500, {'Connection': 'close'});
                            res.end(log);
                        })
                        .on('end', function() {
                            fs.unlinkSync(savedFile);
                            winston.info(JSON.stringify({
                                action: 'starting download to client',
                                file: savedFile,
                            }));

                            res.download(outputFile, null, function(err) {
                                if (err) {
                                    winston.error(JSON.stringify({
                                        type: 'download',
                                        message: err,
                                    }));
                                }
                                winston.info(JSON.stringify({
                                    action: 'deleting',
                                    file: outputFile,
                                }));
                                if (fs.unlinkSync(outputFile)) {
                                    winston.info(JSON.stringify({
                                        action: 'deleted',
                                        file: outputFile,
                                    }));
                                }
                            });
                        })
                        .save(outputFile);
            });
            return req.pipe(busboy);
        });
    }
}

require('express-readme')(app, {
    filename: 'README.md',
    routes: ['/', '/readme'],
});

const server = app.listen(consts.port, function() {
    let host = server.address().address;
    let port = server.address().port;
    winston.info(JSON.stringify({
        action: 'listening',
        url: 'http://'+host+':'+port,
    }));
});

server.on('connection', function(socket) {
    winston.info(JSON.stringify({
        action: 'new connection',
        timeout: consts.timeout,
    }));
    socket.setTimeout(consts.timeout);
    socket.server.timeout = consts.timeout;
    server.keepAliveTimeout = consts.timeout;
});

app.use(function(req, res, next) {
  res.status(404).send(JSON.stringify({error: 'route not available'})+'\n');
});
