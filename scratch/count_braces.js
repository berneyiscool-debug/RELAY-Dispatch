
const fs = require('fs');
const content = fs.readFileSync('c:/Users/joshu/.antigravity/Custom CRM experiment/src/pages/jobs/JobDetail.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = null;
let escaped = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (escaped) {
        escaped = false;
        continue;
    }
    if (char === '\\') {
        escaped = true;
        continue;
    }
    if (inString) {
        if (char === inString) {
            inString = null;
        }
        continue;
    }
    if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
    }
    
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
}

console.log(`Braces: ${braces}`);
console.log(`Parens: ${parens}`);
console.log(`Brackets: ${brackets}`);
