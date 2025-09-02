// Add sample tags and contexts to entries for testing search functionality
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZmtmaHNwZmpmY2hkaWtuYXl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgyNDEyNCwiZXhwIjoyMDcyNDAwMTI0fQ.KJ9K-sH4YeyRLWB8qohR1VGviSFAnbGDb0BQ394Zvxw";

async function addTagsToEntries() {
  const fetch = require('node-fetch');
  
  console.log('🏷️ Adding sample tags to entries for demo purposes...');
  
  // Get entries that don't have tags yet
  const response = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entries?limit=20', {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  
  const entries = await response.json();
  console.log(`Found ${entries.length} entries to add demo tags to`);
  
  let tagsCreated = 0;
  let linksCreated = 0;
  
  for (const entry of entries) {
    const tags = [];
    const contexts = [];
    
    // Add tags based on content analysis
    const content = entry.content.toLowerCase();
    
    // Work-related tags
    if (content.includes('asset') || content.includes('mgmt') || content.includes('management')) {
      tags.push('work');
      tags.push('management');
      contexts.push('@office');
    }
    
    // Kitchen/cleaning tags
    if (content.includes('kitchen') || content.includes('clean')) {
      tags.push('home');
      tags.push('cleaning');
      contexts.push('@home');
    }
    
    // Event tags
    if (content.includes('birthday') || content.includes('event') || content.includes('party')) {
      tags.push('social');
      tags.push('celebration');
      contexts.push('@calendar');
    }
    
    // Important/priority tags
    if (content.includes('important') || content.includes('priority') || entry.type === 'task') {
      tags.push('priority');
      if (entry.type === 'task') contexts.push('@action');
    }
    
    // Research tags
    if (entry.type === 'research' || content.includes('research') || content.includes('learn')) {
      tags.push('research');
      tags.push('learning');
      contexts.push('@study');
    }
    
    // Garden/outdoor tags  
    if (content.includes('blumen') || content.includes('garden')) {
      tags.push('garden');
      tags.push('outdoor');
      contexts.push('@yard');
    }
    
    // Add some general categorization
    if (entry.type === 'note') {
      tags.push('notes');
      contexts.push('@inbox');
    } else if (entry.type === 'event') {
      contexts.push('@calendar');
    } else if (entry.type === 'memory') {
      tags.push('memories');
      contexts.push('@personal');
    }
    
    // Ensure we have at least one tag for demo purposes
    if (tags.length === 0) {
      tags.push('general');
    }
    if (contexts.length === 0) {
      contexts.push('@misc');
    }
    
    console.log(`Entry "${entry.content.substring(0, 30)}..." → tags: ${tags.join(', ')} | contexts: ${contexts.join(', ')}`);
    
    // Create tags in database and link them
    const allTagsAndContexts = [
      ...tags.map(t => ({ name: t, type: 'tag' })),
      ...contexts.map(c => ({ name: c, type: 'context' }))
    ];
    
    for (const tagInfo of allTagsAndContexts) {
      // Check if tag exists
      const existingTag = await fetch(
        `https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/tags?guest_user_id=eq.${entry.guest_user_id}&name=eq.${encodeURIComponent(tagInfo.name)}&type=eq.${tagInfo.type}&select=id`,
        {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        }
      ).then(r => r.json());
      
      let tagId;
      if (existingTag.length === 0) {
        // Create tag
        const newTag = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/tags', {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            guest_user_id: entry.guest_user_id,
            name: tagInfo.name,
            type: tagInfo.type
          })
        }).then(r => r.json());
        
        tagId = newTag[0].id;
        tagsCreated++;
        console.log(`  ✅ Created ${tagInfo.type}: ${tagInfo.name}`);
      } else {
        tagId = existingTag[0].id;
        console.log(`  📋 Exists ${tagInfo.type}: ${tagInfo.name}`);
      }
      
      // Link tag to entry (check if link already exists)
      const existingLink = await fetch(
        `https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entry_tags?entry_id=eq.${entry.id}&tag_id=eq.${tagId}`,
        {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        }
      ).then(r => r.json());
      
      if (existingLink.length === 0) {
        await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entry_tags', {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entry_id: entry.id,
            tag_id: tagId
          })
        });
        linksCreated++;
        console.log(`  🔗 Linked ${tagInfo.name} to entry`);
      }
    }
  }
  
  // Get final counts
  const finalTagCount = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/tags?select=count', {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'count=exact'
    }
  }).then(r => r.json());
  
  const finalLinkCount = await fetch('https://msfkfhspfjfchdiknayx.supabase.co/rest/v1/entry_tags?select=count', {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'count=exact'
    }
  }).then(r => r.json());
  
  console.log('\n🎉 Sample tags added successfully!');
  console.log(`📊 Stats:`);
  console.log(`  - New tags created: ${tagsCreated}`);
  console.log(`  - New links created: ${linksCreated}`);
  console.log(`  - Total tags in database: ${finalTagCount[0].count}`);
  console.log(`  - Total entry-tag links: ${finalLinkCount[0].count}`);
  console.log('\n🔍 Now you can test search functionality with these tags:');
  console.log('  - Search "work" → work-related entries');
  console.log('  - Search "home" → home/cleaning entries'); 
  console.log('  - Search "social" → birthday/event entries');
  console.log('  - Search "@office" → work context entries');
  console.log('  - Search "@home" → home context entries');
}

addTagsToEntries().catch(console.error);