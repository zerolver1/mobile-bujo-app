import { Platform } from 'react-native';
import { supabase, features } from './client';
import { Database } from './types';
import { BuJoEntry, BuJoCollection, PageScan, CustomSignifier } from '../../types/BuJo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBuJoStore } from '../../stores/BuJoStore';

type Tables = Database['public']['Tables'];

// Generate proper UUID v4 for database compatibility
const generateId = () => {
  // Simple UUID v4 generation for React Native
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class BuJoSyncService {
  private userId: string | null = null;
  private guestUserId: string | null = null;
  private isGuestMode: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!supabase || !features.cloudSync) {
      console.log('Cloud sync disabled or Supabase not configured');
      return;
    }

    // Get current user (Clerk/Supabase auth)
    const user = await this.getCurrentUser();
    if (user) {
      // Authenticated user
      this.userId = user.id;
      this.isGuestMode = false;
      this.guestUserId = null;
      await this.ensureUserProfile();
      this.startAutoSync();
    } else {
      // Guest user
      await this.initializeGuestUser();
      this.startAutoSync();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User just authenticated - migrate guest data if exists
        const oldGuestId = this.guestUserId;
        
        this.userId = session.user.id;
        this.isGuestMode = false;
        await this.ensureUserProfile();
        
        // Migrate guest data to authenticated user
        if (oldGuestId) {
          await this.migrateGuestData(oldGuestId, session.user.id);
        }
        
        this.startAutoSync();
      } else if (event === 'SIGNED_OUT') {
        // User signed out - switch to guest mode
        this.userId = null;
        await this.initializeGuestUser();
        this.startAutoSync();
      }
    });
  }

  private async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Initialize guest user
  private async initializeGuestUser() {
    if (!supabase) return;

    // Try to get existing guest ID from local storage
    const existingGuestId = await AsyncStorage.getItem('guest-user-id');
    
    if (existingGuestId) {
      // Verify guest exists in database
      const { data: guest, error } = await supabase
        .from('guest_users')
        .select('id')
        .eq('id', existingGuestId)
        .single();
        
      if (!error && guest) {
        this.guestUserId = existingGuestId;
        this.isGuestMode = true;
        console.log('🎭 Using existing guest user:', existingGuestId);
        
        // Update last active
        await supabase
          .from('guest_users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existingGuestId);
        
        return;
      }
    }

    // Create new guest user
    console.log('🎭 Creating new guest user...');
    const { data, error } = await supabase
      .rpc('create_guest_user', {
        p_device_id: await this.getDeviceId(),
        p_platform: Platform.OS,
      });

    if (error) {
      console.error('Failed to create guest user:', error);
      return;
    }

    this.guestUserId = data;
    this.isGuestMode = true;
    await AsyncStorage.setItem('guest-user-id', data);
    console.log('✅ Guest user created:', data);
  }

  // Migrate guest data to authenticated user
  private async migrateGuestData(guestUserId: string, authUserId: string) {
    if (!supabase) return;

    console.log('🔄 Migrating guest data to authenticated user...');
    
    const { data: success, error } = await supabase
      .rpc('migrate_guest_to_user', {
        p_guest_user_id: guestUserId,
        p_auth_user_id: authUserId,
      });

    if (error) {
      console.error('Failed to migrate guest data:', error);
    } else if (success) {
      console.log('✅ Guest data migrated successfully');
      // Clear guest ID from storage
      await AsyncStorage.removeItem('guest-user-id');
      this.guestUserId = null;
    }
  }

  // Get device ID for guest users
  private async getDeviceId(): Promise<string> {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem('device-id');
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem('device-id', deviceId);
    }
    
    return deviceId;
  }

  // Get user fields for database operations
  private getUserFields() {
    if (this.isGuestMode && this.guestUserId) {
      return {
        user_id: null,
        guest_user_id: this.guestUserId,
      };
    } else if (this.userId) {
      return {
        user_id: this.userId,
        guest_user_id: null,
      };
    }
    throw new Error('No user or guest ID available');
  }

  // Get where clause for queries
  private getUserWhereClause() {
    if (this.isGuestMode && this.guestUserId) {
      return { guest_user_id: this.guestUserId };
    } else if (this.userId) {
      return { user_id: this.userId };
    }
    throw new Error('No user or guest ID available');
  }

  private async ensureUserProfile() {
    if (!supabase || !this.userId) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      await supabase.from('profiles').insert({
        id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Start auto-sync interval
  private startAutoSync() {
    if (!features.cloudSync || this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, features.syncInterval);

    // Initial sync
    this.syncAll();
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Main sync orchestrator
  async syncAll() {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId || this.isSyncing || !features.cloudSync) return;

    this.isSyncing = true;
    console.log('Starting BuJo sync...');

    try {
      // Process offline queue first
      await this.processOfflineQueue();

      // Sync each entity type
      await this.syncCollections();
      await this.createMissingCollections(); // Create collections for orphaned entries
      await this.syncEntries();
      await this.syncCustomSignifiers();
      await this.syncPageScans();

      // Update last sync timestamp
      await this.updateLastSyncTime();

      console.log('BuJo sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Process offline queue
  private async processOfflineQueue() {
    if (!supabase || !this.userId) return;

    const { data: queueItems, error } = await supabase
      .from('sync_queue')
      .select('*')
      .eq('user_id', this.userId)
      .eq('synced', false)
      .order('created_at', { ascending: true });

    if (error || !queueItems) return;

    for (const item of queueItems) {
      try {
        await this.processSyncQueueItem(item);
        
        // Mark as synced
        await supabase
          .from('sync_queue')
          .update({ 
            synced: true, 
            synced_at: new Date().toISOString() 
          })
          .eq('id', item.id);
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        
        // Increment retry count
        await supabase
          .from('sync_queue')
          .update({ 
            sync_attempts: item.sync_attempts + 1,
            error_message: String(error)
          })
          .eq('id', item.id);
      }
    }
  }

  private async processSyncQueueItem(item: any) {
    if (!supabase) return;

    const { operation, table_name, record_id, payload } = item;

    switch (operation) {
      case 'create':
        await supabase.from(table_name).insert(payload);
        break;
      case 'update':
        await supabase.from(table_name).update(payload).eq('id', record_id);
        break;
      case 'delete':
        await supabase.from(table_name).delete().eq('id', record_id);
        break;
    }
  }

  // Sync Collections
  private async syncCollections() {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    // Get local collections from BuJoStore
    const { collections: localCollections } = useBuJoStore.getState();

    // Get remote collections (use guest_user_id for guest users, user_id for authenticated users)
    const { data: remoteCollections, error } = this.isGuestMode && this.guestUserId
      ? await supabase
          .from('collections')
          .select('*')
          .eq('guest_user_id', this.guestUserId)
      : await supabase
          .from('collections')
          .select('*')
          .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote collections:', error);
      return;
    }

    // Merge and resolve conflicts
    const mergedCollections = await this.mergeCollections(localCollections, remoteCollections || []);

    // Update local storage
    await AsyncStorage.setItem('bujo-collections', JSON.stringify(mergedCollections));

    // Update remote if needed
    for (const collection of mergedCollections) {
      await this.upsertCollection(collection);
    }
  }

  private async mergeCollections(
    local: BuJoCollection[], 
    remote: Tables['collections']['Row'][]
  ): Promise<BuJoCollection[]> {
    const merged = new Map<string, BuJoCollection>();

    // Add remote collections first (server as source of truth)
    for (const remoteCol of remote) {
      merged.set(remoteCol.id, this.convertRemoteToLocalCollection(remoteCol));
    }

    // Add local collections that don't exist remotely
    for (const localCol of local) {
      if (!merged.has(localCol.id)) {
        merged.set(localCol.id, localCol);
      } else {
        // Conflict resolution: compare timestamps
        const remoteCol = merged.get(localCol.id)!;
        if (new Date(localCol.modifiedAt) > new Date(remoteCol.modifiedAt)) {
          merged.set(localCol.id, localCol);
        }
      }
    }

    return Array.from(merged.values());
  }

  private convertRemoteToLocalCollection(remote: Tables['collections']['Row']): BuJoCollection {
    return {
      id: remote.id,
      type: remote.type,
      date: remote.collection_date,
      name: remote.name || undefined,
      description: remote.description || undefined,
      color: remote.color || undefined,
      entries: [], // Will be populated separately
      entryIds: [],
      smartMatch: remote.smart_match,
      createdAt: new Date(remote.created_at),
      modifiedAt: new Date(remote.updated_at),
    };
  }

  private async upsertCollection(collection: BuJoCollection) {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    const data: Tables['collections']['Insert'] = this.isGuestMode && this.guestUserId
      ? {
          id: collection.id,
          guest_user_id: this.guestUserId,
          type: collection.type,
          collection_date: collection.date,
          name: collection.name || null,
          description: collection.description || null,
          color: collection.color || null,
          smart_match: collection.smartMatch || true,
          is_archived: false,
        }
      : {
          id: collection.id,
          user_id: this.userId,
          type: collection.type,
          collection_date: collection.date,
          name: collection.name || null,
          description: collection.description || null,
          color: collection.color || null,
          smart_match: collection.smartMatch || true,
          is_archived: false,
        };

    const { error } = await supabase
      .from('collections')
      .upsert(data, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting collection:', error);
    } else {
      console.log(`✅ Collection uploaded to Supabase: ${collection.type} for ${collection.date}`);
    }
  }

  // Create missing collections based on entries that reference them
  private async createMissingCollections() {
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    // Get data from BuJoStore instead of AsyncStorage
    const { entries: localEntries, collections: localCollections, addCollection } = useBuJoStore.getState();

    console.log(`🔍 Found ${localEntries.length} entries and ${localCollections.length} collections`);

    // Group entries by collection type and date
    const requiredCollections = new Map();
    
    for (const entry of localEntries) {
      const collectionType = entry.collection || 'daily';
      const collectionDate = entry.collectionDate;
      const key = `${collectionType}-${collectionDate}`;
      
      if (!requiredCollections.has(key)) {
        // Check if collection already exists locally
        const exists = localCollections.some(c => 
          c.type === collectionType && c.date === collectionDate
        );
        
        if (!exists) {
          requiredCollections.set(key, {
            type: collectionType,
            date: collectionDate,
            entries: []
          });
        }
      }
      
      if (requiredCollections.has(key)) {
        requiredCollections.get(key).entries.push(entry.id);
      }
    }

    console.log(`📋 Creating ${requiredCollections.size} missing collections`);

    // Create missing collections
    for (const [key, collectionInfo] of requiredCollections) {
      const newCollection: BuJoCollection = {
        id: generateId(), // Generate proper UUID
        type: collectionInfo.type,
        date: collectionInfo.date,
        title: `${collectionInfo.type.charAt(0).toUpperCase() + collectionInfo.type.slice(1)} Log`,
        description: `Auto-created collection for ${collectionInfo.date}`,
        entries: [], // Initialize empty entries array
        entryIds: collectionInfo.entries,
        smartMatch: true,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      // Add to BuJoStore using the addCollection action
      addCollection(newCollection);
      console.log(`✅ Created collection locally: ${collectionInfo.type} for ${collectionInfo.date}`);

      // Upload to Supabase
      await this.upsertCollection(newCollection);
    }

    if (requiredCollections.size > 0) {
      console.log(`💾 Added ${requiredCollections.size} collections to BuJoStore and uploaded to Supabase`);
    }
  }

  // Sync Entries
  private async syncEntries() {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    // Get local entries from BuJoStore
    const { entries: localEntries } = useBuJoStore.getState();

    // Get remote entries (use guest_user_id for guest users, user_id for authenticated users)
    const { data: remoteEntries, error } = this.isGuestMode && this.guestUserId
      ? await supabase
          .from('entries')
          .select('*')
          .eq('guest_user_id', this.guestUserId)
      : await supabase
          .from('entries')
          .select('*')
          .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote entries:', error);
      return;
    }

    // Merge and resolve conflicts
    const mergedEntries = await this.mergeEntries(localEntries, remoteEntries || []);

    // Update local storage
    await AsyncStorage.setItem('bujo-entries', JSON.stringify(mergedEntries));

    // Update remote
    for (const entry of mergedEntries) {
      await this.upsertEntry(entry);
    }
  }

  private async mergeEntries(
    local: BuJoEntry[], 
    remote: Tables['entries']['Row'][]
  ): Promise<BuJoEntry[]> {
    const merged = new Map<string, BuJoEntry>();

    // Convert and add remote entries
    for (const remoteEntry of remote) {
      merged.set(remoteEntry.id, await this.convertRemoteToLocalEntry(remoteEntry));
    }

    // Process local entries
    for (const localEntry of local) {
      if (!merged.has(localEntry.id)) {
        merged.set(localEntry.id, localEntry);
      } else {
        // Conflict resolution based on last sync
        const remoteEntry = merged.get(localEntry.id)!;
        if (localEntry.lastSyncAt && remoteEntry.lastSyncAt) {
          if (new Date(localEntry.lastSyncAt) > new Date(remoteEntry.lastSyncAt)) {
            merged.set(localEntry.id, localEntry);
          }
        }
      }
    }

    return Array.from(merged.values());
  }

  private async convertRemoteToLocalEntry(remote: Tables['entries']['Row']): Promise<BuJoEntry> {
    // Get tags for this entry
    const tags = await this.getEntryTags(remote.id);
    const contexts = tags.filter(t => t.startsWith('@'));
    const hashtags = tags.filter(t => t.startsWith('#'));

    return {
      id: remote.id,
      type: remote.type as BuJoEntry['type'],
      content: remote.content,
      status: remote.status as BuJoEntry['status'],
      priority: remote.priority as BuJoEntry['priority'],
      createdAt: new Date(remote.created_at),
      dueDate: remote.due_date ? new Date(remote.due_date) : undefined,
      scheduledDate: remote.scheduled_date ? new Date(remote.scheduled_date) : undefined,
      tags: hashtags.map(t => t.substring(1)),
      contexts: contexts.map(c => c.substring(1)),
      collection: remote.collection_id ? 'custom' : 'daily',
      collectionDate: remote.collection_date,
      ocrConfidence: remote.ocr_confidence || undefined,
      lastSyncAt: new Date(remote.updated_at),
    };
  }

  private async getEntryTags(entryId: string): Promise<string[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('entry_tags')
      .select('tag_id, tags(name, type)')
      .eq('entry_id', entryId);

    if (error || !data) return [];

    return data.map((item: any) => {
      const tag = item.tags;
      return tag.type === 'context' ? `@${tag.name}` : `#${tag.name}`;
    });
  }

  private async upsertEntry(entry: BuJoEntry) {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    // Find collection ID
    const collectionId = await this.findCollectionId(entry.collectionDate, entry.collection);

    // Check if entry exists to determine if this is an update
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entry.id)
      .single();

    const data: Tables['entries']['Insert'] = this.isGuestMode && this.guestUserId
      ? {
          id: entry.id,
          guest_user_id: this.guestUserId,
          collection_id: collectionId,
          type: entry.type === 'inspiration' ? 'idea' : entry.type as any,
          content: entry.content,
          status: entry.status as any,
          priority: entry.priority as any,
          is_priority: entry.priority !== 'none',
          collection_date: entry.collectionDate,
          due_date: entry.dueDate ? (entry.dueDate instanceof Date ? entry.dueDate : new Date(entry.dueDate)).toISOString().split('T')[0] : null,
          scheduled_date: entry.scheduledDate ? (entry.scheduledDate instanceof Date ? entry.scheduledDate : new Date(entry.scheduledDate)).toISOString().split('T')[0] : null,
          source: 'manual',
          ocr_confidence: entry.ocrConfidence || null,
        }
      : {
          id: entry.id,
          user_id: this.userId,
          collection_id: collectionId,
          type: entry.type === 'inspiration' ? 'idea' : entry.type as any,
          content: entry.content,
          status: entry.status as any,
          priority: entry.priority as any,
          is_priority: entry.priority !== 'none',
          collection_date: entry.collectionDate,
          due_date: entry.dueDate ? (entry.dueDate instanceof Date ? entry.dueDate : new Date(entry.dueDate)).toISOString().split('T')[0] : null,
          scheduled_date: entry.scheduledDate ? (entry.scheduledDate instanceof Date ? entry.scheduledDate : new Date(entry.scheduledDate)).toISOString().split('T')[0] : null,
          source: 'manual',
          ocr_confidence: entry.ocrConfidence || null,
        };

    const { error } = await supabase
      .from('entries')
      .upsert(data, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting entry:', error);
    } else {
      console.log(`✅ Entry uploaded to Supabase: ${entry.type} - ${entry.content.substring(0, 50)}...`);
      // Sync tags
      await this.syncEntryTags(entry);
      
      // Track transition if this was an update
      // Sync tags
      await this.syncEntryTags(entry);
      
      // Track transition if this was an update
      if (existingEntry) {
        await this.trackEntryTransition(existingEntry, entry);
      }
    }
  }

  // Track entry transitions for iOS sync
  private async trackEntryTransition(oldEntry: any, newEntry: BuJoEntry) {
    if (!supabase || !this.userId) return;

    // Determine transition type
    let transitionType = 'edited';
    
    if (oldEntry.status !== newEntry.status) {
      switch (newEntry.status) {
        case 'complete': transitionType = 'completed'; break;
        case 'cancelled': transitionType = 'cancelled'; break;
        case 'migrated': transitionType = 'migrated'; break;
        case 'scheduled': transitionType = 'scheduled'; break;
        default: transitionType = 'edited';
      }
    } else if (oldEntry.type !== newEntry.type) {
      transitionType = 'converted';
    } else if (oldEntry.collection_date !== newEntry.collectionDate) {
      transitionType = 'moved';
    }

    // Record the transition (the trigger will handle most of this automatically)
    // But we can add additional metadata here
    const { error } = await supabase
      .from('entry_transitions')
      .insert({
        user_id: this.userId,
        entry_id: newEntry.id,
        transition_type: transitionType,
        from_state: oldEntry,
        to_state: newEntry,
        from_status: oldEntry.status,
        to_status: newEntry.status,
        from_type: oldEntry.type,
        to_type: newEntry.type,
        from_collection_date: oldEntry.collection_date,
        to_collection_date: newEntry.collectionDate,
        transition_reason: 'sync',
        device_info: {
          platform: 'react-native',
          syncService: 'BuJoSyncService',
        },
      });

    if (error) {
      console.error('Error tracking transition:', error);
    }
  }

  private async findCollectionId(date: string, type: string): Promise<string | null> {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return null;

    const { data, error } = this.isGuestMode && this.guestUserId
      ? await supabase
          .from('collections')
          .select('id')
          .eq('guest_user_id', this.guestUserId)
          .eq('collection_date', date)
          .eq('type', type === 'daily' ? 'daily' : type)
          .single()
      : await supabase
          .from('collections')
          .select('id')
          .eq('user_id', this.userId)
          .eq('collection_date', date)
          .eq('type', type === 'daily' ? 'daily' : type)
          .single();

    if (error) {
      console.warn(`Collection not found for ${type} ${date}:`, error);
    }
    return data?.id || null;
  }

  private async syncEntryTags(entry: BuJoEntry) {
    // Check if we have a valid user ID (either authenticated user or guest user)  
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    // Create/get tags
    const allTags = [
      ...entry.tags.map(t => ({ name: t, type: 'tag' as const })),
      ...entry.contexts.map(c => ({ name: c, type: 'context' as const })),
    ];

    for (const tag of allTags) {
      // Ensure tag exists
      const { data: tagData } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', tag.name)
        .eq('type', tag.type)
        .single();

      let tagId = tagData?.id;

      if (!tagId) {
        // Create tag
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            user_id: this.userId,
            name: tag.name,
            type: tag.type,
          })
          .select('id')
          .single();

        tagId = newTag?.id;
      }

      if (tagId) {
        // Link tag to entry
        await supabase
          .from('entry_tags')
          .upsert({
            entry_id: entry.id,
            tag_id: tagId,
          }, { onConflict: 'entry_id,tag_id' });
      }
    }
  }

  // Sync Custom Signifiers
  private async syncCustomSignifiers() {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    const localData = await AsyncStorage.getItem('bujo-custom-signifiers');
    const localSignifiers: CustomSignifier[] = localData ? JSON.parse(localData) : [];

    // Get remote signifiers (use guest_user_id for guest users, user_id for authenticated users)
    const { data: remoteSignifiers, error } = this.isGuestMode && this.guestUserId
      ? await supabase
          .from('custom_signifiers')
          .select('*')
          .eq('guest_user_id', this.guestUserId)
      : await supabase
          .from('custom_signifiers')
          .select('*')
          .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching custom signifiers:', error);
      return;
    }

    // Simple merge - remote wins
    const merged = [...(remoteSignifiers || [])];
    
    // Add local signifiers that don't exist remotely
    for (const local of localSignifiers) {
      if (!merged.find(r => r.id === local.id)) {
        await supabase.from('custom_signifiers').insert({
          id: local.id,
          user_id: this.userId,
          symbol: local.symbol,
          label: local.label,
          description: local.description || null,
          color: local.color || null,
        });
      }
    }
  }

  // Sync Page Scans
  private async syncPageScans() {
    // Check if we have a valid user ID (either authenticated user or guest user)
    const hasValidUserId = this.userId || (this.isGuestMode && this.guestUserId);
    if (!supabase || !hasValidUserId) return;

    const localData = await AsyncStorage.getItem('bujo-page-scans');
    const localScans: PageScan[] = localData ? JSON.parse(localData) : [];

    // Get remote scans (use guest_user_id for guest users, user_id for authenticated users)
    const { data: remoteScans, error } = this.isGuestMode && this.guestUserId
      ? await supabase
          .from('page_scans')
          .select('*')
          .eq('guest_user_id', this.guestUserId)
      : await supabase
          .from('page_scans')
          .select('*')
          .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching page scans:', error);
      return;
    }

    // Upload local scans that don't exist remotely
    for (const scan of localScans) {
      const exists = remoteScans?.find(r => r.image_hash === scan.hash);
      if (!exists) {
        await this.uploadPageScan(scan);
      }
    }
  }

  private async uploadPageScan(scan: PageScan) {
    if (!supabase || !this.userId) return;

    // Note: Image upload to Supabase Storage would happen here
    // For now, we'll just sync the metadata

    await supabase.from('page_scans').insert({
      id: scan.id,
      user_id: this.userId,
      image_url: scan.imageUri, // This would be the Supabase Storage URL
      image_hash: scan.hash,
      ocr_text: scan.ocrText,
      ocr_confidence: scan.confidence,
      processed_at: scan.processedAt.toISOString(),
      processing_status: 'completed',
    });
  }

  // Update last sync timestamp
  private async updateLastSyncTime() {
    if (!supabase || !this.userId) return;

    await supabase
      .from('profiles')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', this.userId);

    await AsyncStorage.setItem('bujo-last-sync', new Date().toISOString());
  }

  // Manual sync trigger
  async manualSync() {
    return this.syncAll();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (!supabase) return false;
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Get sync status
  async getSyncStatus() {
    const lastSync = await AsyncStorage.getItem('bujo-last-sync');
    return {
      isEnabled: features.cloudSync,
      isAuthenticated: await this.isAuthenticated(),
      isSyncing: this.isSyncing,
      lastSyncAt: lastSync ? new Date(lastSync) : null,
    };
  }

  // Development helper: Upload local data without authentication (for testing)
  async uploadLocalDataForTesting() {
    if (!supabase || !features.cloudSync) {
      console.log('Supabase not available for testing');
      return false;
    }

    console.log('🧪 Testing: Uploading local BuJo data to Supabase...');

    try {
      console.log('⚠️ Skipping profile creation due to RLS - checking for existing data...');
      
      // Check if we have any existing data in Supabase (try different approaches)
      console.log('🔍 Checking Supabase data with different queries...');
      
      // Method 1: Try to count with RLS
      const { count: entryCount, error: countError } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ RLS blocked count query:', countError.message);
      } else {
        console.log('📊 Entries count (with RLS):', entryCount || 0);
      }

      // Method 2: Try to get actual data
      const { data: someEntries, error: dataError } = await supabase
        .from('entries')
        .select('id, content, type, status')
        .limit(5);
      
      if (dataError) {
        console.log('❌ RLS blocked data query:', dataError.message);
      } else {
        console.log('📊 Sample entries found:', someEntries?.length || 0);
        if (someEntries && someEntries.length > 0) {
          console.log('📋 Sample entry:', {
            id: someEntries[0].id,
            content: someEntries[0].content?.substring(0, 50) + '...',
            type: someEntries[0].type,
            status: someEntries[0].status
          });
        }
      }

      // Method 3: Check profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(5);
      
      if (profileError) {
        console.log('❌ RLS blocked profiles query:', profileError.message);
      } else {
        console.log('👥 Profiles found:', profiles?.length || 0);
        if (profiles && profiles.length > 0) {
          console.log('👤 Sample profile:', profiles[0]);
        }
      }

      console.log('📋 About to check local data and attempt upload...');
      
      // Get local data for upload
      const localData = await AsyncStorage.getItem('bujo-data');
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log('📤 Local data ready for upload:');
        console.log(`  - ${parsedData.entries?.length || 0} entries`);
        console.log(`  - ${parsedData.collections?.length || 0} collections`);
        console.log(`  - ${parsedData.scans?.length || 0} scans`);
        
        // Try to upload test data (skip profile creation due to foreign key constraints)
        console.log('🚀 Attempting direct data upload (skipping profile)...');
        
        // Use a test user ID for upload
        const timestamp = Date.now().toString(16).padStart(12, '0').slice(-12);
        const testUserId = `00000000-0000-4000-8000-${timestamp}`;
        
        // Set test user ID and upload
        const originalUserId = this.userId;
        this.userId = testUserId;
        
        try {
          console.log('📤 Starting sync of all local data...');
          await this.syncAll();
          console.log('🎉 Successfully uploaded all local data to Supabase!');
          console.log('📊 Data should now be visible in Supabase Dashboard');
        } catch (uploadError) {
          console.error('❌ Upload failed:', uploadError);
          console.log('💡 Check that RLS is disabled on all tables');
        } finally {
          this.userId = originalUserId;
        }
      }

      console.log('✅ Local data uploaded to Supabase for testing!');
      console.log('🔍 Check the tables in Supabase Dashboard now');
      
      return true;
    } catch (error) {
      console.error('❌ Test upload failed:', error);
      return false;
    }
  }

  // iOS-specific sync methods
  async syncWithiOSReminders(entry: BuJoEntry, reminderId: string) {
    if (!supabase || !this.userId) return;

    // Update iOS sync state
    await supabase
      .from('ios_sync_state')
      .upsert({
        user_id: this.userId,
        entry_id: entry.id,
        apple_reminder_id: reminderId,
        last_synced_at: new Date().toISOString(),
        sync_direction: 'to_ios',
        sync_status: 'synced',
      }, { onConflict: 'user_id,entry_id' });

    // Track the sync as a transition
    await supabase
      .from('entry_transitions')
      .insert({
        user_id: this.userId,
        entry_id: entry.id,
        transition_type: 'synced_to_reminders',
        to_state: entry,
        device_info: {
          platform: 'ios',
          appType: 'reminders',
        },
      });
  }

  async syncWithiOSCalendar(entry: BuJoEntry, eventId: string) {
    if (!supabase || !this.userId) return;

    // Update iOS sync state
    await supabase
      .from('ios_sync_state')
      .upsert({
        user_id: this.userId,
        entry_id: entry.id,
        apple_calendar_id: eventId,
        last_synced_at: new Date().toISOString(),
        sync_direction: 'to_ios',
        sync_status: 'synced',
      }, { onConflict: 'user_id,entry_id' });

    // Track the sync as a transition
    await supabase
      .from('entry_transitions')
      .insert({
        user_id: this.userId,
        entry_id: entry.id,
        transition_type: 'synced_to_calendar',
        to_state: entry,
        device_info: {
          platform: 'ios',
          appType: 'calendar',
        },
      });
  }

  // Get entry transition history
  async getEntryHistory(entryId: string) {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('entry_transitions')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entry history:', error);
      return [];
    }

    return data || [];
  }

  // Get migration chain for an entry
  async getMigrationChain(entryId: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('migration_chains')
      .select('*')
      .or(`original_entry_id.eq.${entryId},current_entry_id.eq.${entryId}`)
      .single();

    if (error) {
      console.error('Error fetching migration chain:', error);
      return null;
    }

    return data;
  }

  // Track entry migration with proper chain management
  async trackMigration(fromEntry: BuJoEntry, toDate: string) {
    if (!supabase || !this.userId) return;

    // Create new entry for the migration
    const newEntry: BuJoEntry = {
      ...fromEntry,
      id: `${fromEntry.id}-migrated-${Date.now()}`,
      collectionDate: toDate,
      status: 'migrated' as any,
      lastSyncAt: new Date(),
    };

    // Insert the new entry
    await this.upsertEntry(newEntry);

    // Check if migration chain exists
    const chain = await this.getMigrationChain(fromEntry.id);

    if (chain) {
      // Update existing chain
      await supabase
        .from('migration_chains')
        .update({
          current_entry_id: newEntry.id,
          migration_count: chain.migration_count + 1,
          migration_path: [...(chain.migration_path || []), toDate],
          updated_at: new Date().toISOString(),
        })
        .eq('chain_id', chain.chain_id);
    } else {
      // Create new chain
      await supabase
        .from('migration_chains')
        .insert({
          user_id: this.userId,
          chain_id: `chain-${Date.now()}`,
          original_entry_id: fromEntry.id,
          current_entry_id: newEntry.id,
          migration_path: [fromEntry.collectionDate, toDate],
        });
    }

    return newEntry;
  }

  // Comprehensive transition tracking for all entry-level actions
  async trackTransition(
    entryId: string,
    fromEntry: BuJoEntry,
    toEntry: BuJoEntry,
    transitionType: string,
    reason?: string,
    metadata?: any
  ) {
    if (!supabase) return;

    try {
      const userFields = this.getUserFields();
      
      const { error } = await supabase
        .from('entry_transitions')
        .insert({
          ...userFields,
          entry_id: entryId,
          transition_type: transitionType,
          from_state: fromEntry,
          to_state: toEntry,
          from_status: fromEntry.status,
          to_status: toEntry.status,
          from_type: fromEntry.type,
          to_type: toEntry.type,
          from_collection_date: fromEntry.collectionDate,
          to_collection_date: toEntry.collectionDate,
          transition_reason: reason || 'user_action',
          device_info: {
            platform: Platform.OS,
            syncService: 'BuJoSyncService',
            userAgent: 'react-native-bujo',
          },
          sync_metadata: metadata,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to track transition:', error);
      }
    } catch (error) {
      console.warn('Error tracking transition:', error);
    }
  }

  // Track simple entry action (for single-field changes)
  async trackAction(
    entryId: string,
    actionType: string,
    fromValue: any,
    toValue: any,
    reason?: string
  ) {
    if (!supabase) return;

    try {
      const userFields = this.getUserFields();
      
      const { error } = await supabase
        .from('entry_transitions')
        .insert({
          ...userFields,
          entry_id: entryId,
          transition_type: actionType,
          from_state: { [actionType]: fromValue },
          to_state: { [actionType]: toValue },
          transition_reason: reason || 'swipe_action',
          device_info: {
            platform: Platform.OS,
            syncService: 'BuJoSyncService',
            userAgent: 'react-native-bujo',
          },
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to track action:', error);
      }
    } catch (error) {
      console.warn('Error tracking action:', error);
    }
  }

  // Get transition history for an entry (for BuJo Pro insights)
  async getEntryHistory(entryId: string): Promise<any[]> {
    if (!supabase) return [];

    try {
      const whereClause = this.getUserWhereClause();
      
      const { data, error } = await supabase
        .from('entry_transitions')
        .select('*')
        .eq('entry_id', entryId)
        .match(whereClause)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to get entry history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error getting entry history:', error);
      return [];
    }
  }

  // Get all entries for cloud sync
  async getEntries(): Promise<BuJoEntry[]> {
    if (!supabase) return [];

    try {
      const whereClause = this.getUserWhereClause();
      
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .match(whereClause)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to get entries:', error);
        return [];
      }

      // Convert database entries to BuJoEntry format
      return (data || []).map(entry => ({
        id: entry.id,
        type: entry.type,
        content: entry.content,
        status: entry.status,
        priority: entry.priority || 'none',
        createdAt: new Date(entry.created_at),
        tags: entry.tags || [],
        contexts: entry.contexts || [],
        collectionDate: entry.collection_date,
        dueDate: entry.due_date ? new Date(entry.due_date) : undefined,
        scheduledDate: entry.scheduled_date ? new Date(entry.scheduled_date) : undefined,
        completedAt: entry.completed_at ? new Date(entry.completed_at) : undefined,
        collection: entry.collection || 'daily',
        lastSyncAt: entry.updated_at ? new Date(entry.updated_at) : undefined,
      }));
    } catch (error) {
      console.warn('Error getting entries:', error);
      return [];
    }
  }

  // Get all collections for cloud sync
  async getCollections(): Promise<BuJoCollection[]> {
    if (!supabase) return [];

    try {
      const whereClause = this.getUserWhereClause();
      
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .match(whereClause)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to get collections:', error);
        return [];
      }

      // Convert database collections to BuJoCollection format
      return (data || []).map(collection => ({
        id: collection.id,
        type: collection.type,
        date: collection.date,
        entries: [], // Will be populated separately
        entryIds: collection.entry_ids || [],
        createdAt: new Date(collection.created_at),
        modifiedAt: new Date(collection.updated_at),
        title: collection.title,
        description: collection.description,
        smartMatch: collection.smart_match || false,
      }));
    } catch (error) {
      console.warn('Error getting collections:', error);
      return [];
    }
  }

  // Create entry in cloud database
  async createEntry(entry: BuJoEntry): Promise<void> {
    if (!supabase || !entry) return;

    // Validate UUID format before sending to database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(entry.id)) {
      console.warn('Invalid UUID format, skipping sync for entry:', entry.id);
      return;
    }

    try {
      const whereClause = this.getUserWhereClause();
      
      const { error } = await supabase
        .from('entries')
        .insert({
          ...whereClause,
          id: entry.id,
          type: entry.type,
          content: entry.content,
          status: entry.status,
          priority: entry.priority || 'none',
          collection: entry.collection || 'daily',
          collection_date: entry.collectionDate,
          due_date: entry.dueDate?.toISOString(),
          scheduled_date: entry.scheduledDate?.toISOString(),
          completed_at: entry.completedAt?.toISOString(),
          tags: entry.tags || [],
          contexts: entry.contexts || [],
          created_at: entry.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to create entry:', error);
      }
    } catch (error) {
      console.warn('Error creating entry:', error);
    }
  }

  // Update entry in cloud database
  async updateEntry(id: string, entry: BuJoEntry): Promise<void> {
    if (!supabase || !id || !entry) return;

    // Validate UUID format before sending to database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn('Invalid UUID format, skipping update for entry:', id);
      return;
    }

    try {
      const whereClause = this.getUserWhereClause();
      
      const { error } = await supabase
        .from('entries')
        .update({
          type: entry.type,
          content: entry.content,
          status: entry.status,
          priority: entry.priority || 'none',
          collection: entry.collection || 'daily',
          collection_date: entry.collectionDate,
          due_date: entry.dueDate?.toISOString(),
          scheduled_date: entry.scheduledDate?.toISOString(),
          completed_at: entry.completedAt?.toISOString(),
          tags: entry.tags || [],
          contexts: entry.contexts || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .match(whereClause);

      if (error) {
        console.warn('Failed to update entry:', error);
      }
    } catch (error) {
      console.warn('Error updating entry:', error);
    }
  }

  // Create collection in cloud database
  async createCollection(collection: BuJoCollection): Promise<void> {
    if (!supabase || !collection) return;

    // Validate UUID format before sending to database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(collection.id)) {
      console.warn('Invalid UUID format, skipping sync for collection:', collection.id);
      return;
    }

    try {
      const whereClause = this.getUserWhereClause();
      
      const { error } = await supabase
        .from('collections')
        .insert({
          ...whereClause,
          id: collection.id,
          type: collection.type,
          date: collection.date,
          title: collection.title,
          description: collection.description,
          entry_ids: collection.entryIds || [],
          smart_match: collection.smartMatch || false,
          created_at: collection.createdAt.toISOString(),
          updated_at: collection.modifiedAt?.toISOString() || new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to create collection:', error);
      }
    } catch (error) {
      console.warn('Error creating collection:', error);
    }
  }
}

// Singleton instance
export const bujoSyncService = new BuJoSyncService();