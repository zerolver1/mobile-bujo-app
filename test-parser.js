#!/usr/bin/env node

/**
 * Test the Enhanced BuJo Parser with various bullet journal formats
 */

// Mock the required modules for testing
const testTexts = {
  traditionalBullets: `
    15th
    • Pick up library book on hold
    o Amy for lunch @ 11:30 am
    - Make summer bucket list
    = Started watching Vikings finally
    x Completed morning workout
    > Migrate project review to next week
    < Schedule dentist appointment
    
    16th
    * 100% for UNC tickets
    O Team meeting @ 2pm
    - Review Q3 goals
    
    17th
    o OT @ 3pm
    • dinner at Mellow w/ Carter's @ 5:30pm
    - finish Friday's blog post
    = Sam said, "Mom, I can't be quiet. I'm a talking"
  `,
  
  ocrMisreads: `
    March 15
    0 Doctor appointment @ 9am
    - Call insurance company
    * Pick up prescription
    = Note: Remember to fast before blood work
    x Filed taxes
    > Move budget review
    
    March 16
    O Lunch with Sarah @ noon
    • Grocery shopping
    - Buy birthday gift for Mom
  `,
  
  naturalLanguage: `
    Today
    Pick up dry cleaning
    Meeting with client @ 3:30pm
    100% completed project proposal
    Started reading Atomic Habits
    Finish expense report !!
    Call mom #family @home
    Review code changes
  `,
  
  yourExample: `
    15th
    Pick up library book on hold
    Amy for lunch @ 11:30 am
    Make summer bucket list
    Started watching Vikings finally
    
    16th
    100% for UNC tickets
    
    17th
    OT @ 3pm
    dinner at Mellow w/ Carter's @ 5:30pm
    finish Friday's blog post
    Sam said, "Mom, I can't be quiet. I'm a talking"
  `
};

// Simple parser simulation
function parseText(text, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Testing: ${label}`);
  console.log(`${'='.repeat(60)}`);
  
  const lines = text.trim().split('\n').filter(line => line.trim());
  let currentDate = null;
  let entryCount = { task: 0, event: 0, note: 0, completed: 0, migrated: 0, scheduled: 0 };
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check for date headers
    if (/^\d{1,2}(st|nd|rd|th)?$/.test(trimmed)) {
      currentDate = trimmed;
      console.log(`\n📅 Date: ${currentDate}`);
      return;
    }
    
    // Check for bullet types
    if (/^[\•\-\*·∙⋅‧]/.test(trimmed)) {
      console.log(`  📌 Task: ${trimmed}`);
      entryCount.task++;
    } else if (/^[xX✓✔×]/.test(trimmed)) {
      console.log(`  ✅ Completed: ${trimmed}`);
      entryCount.completed++;
    } else if (/^[>→➜]/.test(trimmed)) {
      console.log(`  ➡️ Migrated: ${trimmed}`);
      entryCount.migrated++;
    } else if (/^[<←⬅]/.test(trimmed)) {
      console.log(`  📆 Scheduled: ${trimmed}`);
      entryCount.scheduled++;
    } else if (/^[○◦oO0Ø]/.test(trimmed)) {
      console.log(`  🎯 Event: ${trimmed}`);
      entryCount.event++;
    } else if (/^[—–\-=_]/.test(trimmed)) {
      console.log(`  📝 Note: ${trimmed}`);
      entryCount.note++;
    } else if (/@\s*\d{1,2}:\d{2}/.test(trimmed)) {
      console.log(`  🎯 Event (natural): ${trimmed}`);
      entryCount.event++;
    } else if (/^(pick up|make|finish|start|buy|call)/i.test(trimmed)) {
      console.log(`  📌 Task (natural): ${trimmed}`);
      entryCount.task++;
    } else if (/\d{1,2}%/.test(trimmed)) {
      const isComplete = /100%/.test(trimmed);
      console.log(`  ${isComplete ? '✅' : '📌'} Task (${trimmed.match(/\d+%/)[0]}): ${trimmed}`);
      isComplete ? entryCount.completed++ : entryCount.task++;
    } else {
      console.log(`  📝 Note (natural): ${trimmed}`);
      entryCount.note++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Tasks: ${entryCount.task}`);
  console.log(`  Events: ${entryCount.event}`);
  console.log(`  Notes: ${entryCount.note}`);
  console.log(`  Completed: ${entryCount.completed}`);
  console.log(`  Migrated: ${entryCount.migrated}`);
  console.log(`  Scheduled: ${entryCount.scheduled}`);
  console.log(`  Total: ${Object.values(entryCount).reduce((a, b) => a + b, 0)}`);
}

// Run tests
console.log('🚀 Enhanced BuJo Parser Test Suite\n');
console.log('This demonstrates how the parser handles various bullet formats');
console.log('including traditional bullets, OCR misreads, and natural language.\n');

Object.entries(testTexts).forEach(([key, text]) => {
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  parseText(text, label);
});

console.log(`\n${'='.repeat(60)}`);
console.log('✨ Key Features:');
console.log('  • Recognizes traditional bullet symbols (•, -, o, x, >, <, =)');
console.log('  • Handles OCR variations (0 for o, * for •, etc.)');
console.log('  • Parses natural language (appointments @ time)');
console.log('  • Identifies action verbs (pick up, make, finish)');
console.log('  • Detects percentage completion (100% = complete)');
console.log('  • Extracts date headers as context');
console.log(`${'='.repeat(60)}\n`);