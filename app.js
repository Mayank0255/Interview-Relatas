const fs = require('fs');
const express = require('express');
const app = express();
const getFilesizeInBytes = require('./helpers/getFileSize');

let fileDescriptor;

fs.open('example.txt', 'r', (error, fd) => {
    if (error) console.log(error);
    console.log(fd);
    fileDescriptor = fd;
})

let lineSize = 256;
let size = 0;
let currentIndex = 0;
let callCount = 0;
let fileSize = getFilesizeInBytes('example.txt');

app.get('/', async (req, res) => {
    const { lines, index } = req.query;
    if (typeof lines !== 'undefined') {
        size = lineSize * +lines;
    } else {
        size = lineSize
    }

    if (size > fileSize) {
        return res.json({
            success: false,
            message: 'Size limit exceeded',
            size: size,
            data: null
        })
    }

    let buffer = new Buffer.alloc(size);

    if (index === 'forward' && callCount !== 0) {
        currentIndex += size;
        if (currentIndex > fileSize) {
            return res.json({
                success: false,
                message: 'Size limit exceeded. Go backwards.',
                size: null,
                data: null
            });
        }
    }
    if (index === 'backward') {
        currentIndex -= size;
        if (currentIndex <= 0) {
            currentIndex = 0;
        }
    }

    const data = await new Promise((resolve, reject) => {
        fs.read(fileDescriptor, buffer, 0, buffer.length, currentIndex, function (err, bytes) {
            if (err) reject(err);
            if (bytes > 0) {
                resolve(buffer.slice(0, bytes).toString());
            }
            console.log(bytes + " bytes read");
        });
    });

    callCount += 1;
    console.log("Call Number: ", callCount)
    return res.json({
        success: true,
        message: null,
        size,
        data
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));