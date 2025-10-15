const fs = require('fs');
const path = require('path');

// Read the questions file
const questionsPath = path.join(__dirname, '../src/lib/assessment/questions.ts');
let content = fs.readFileSync(questionsPath, 'utf8');

// Split content into lines for easier processing
const lines = content.split('\n');
const updatedLines = [];
let inOptionsArray = false;
let optionsStartIndex = -1;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're starting an options array
  if (line.trim().startsWith('options: [')) {
    inOptionsArray = true;
    optionsStartIndex = i;
    braceCount = 1;
    updatedLines.push(line);
    continue;
  }
  
  // If we're in an options array, count braces
  if (inOptionsArray) {
    // Count opening and closing braces
    for (const char of line) {
      if (char === '[') braceCount++;
      if (char === ']') braceCount--;
    }
    
    // If we've closed all braces, we're at the end of the options array
    if (braceCount === 0) {
      // Check if the last option before closing has the "None of these" option
      const lastOptionLine = updatedLines[updatedLines.length - 1];
      const hasNoneOption = lastOptionLine && lastOptionLine.includes('None of these specifically resonate');
      
      if (!hasNoneOption) {
        // Add the "None of these" option before the closing bracket
        const indent = '          '; // Match the indentation
        updatedLines.push(`${indent}{ text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }`);
      }
      
      inOptionsArray = false;
      optionsStartIndex = -1;
    }
    
    updatedLines.push(line);
  } else {
    updatedLines.push(line);
  }
}

// Write the updated content back to the file
const updatedContent = updatedLines.join('\n');
fs.writeFileSync(questionsPath, updatedContent, 'utf8');

console.log('✅ Added "None of these specifically resonate" option to all questions');
console.log('📊 Updated questions file with custom response options');
