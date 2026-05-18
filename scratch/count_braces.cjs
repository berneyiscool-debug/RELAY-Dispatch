const fs = require('fs');
const code = fs.readFileSync('src/pages/jobs/JobDetail.js', 'utf8');
let braces = 0;
let brackets = 0;
let parens = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inBlockComment = false;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i+1];
  
  if (inBlockComment) {
    if (c === '*' && next === '/') { inBlockComment = false; i++; }
    continue;
  }
  if (inComment) {
    if (c === '\n') inComment = false;
    continue;
  }
  if (inString) {
    if (c === stringChar && code[i-1] !== '\\') inString = false;
    continue;
  }
  
  if (c === '/' && next === '/') { inComment = true; i++; continue; }
  if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
  if (c === "'" || c === '"' || c === '`') { inString = true; stringChar = c; continue; }
  
  if (c === '{') braces++;
  if (c === '}') braces--;
  if (c === '[') brackets++;
  if (c === ']') brackets--;
  if (c === '(') parens++;
  if (c === ')') parens--;
}

console.log({ braces, brackets, parens });
