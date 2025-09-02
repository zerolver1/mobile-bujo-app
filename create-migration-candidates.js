// Create some migration candidates (incomplete tasks from past dates) for testing
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZmtmaHNwZmpmY2hkaWtuYXl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgyNDEyNCwiZXhwIjoyMDcyNDAwMTI0fQ.KJ9K-sH4YeyRLWB8qohR1VGviSFAnbGDb0BQ394Zvxw";

async function createMigrationCandidates() {
  const fetch = require('node-fetch');
  
  console.log('📋 Creating migration candidates for demo purposes...');
  
  // Get current guest user
  const guestUsers = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/guest_users?limit=1', {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  }).then(r => r.json());
  
  if (guestUsers.length === 0) {
    console.log('❌ No guest user found');
    return;
  }
  
  const guestUserId = guestUsers[0].id;
  console.log(`📱 Using guest user: ${guestUserId}`);
  
  // Create some collections for past dates
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const pastDates = [
    { date: yesterday, label: 'Yesterday' },
    { date: threeDaysAgo, label: '3 days ago' },
    { date: oneWeekAgo, label: '1 week ago' }
  ];
  
  let candidatesCreated = 0;
  
  for (const pastDate of pastDates) {
    const dateStr = pastDate.date.toISOString().split('T')[0];
    
    console.log(`\n📅 Creating entries for ${pastDate.label} (${dateStr})`);
    
    // Create daily collection for this date
    const collectionId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/collections', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: collectionId,
        guest_user_id: guestUserId,
        type: 'daily',
        collection_date: dateStr,
        smart_match: true,
        is_archived: false
      })
    });
    
    console.log(`  📂 Created collection for ${dateStr}`);
    
    // Create incomplete tasks for this date
    const incompleteTasks = [
      { content: '📧 Reply to important emails', priority: 'high' },
      { content: '🛒 Buy groceries for dinner', priority: 'medium' },
      { content: '📱 Call dentist to schedule appointment', priority: 'low' },
      { content: '🧹 Clean bathroom thoroughly', priority: 'low' },
      { content: '📚 Read 30 minutes of current book', priority: 'medium' }
    ];
    
    if (pastDate.label === '1 week ago') {
      // Add more urgent tasks for older dates
      incompleteTasks.push(
        { content: '💳 Pay monthly credit card bill', priority: 'high' },
        { content: '🔧 Fix squeaky door hinge', priority: 'low' },
        { content: '🎁 Buy birthday gift for mom', priority: 'high' }
      );
    }
    
    for (const task of incompleteTasks) {
      const entryId = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entries', {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: entryId,
          guest_user_id: guestUserId,
          collection_id: collectionId,
          type: 'task',
          content: task.content,
          status: 'incomplete', // This makes it a migration candidate
          priority: task.priority,
          is_priority: task.priority !== 'none',
          collection_date: dateStr,
          source: 'manual',
          created_at: pastDate.date.toISOString(),
          updated_at: pastDate.date.toISOString()
        })
      });
      
      candidatesCreated++;
      console.log(`    ✅ Created: ${task.content}`);
    }
  }
  
  // Add tags to some migration candidates
  console.log('\n🏷️ Adding tags to migration candidates...');
  
  const migrationCandidates = await fetch(
    'https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entries?status=eq.incomplete&type=eq.task&order=created_at.desc&limit=5',
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    }
  ).then(r => r.json());
  
  // Add "urgent" tag to high priority items
  for (const entry of migrationCandidates) {
    if (entry.priority === 'high') {
      // Create urgent tag if it doesn't exist
      let urgentTag = await fetch(
        `https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/tags?guest_user_id=eq.${guestUserId}&name=eq.urgent&type=eq.tag&select=id`,
        {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        }
      ).then(r => r.json());
      
      if (urgentTag.length === 0) {
        const newTag = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/tags', {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            guest_user_id: guestUserId,
            name: 'urgent',
            type: 'tag'
          })
        }).then(r => r.json());
        
        urgentTag = [newTag[0]];
        console.log('  📍 Created "urgent" tag');
      }
      
      // Link urgent tag to entry
      await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entry_tags', {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entry_id: entry.id,
          tag_id: urgentTag[0].id
        })
      });
      
      console.log(`  🔗 Tagged "${entry.content.substring(0, 30)}..." as urgent`);
    }
  }
  
  console.log(`\n🎉 Migration candidates created successfully!`);
  console.log(`📊 Created ${candidatesCreated} incomplete tasks from past dates`);
  console.log('\n🔄 Now you can test migration functionality:');
  console.log('  - Navigate to Settings → Migration Review');
  console.log('  - See incomplete tasks from past dates');
  console.log('  - Test bulk migration, completion, and cancellation');
  console.log('  - View migration statistics and overdue indicators');
}

createMigrationCandidates().catch(console.error);