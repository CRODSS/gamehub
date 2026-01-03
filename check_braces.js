const fs = require('fs');
const content = fs.readFileSync('c:/gamehub/src/pages/DNDGamePage.tsx', 'utf8');

let brace = 0;
let paren = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') brace++;
        if (char === '}') brace--;
        if (char === '(') paren++;
        if (char === ')') paren--;
    }
    if (brace < 0) {
        console.log('Negative brace count at line ' + (i + 1));
        break;
    }
    if (paren < 0) {
        console.log('Negative paren count at line ' + (i + 1));
        break;
    }
}

if (brace !== 0) console.log('Final Brace Count: ' + brace);
if (paren !== 0) console.log('Final Paren Count: ' + paren);
