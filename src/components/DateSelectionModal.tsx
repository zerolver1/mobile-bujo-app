import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DateSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  initialDate?: string;
  title?: string;
  showBatchOption?: boolean;
  onBatchSelect?: () => void;
}

export const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Date',
  showBatchOption = false,
  onBatchSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'quick' | 'calendar'>('quick');

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onSelectDate(date);
    onClose();
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const options = [];

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    options.push({
      label: 'Yesterday',
      sublabel: formatDateLabel(yesterday),
      date: yesterday.toISOString().split('T')[0],
      icon: 'arrow-back-outline' as const,
    });

    // Today
    options.push({
      label: 'Today',
      sublabel: formatDateLabel(today),
      date: today.toISOString().split('T')[0],
      icon: 'today-outline' as const,
    });

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      label: 'Tomorrow',
      sublabel: formatDateLabel(tomorrow),
      date: tomorrow.toISOString().split('T')[0],
      icon: 'arrow-forward-outline' as const,
    });

    // This week (next 5 days)
    for (let i = 2; i <= 6; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      options.push({
        label: getDayOfWeekLabel(futureDate),
        sublabel: formatDateLabel(futureDate),
        date: futureDate.toISOString().split('T')[0],
        icon: 'calendar-outline' as const,
      });
    }

    // Last week (previous 5 days)
    for (let i = 2; i <= 6; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      options.push({
        label: getDayOfWeekLabel(pastDate),
        sublabel: formatDateLabel(pastDate),
        date: pastDate.toISOString().split('T')[0],
        icon: 'time-outline' as const,
      });
    }

    return options;
  };

  const formatDateLabel = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayOfWeekLabel = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const generateCalendarDays = () => {
    const currentDate = new Date(selectedDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const getCurrentMonthLabel = (): string => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight}>
            {showBatchOption && (
              <TouchableOpacity onPress={onBatchSelect} style={styles.batchButton}>
                <Ionicons name="copy-outline" size={20} color="#007AFF" />
                <Text style={styles.batchButtonText}>All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'quick' && styles.activeToggle]}
            onPress={() => setViewMode('quick')}
          >
            <Ionicons
              name="flash-outline"
              size={20}
              color={viewMode === 'quick' ? '#007AFF' : '#8E8E93'}
            />
            <Text style={[styles.toggleText, viewMode === 'quick' && styles.activeToggleText]}>
              Quick
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={viewMode === 'calendar' ? '#007AFF' : '#8E8E93'}
            />
            <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {viewMode === 'quick' ? (
            /* Quick Date Selection */
            <View style={styles.quickOptions}>
              {getQuickDateOptions().map((option, index) => (
                <TouchableOpacity
                  key={option.date}
                  style={[
                    styles.quickOption,
                    selectedDate === option.date && styles.selectedQuickOption,
                  ]}
                  onPress={() => handleSelectDate(option.date)}
                >
                  <View style={styles.quickOptionContent}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={selectedDate === option.date ? '#007AFF' : '#8E8E93'}
                    />
                    <View style={styles.quickOptionText}>
                      <Text
                        style={[
                          styles.quickOptionLabel,
                          selectedDate === option.date && styles.selectedQuickOptionLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.quickOptionSublabel,
                          selectedDate === option.date && styles.selectedQuickOptionSublabel,
                        ]}
                      >
                        {option.sublabel}
                      </Text>
                    </View>
                  </View>
                  {selectedDate === option.date && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Calendar View */
            <View style={styles.calendar}>
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateMonth('prev')}>
                  <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{getCurrentMonthLabel()}</Text>
                <TouchableOpacity onPress={() => navigateMonth('next')}>
                  <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekdayHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} style={styles.weekdayLabel}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((dayInfo, index) => (
                  <TouchableOpacity
                    key={`${dayInfo.date}-${index}`}
                    style={[
                      styles.calendarDay,
                      !dayInfo.isCurrentMonth && styles.inactiveDay,
                      dayInfo.isToday && styles.todayDay,
                      dayInfo.isSelected && styles.selectedDay,
                    ]}
                    onPress={() => handleSelectDate(dayInfo.date)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !dayInfo.isCurrentMonth && styles.inactiveDayText,
                        dayInfo.isToday && styles.todayDayText,
                        dayInfo.isSelected && styles.selectedDayText,
                      ]}
                    >
                      {dayInfo.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleSelectDate(selectedDate)}
          >
            <Text style={styles.confirmButtonText}>Confirm Date</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
  },
  batchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#F0F7FF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 8,
  },
  activeToggleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  quickOptions: {
    padding: 20,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuickOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  quickOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  quickOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedQuickOptionLabel: {
    color: '#007AFF',
  },
  quickOptionSublabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectedQuickOptionSublabel: {
    color: '#5A9BFF',
  },
  calendar: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: SCREEN_WIDTH / 7 - 20 / 7 * 2, // Adjust for padding
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 22,
  },
  inactiveDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#E5E5E7',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  inactiveDayText: {
    color: '#8E8E93',
  },
  todayDayText: {
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});