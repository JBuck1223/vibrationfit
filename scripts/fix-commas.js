const fs = require('fs');
const path = require('path');

// Read the questions file
const questionsPath = path.join(__dirname, '../src/lib/assessment/questions.ts');
let content = fs.readFileSync(questionsPath, 'utf8');

// Fix missing commas before "None of these specifically resonate" lines
// Pattern: } followed by newline and spaces, then { text: 'None of these specifically resonate'
const fixedContent = content.replace(
  /}\s*\n\s*\{\s*text:\s*'None of these specifically resonate'/g,
  '},\n          { text: \'None of these specifically resonate\''
);

// Write the fixed content back to the file
fs.writeFileSync(questionsPath, fixedContent, 'utf8');

console.log('✅ Fixed missing commas before "None of these specifically resonate" options');
console.log('📊 All syntax errors should now be resolved');
