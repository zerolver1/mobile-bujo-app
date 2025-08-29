import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProcessingTask {
  id: string;
  type: 'ocr' | 'sync' | 'export';
  stage: string;
  progress: number;
  startedAt: Date;
  imageUri?: string;
  canNavigate: boolean;
  serviceName?: string;
  error?: string;
}

export type ProcessingSpeedPreference = 'speed' | 'accuracy';

interface ProcessingState {
  // Active processing tasks
  activeTasks: ProcessingTask[];
  
  // UI state
  isOverlayVisible: boolean;
  isOverlayExpanded: boolean;
  
  // User preferences
  speedPreference: ProcessingSpeedPreference;
  
  // Actions - Task Management
  startTask: (task: Omit<ProcessingTask, 'id' | 'startedAt'>) => string;
  updateTask: (id: string, updates: Partial<ProcessingTask>) => void;
  completeTask: (id: string) => void;
  failTask: (id: string, error: string) => void;
  clearTask: (id: string) => void;
  
  // Actions - UI Management  
  showOverlay: () => void;
  hideOverlay: () => void;
  expandOverlay: () => void;
  collapseOverlay: () => void;
  
  // Actions - Preferences
  setSpeedPreference: (preference: ProcessingSpeedPreference) => void;
  loadPreferences: () => Promise<void>;
  
  // Getters
  getCurrentTask: () => ProcessingTask | null;
  hasActiveTasks: () => boolean;
  getTaskCount: () => number;
}

const STORAGE_KEYS = {
  SPEED_PREFERENCE: '@BuJo:speedPreference',
};

export const useProcessingStore = create<ProcessingState>((set, get) => ({
  // Initial state
  activeTasks: [],
  isOverlayVisible: false,
  isOverlayExpanded: false,
  speedPreference: 'accuracy', // Default to accuracy
  
  // Task Management
  startTask: (taskData) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const task: ProcessingTask = {
      ...taskData,
      id,
      startedAt: new Date(),
    };
    
    set(state => ({
      activeTasks: [...state.activeTasks, task],
      isOverlayVisible: true, // Auto-show overlay when task starts
    }));
    
    console.log('ProcessingStore: Started task', id, taskData.type);
    return id;
  },
  
  updateTask: (id, updates) => {
    set(state => ({
      activeTasks: state.activeTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
    
    // Log progress updates for debugging
    if (updates.progress !== undefined) {
      console.log(`ProcessingStore: Task ${id} progress: ${updates.progress}%`);
    }
    if (updates.stage) {
      console.log(`ProcessingStore: Task ${id} stage: ${updates.stage}`);
    }
  },
  
  completeTask: (id) => {
    const task = get().activeTasks.find(t => t.id === id);
    if (task) {
      console.log(`ProcessingStore: Task ${id} completed in ${Date.now() - task.startedAt.getTime()}ms`);
    }
    
    set(state => ({
      activeTasks: state.activeTasks.filter(task => task.id !== id),
      // Auto-hide overlay if no more tasks
      isOverlayVisible: state.activeTasks.length > 1 ? true : false,
      isOverlayExpanded: false,
    }));
  },
  
  failTask: (id, error) => {
    console.error(`ProcessingStore: Task ${id} failed:`, error);
    
    set(state => ({
      activeTasks: state.activeTasks.map(task =>
        task.id === id ? { ...task, error, progress: 0 } : task
      ),
    }));
  },
  
  clearTask: (id) => {
    set(state => ({
      activeTasks: state.activeTasks.filter(task => task.id !== id),
      isOverlayVisible: state.activeTasks.length > 1 ? true : false,
      isOverlayExpanded: false,
    }));
  },
  
  // UI Management
  showOverlay: () => {
    set({ isOverlayVisible: true });
  },
  
  hideOverlay: () => {
    set({ isOverlayVisible: false, isOverlayExpanded: false });
  },
  
  expandOverlay: () => {
    set({ isOverlayExpanded: true });
  },
  
  collapseOverlay: () => {
    set({ isOverlayExpanded: false });
  },
  
  // Preferences Management
  setSpeedPreference: async (preference) => {
    set({ speedPreference: preference });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SPEED_PREFERENCE, preference);
      console.log('ProcessingStore: Speed preference saved:', preference);
    } catch (error) {
      console.warn('ProcessingStore: Failed to save speed preference:', error);
    }
  },
  
  loadPreferences: async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(STORAGE_KEYS.SPEED_PREFERENCE);
      if (savedPreference === 'speed' || savedPreference === 'accuracy') {
        set({ speedPreference: savedPreference });
        console.log('ProcessingStore: Loaded speed preference:', savedPreference);
      }
    } catch (error) {
      console.warn('ProcessingStore: Failed to load speed preference:', error);
    }
  },
  
  // Getters
  getCurrentTask: () => {
    const tasks = get().activeTasks;
    return tasks.length > 0 ? tasks[tasks.length - 1] : null; // Most recent task
  },
  
  hasActiveTasks: () => {
    return get().activeTasks.length > 0;
  },
  
  getTaskCount: () => {
    return get().activeTasks.length;
  },
}));