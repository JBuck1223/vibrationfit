const fs = require('fs');
const path = require('path');

// Read the questions file
const questionsPath = path.join(__dirname, '../src/lib/assessment/questions.ts');
let content = fs.readFileSync(questionsPath, 'utf8');

// Find all option arrays that don't have the "None of these" option
const optionArrayRegex = /options:\s*\[([\s\S]*?)\]/g;
let match;
let updatedContent = content;

while ((match = optionArrayRegex.exec(content)) !== null) {
  const optionsBlock = match[0];
  const optionsContent = match[1];
  
  // Check if this options array already has the "None of these" option
  if (!optionsContent.includes('None of these specifically resonate')) {
    // Find the last option in the array
    const lastOptionRegex = /(\s*\{\s*text:\s*'[^']*',\s*value:\s*[0-9]+,\s*emoji:\s*'[^']*',\s*greenLine:\s*'[^']*'\s*\})\s*\]/;
    const lastOptionMatch = optionsContent.match(lastOptionRegex);
    
    if (lastOptionMatch) {
      const lastOption = lastOptionMatch[1];
      const newOptionsBlock = optionsBlock.replace(
        lastOption,
        lastOption + ',\n          { text: \'None of these specifically resonate\', value: 0, emoji: \'🤔\', greenLine: \'neutral\', isCustom: true }'
      );
      
      updatedContent = updatedContent.replace(optionsBlock, newOptionsBlock);
    }
  }
}

// Write the updated content back to the file
fs.writeFileSync(questionsPath, updatedContent, 'utf8');

console.log('✅ Added "None of these specifically resonate" option to all questions');
console.log('📊 Updated questions file with custom response options');
