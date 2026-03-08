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
const colors = ['amber', 'rose', 'emerald', 'sky', 'blue', 'red', 'green', 'yellow'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  colors.forEach(color => {
    content = content.replace(new RegExp(`bg-${color}-50\\b`, 'g'), `bg-${color}-500/10`);
    content = content.replace(new RegExp(`bg-${color}-100\\b`, 'g'), `bg-${color}-500/20`);
    content = content.replace(new RegExp(`bg-${color}-200\\b`, 'g'), `bg-${color}-500/30`);
    
    content = content.replace(new RegExp(`text-${color}-600\\b`, 'g'), `text-${color}-400`);
    content = content.replace(new RegExp(`text-${color}-700\\b`, 'g'), `text-${color}-400`);
    content = content.replace(new RegExp(`text-${color}-800\\b`, 'g'), `text-${color}-400`);
    content = content.replace(new RegExp(`text-${color}-900\\b`, 'g'), `text-${color}-400`);
    
    content = content.replace(new RegExp(`border-${color}-100\\b`, 'g'), `border-${color}-500/20`);
    content = content.replace(new RegExp(`border-${color}-200\\b`, 'g'), `border-${color}-500/30`);
  });
  
  // Clean up any double spaces left behind
  content = content.replace(/  +/g, ' ');
  
  fs.writeFileSync(file, content);
});
