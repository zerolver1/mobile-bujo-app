import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EntryReviewScreen } from '../../screens/main/EntryReviewScreen';
import { useBuJoStore } from '../../stores/BuJoStore';
import { useProcessingStore } from '../../stores/ProcessingStore';

// Mock the navigation and route props
const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    entries: [
      {
        id: '1',
        type: 'task',
        status: 'incomplete',
        content: 'Test task',
        collectionDate: new Date().toISOString().split('T')[0],
        tags: [],
        contexts: [],
        parsedDate: new Date().toISOString().split('T')[0],
        confidence: 0.9,
      },
    ],
    metadata: {
      handwriting_quality: 'excellent',
      page_date: new Date().toISOString().split('T')[0],
      total_entries: 1,
    },
  },
};

jest.mock('../../stores/BuJoStore');
jest.mock('../../stores/ProcessingStore');

const mockUseBuJoStore = useBuJoStore as jest.MockedFunction<typeof useBuJoStore>;
const mockUseProcessingStore = useProcessingStore as jest.MockedFunction<typeof useProcessingStore>;

describe('EntryReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseBuJoStore.mockReturnValue({
      entries: [],
      addEntries: jest.fn(),
      removeEntry: jest.fn(),
      updateEntry: jest.fn(),
      toggleEntryStatus: jest.fn(),
      getEntryStats: () => ({
        total: 0,
        tasks: 0,
        events: 0,
        notes: 0,
        completed: 0,
        completionRate: 0,
      }),
    });

    mockUseProcessingStore.mockReturnValue({
      isProcessing: false,
      tasks: [],
      startTask: jest.fn(),
      updateTask: jest.fn(),
      completeTask: jest.fn(),
      clearTasks: jest.fn(),
    });
  });

  it('renders correctly with entries', () => {
    const { getByText } = render(
      <EntryReviewScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Test task')).toBeTruthy();
    expect(getByText('Review & Edit')).toBeTruthy();
  });

  it('displays bullet selector for entries', () => {
    const { getByText } = render(
      <EntryReviewScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // The bullet selector should be present (shows as • for tasks)
    expect(getByText('•')).toBeTruthy();
  });

  it('shows save button', () => {
    const { getByText } = render(
      <EntryReviewScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Save All Entries')).toBeTruthy();
  });

  it('shows metadata information', () => {
    const { getByText } = render(
      <EntryReviewScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText(/1 entries found/)).toBeTruthy();
    expect(getByText(/excellent quality/)).toBeTruthy();
  });
});