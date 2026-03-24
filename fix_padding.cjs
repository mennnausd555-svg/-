const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replace) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.split(search).join(replace);
  fs.writeFileSync(filePath, newContent);
}

replaceInFile(path.join(__dirname, 'src/components/Auth.tsx'), 'pl-12', '!pl-12');
replaceInFile(path.join(__dirname, 'src/components/Auth.tsx'), 'pr-12', '!pr-12');
replaceInFile(path.join(__dirname, 'src/components/ScriptForm.tsx'), 'pr-12', '!pr-12');
replaceInFile(path.join(__dirname, 'src/components/ScriptForm.tsx'), 'pl-12', '!pl-12');

console.log('Replaced successfully');
