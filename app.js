const express = require('express');
const app = express();
const fs = require('fs');
const getFilesizeInBytes = require('./helpers/getFileSize');
const responseHandler = require('./helpers/responseHandler');

let fileDescriptor;
let lineSize = 256;
let size = 0;
let currentIndex = 0;
let callCount = 0;
let fileSize = getFilesizeInBytes('example.txt');

fs.open('example.txt', 'r', (error, fd) => {
    if (error) console.log(error);
    console.log(fd);
    fileDescriptor = fd;
})

app.get('/', async (req, res) => {
    const { lines, index } = req.query;
    if (typeof lines !== 'undefined') {
        size = lineSize * +lines;
    } else {
        size = lineSize
    }

    if (size > fileSize) {
        return res.json(responseHandler(false, 'Size limit exceeded', size, null));
    }

    let buffer = new Buffer.alloc(size);

    if (index === 'forward' && callCount !== 0) {
        currentIndex += size;
        if (currentIndex > fileSize) {
            return res.json(responseHandler(false, 'Size limit exceeded. Go backwards.', null, null));
        }
    }
    if (index === 'backward') {
        currentIndex -= size;
        if (currentIndex <= 0) {
            currentIndex = 0;
        }
    }

    const data = await new Promise((resolve, reject) => {
        fs.read(fileDescriptor, buffer, 0, buffer.length, currentIndex, (err, bytes) => {
            if (err) reject(err);
            if (bytes > 0) {
                resolve(buffer.slice(0, bytes).toString());
            }
            console.log(bytes + ' bytes read');
        });
    });

    callCount += 1;
    console.log('Call Number: ', callCount);
    return res.json(responseHandler(true, null, size, data));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));