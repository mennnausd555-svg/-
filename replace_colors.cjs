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
  
  // Replace gradients
  content = content.replace(/bg-gradient-to-br from-indigo-500 to-violet-600/g, 'bg-[#EFFF04]');
  content = content.replace(/bg-gradient-to-r from-indigo-500 to-violet-600/g, 'bg-[#EFFF04]');
  
  // Replace text colors
  content = content.replace(/text-indigo-600 dark:text-indigo-400/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-600/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-500/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-400/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-700\/80 dark:text-indigo-400\/80/g, 'text-[#EFFF04]/80');
  content = content.replace(/text-indigo-700\/80/g, 'text-[#EFFF04]/80');
  content = content.replace(/text-indigo-700/g, 'text-[#d4e000]');
  content = content.replace(/text-indigo-900 dark:text-indigo-300/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-900/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-800 dark:text-indigo-400/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-800/g, 'text-[#EFFF04]');
  content = content.replace(/text-indigo-300/g, 'text-[#EFFF04]');
  
  // Replace background colors
  content = content.replace(/bg-indigo-600 text-white/g, 'bg-[#EFFF04] text-black');
  content = content.replace(/bg-indigo-600/g, 'bg-[#EFFF04]');
  content = content.replace(/bg-indigo-500/g, 'bg-[#EFFF04]');
  content = content.replace(/bg-indigo-700/g, 'bg-[#d4e000]');
  content = content.replace(/bg-indigo-50 dark:bg-indigo-500\/10/g, 'bg-[#EFFF04]/10');
  content = content.replace(/bg-indigo-50\/50 dark:bg-indigo-500\/5/g, 'bg-[#EFFF04]/5');
  content = content.replace(/bg-indigo-50 dark:bg-indigo-500\/5/g, 'bg-[#EFFF04]/5');
  content = content.replace(/bg-indigo-50 dark:bg-indigo-900\/30/g, 'bg-[#EFFF04]/10');
  content = content.replace(/bg-indigo-50/g, 'bg-[#EFFF04]/10');
  content = content.replace(/bg-indigo-100 dark:bg-indigo-500\/20/g, 'bg-[#EFFF04]/20');
  content = content.replace(/bg-indigo-100 dark:bg-indigo-900\/30/g, 'bg-[#EFFF04]/20');
  content = content.replace(/bg-indigo-100/g, 'bg-[#EFFF04]/20');
  content = content.replace(/bg-indigo-200/g, 'bg-[#EFFF04]/30');
  
  // Replace border colors
  content = content.replace(/border-indigo-500/g, 'border-[#EFFF04]');
  content = content.replace(/border-indigo-100 dark:border-indigo-500\/20/g, 'border-[#EFFF04]/20');
  content = content.replace(/border-indigo-100 dark:border-indigo-500\/10/g, 'border-[#EFFF04]/10');
  content = content.replace(/border-indigo-100/g, 'border-[#EFFF04]/20');
  content = content.replace(/border-indigo-300/g, 'border-[#EFFF04]/50');
  
  // Replace ring colors
  content = content.replace(/ring-indigo-500/g, 'ring-[#EFFF04]');
  content = content.replace(/ring-indigo-50 dark:ring-indigo-500\/20/g, 'ring-[#EFFF04]/20');
  
  // Replace shadow colors
  content = content.replace(/shadow-indigo-500/g, 'shadow-[#EFFF04]');
  
  // Replace hover colors
  content = content.replace(/hover:text-indigo-500/g, 'hover:text-[#EFFF04]');
  content = content.replace(/hover:text-indigo-600/g, 'hover:text-[#EFFF04]');
  content = content.replace(/hover:text-indigo-700/g, 'hover:text-[#d4e000]');
  content = content.replace(/hover:bg-indigo-100 dark:hover:bg-indigo-500\/20/g, 'hover:bg-[#EFFF04]/20');
  content = content.replace(/hover:bg-indigo-100/g, 'hover:bg-[#EFFF04]/20');
  content = content.replace(/hover:bg-indigo-200 dark:hover:bg-indigo-500\/30/g, 'hover:bg-[#EFFF04]/30');
  content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-[#d4e000]');
  content = content.replace(/hover:border-indigo-500/g, 'hover:border-[#EFFF04]');
  content = content.replace(/hover:border-indigo-300/g, 'hover:border-[#EFFF04]/50');
  
  // Replace dark variants that might be left over
  content = content.replace(/dark:text-indigo-400/g, 'text-[#EFFF04]');
  content = content.replace(/dark:text-indigo-300/g, 'text-[#EFFF04]');
  content = content.replace(/dark:bg-indigo-500\/10/g, 'bg-[#EFFF04]/10');
  content = content.replace(/dark:bg-indigo-500\/20/g, 'bg-[#EFFF04]/20');
  content = content.replace(/dark:bg-indigo-500\/30/g, 'bg-[#EFFF04]/30');
  content = content.replace(/dark:bg-indigo-500\/5/g, 'bg-[#EFFF04]/5');
  content = content.replace(/dark:bg-indigo-900\/30/g, 'bg-[#EFFF04]/10');
  content = content.replace(/dark:border-indigo-500\/20/g, 'border-[#EFFF04]/20');
  content = content.replace(/dark:border-indigo-500\/10/g, 'border-[#EFFF04]/10');
  content = content.replace(/dark:ring-indigo-500\/20/g, 'ring-[#EFFF04]/20');
  content = content.replace(/dark:hover:bg-indigo-500\/20/g, 'hover:bg-[#EFFF04]/20');
  content = content.replace(/dark:hover:bg-indigo-500\/30/g, 'hover:bg-[#EFFF04]/30');
  content = content.replace(/dark:hover:text-indigo-300/g, 'hover:text-[#EFFF04]');
  
  // Replace slate with dark neon theme colors
  content = content.replace(/bg-slate-50 dark:bg-slate-900/g, 'bg-[#0a0a0a]');
  content = content.replace(/bg-white dark:bg-slate-900/g, 'bg-[#0a0a0a]');
  content = content.replace(/bg-white dark:bg-slate-800/g, 'bg-[#111111]');
  content = content.replace(/bg-slate-50 dark:bg-slate-800/g, 'bg-[#111111]');
  content = content.replace(/border-slate-200 dark:border-slate-800/g, 'border-white/10');
  content = content.replace(/border-slate-200 dark:border-slate-700/g, 'border-white/10');
  content = content.replace(/text-slate-900 dark:text-white/g, 'text-white');
  content = content.replace(/text-slate-900 dark:text-slate-100/g, 'text-white');
  content = content.replace(/text-slate-700 dark:text-slate-200/g, 'text-gray-200');
  content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-gray-400');
  content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-gray-400');
  content = content.replace(/text-slate-500 dark:text-slate-300/g, 'text-gray-300');
  content = content.replace(/text-slate-400 dark:text-slate-500/g, 'text-gray-500');
  content = content.replace(/text-slate-900/g, 'text-white');
  content = content.replace(/text-slate-800/g, 'text-gray-200');
  content = content.replace(/text-slate-700/g, 'text-gray-300');
  content = content.replace(/text-slate-600/g, 'text-gray-400');
  content = content.replace(/text-slate-500/g, 'text-gray-500');
  
  // Replace text-white where it was inside an indigo button
  content = content.replace(/text-white group-hover:text-white/g, 'text-black group-hover:text-black');
  
  fs.writeFileSync(file, content);
});
