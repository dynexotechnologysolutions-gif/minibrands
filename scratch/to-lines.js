const fs = require('fs');

const filePath = 'C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\3cd45a0d-3ed2-4244-8f0f-ce06e975c6bf\\velvet_lane_stitch_design_spec.md';
const fileContent = fs.readFileSync(filePath);
const base64Content = fileContent.toString('base64');

fs.writeFileSync('C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\3cd45a0d-3ed2-4244-8f0f-ce06e975c6bf\\base64_spec.txt', base64Content);
const lines = base64Content.match(/.{1,100}/g);
fs.writeFileSync('C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\3cd45a0d-3ed2-4244-8f0f-ce06e975c6bf\\split_base64.txt', lines.join('\n'));

console.log('Success! Base64 size:', base64Content.length, 'Lines:', lines.length);
