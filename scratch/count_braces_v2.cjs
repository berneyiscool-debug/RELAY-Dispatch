
const fs = require('fs');
const content = fs.readFileSync('c:/Users/joshu/.antigravity/Custom CRM experiment/src/pages/jobs/JobDetail.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let stack = []; // To handle template literal nesting

let escaped = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i+1];

    if (escaped) {
        escaped = false;
        continue;
    }
    if (char === '\\') {
        escaped = true;
        continue;
    }

    let top = stack[stack.length - 1];

    if (top === '"' || top === "'") {
        if (char === top) {
            stack.pop();
        }
        continue;
    }

    if (top === '`') {
        if (char === '`') {
            stack.pop();
        } else if (char === '$' && nextChar === '{') {
            stack.push('${');
            i++;
            braces++; // The { in ${
        }
        continue;
    }

    if (top === '${') {
        // We are inside a template interpolation. 
        // We treat this like normal JS, but need to watch for the closing }
        if (char === '{') { braces++; stack.push('{'); }
        else if (char === '}') { 
            braces--; 
            // If this } matches the ${, pop it.
            // But we might have nested { } inside.
            // So we need to keep track of normal braces too.
            stack.pop(); 
        }
        else if (char === '"' || char === "'") stack.push(char);
        else if (char === '`') stack.push(char);
        else if (char === '(') parens++;
        else if (char === ')') parens--;
        else if (char === '[') brackets++;
        else if (char === ']') brackets--;
        continue;
    }

    if (top === '{') {
        if (char === '{') { braces++; stack.push('{'); }
        else if (char === '}') { braces--; stack.pop(); }
        else if (char === '"' || char === "'") stack.push(char);
        else if (char === '`') stack.push(char);
        else if (char === '(') parens++;
        else if (char === ')') parens--;
        else if (char === '[') brackets++;
        else if (char === ']') brackets--;
        continue;
    }

    // Top level
    if (char === '/') {
        if (nextChar === '/') {
            while (i < content.length && content[i] !== '\n') i++;
            continue;
        }
        if (nextChar === '*') {
            i += 2;
            while (i < content.length && !(content[i] === '*' && content[i+1] === '/')) i++;
            i++;
            continue;
        }
    }

    if (char === '{') { braces++; stack.push('{'); }
    else if (char === '}') { braces--; if (stack.length) stack.pop(); }
    else if (char === '"' || char === "'") stack.push(char);
    else if (char === '`') stack.push(char);
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
}

console.log(`Braces: ${braces}`);
console.log(`Parens: ${parens}`);
console.log(`Brackets: ${brackets}`);
console.log(`Stack: ${JSON.stringify(stack)}`);
