const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (e) {
    return { error: e.message };
  }
}

const files = ['logo.png', 'logo 2.png', 'logo-128.png', 'logo-48.png', 'logo-16.png'];
files.forEach(f => {
  const p = path.join(__dirname, 'public', f);
  console.log(`${f}:`, getPngDimensions(p));
});
