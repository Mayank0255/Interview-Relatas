const fs = require('fs');

module.exports = getFilesizeInBytes = (filename) => {
    const stats = fs.statSync(filename);
    return stats.size;
}