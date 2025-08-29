import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '../../screens/main/SettingsScreen';

// Mock the navigation prop
const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);
    
    expect(getByText('Bullet Journal Guide')).toBeTruthy();
    expect(getByText('Learn the methodology & app features')).toBeTruthy();
  });

  it('navigates to BuJo Guide when pressed', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);
    
    const guideRow = getByText('Bullet Journal Guide');
    fireEvent.press(guideRow);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuJoGuide');
  });

  it('displays OCR settings section', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);
    
    expect(getByText('OCR & Processing')).toBeTruthy();
  });

  it('displays subscription section', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);
    
    expect(getByText('Subscription')).toBeTruthy();
  });
});