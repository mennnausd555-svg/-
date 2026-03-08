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
  
  // Replace slate colors
  content = content.replace(/text-slate-400/g, 'text-gray-400');
  content = content.replace(/text-slate-500/g, 'text-gray-500');
  content = content.replace(/text-slate-300/g, 'text-gray-300');
  content = content.replace(/text-slate-200/g, 'text-gray-200');
  content = content.replace(/text-slate-100/g, 'text-gray-100');
  
  content = content.replace(/bg-slate-50 dark:bg-slate-900\/30/g, 'bg-white/5');
  content = content.replace(/bg-slate-100 dark:bg-slate-700/g, 'bg-white/10');
  content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-white/10');
  content = content.replace(/bg-slate-900\/60/g, 'bg-black/80');
  
  content = content.replace(/hover:bg-slate-50 dark:hover:bg-slate-900\/30/g, 'hover:bg-white/5');
  content = content.replace(/hover:bg-slate-100 dark:hover:bg-slate-700/g, 'hover:bg-white/10');
  content = content.replace(/hover:bg-slate-100 dark:hover:bg-slate-800/g, 'hover:bg-white/10');
  content = content.replace(/hover:bg-slate-200 dark:hover:bg-slate-700/g, 'hover:bg-white/10');
  
  content = content.replace(/divide-slate-200 dark:divide-slate-700/g, 'divide-white/10');
  
  fs.writeFileSync(file, content);
});
