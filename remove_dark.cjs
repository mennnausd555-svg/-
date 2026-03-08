const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove dark: prefix
  content = content.replace(/dark:[a-zA-Z0-9\-\/\[\]\#]+/g, '');
  
  // Clean up any double spaces left behind
  content = content.replace(/  +/g, ' ');
  
  fs.writeFileSync(file, content);
});
