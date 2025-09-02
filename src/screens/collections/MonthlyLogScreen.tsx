import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface MonthlyLogScreenProps {
  navigation: any;
  route?: any;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: BuJoEntry[];
}

export const MonthlyLogScreen: React.FC<MonthlyLogScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { entries } = useBuJoStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar grid for the current month
  const generateCalendar = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      const dayEntries = entries.filter(entry => entry.collectionDate === dateString);
      
      days.push({
        date: new Date(date),
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        entries: dayEntries,
      });
    }
    
    return days;
  };

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(generateCalendar());

  useEffect(() => {
    setCalendarDays(generateCalendar());
  }, [currentDate, entries]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const selectDate = (day: CalendarDay) => {
    setSelectedDate(day.date);
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'task': return '#007AFF';
      case 'event': return '#FF3B30';
      case 'note': return '#32D74B';
      case 'idea': return '#FFD60A';
      default: return '#8E8E93';
    }
  };

  const getBulletSymbol = (entry: BuJoEntry) => {
    if (entry.type === 'task') {
      return entry.status === 'complete' ? '✓' : '•';
    } else if (entry.type === 'event') {
      return '○';
    } else if (entry.type === 'note') {
      return '—';
    } else if (entry.type === 'idea') {
      return '!';
    }
    return '•';
  };

  const renderCalendarDay = ({ item }: { item: CalendarDay }) => (
    <TouchableOpacity
      style={[
        styles.dayCell,
        !item.isCurrentMonth && styles.dayInactive,
        item.isToday && styles.dayToday,
        selectedDate?.toDateString() === item.date.toDateString() && styles.daySelected,
      ]}
      onPress={() => selectDate(item)}
    >
      <Typography
        variant="body"
        style={[
          styles.dayNumber,
          !item.isCurrentMonth && styles.dayNumberInactive,
          item.isToday && styles.dayNumberToday,
          { color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E') }
        ]}
      >
        {item.dayNumber}
      </Typography>
      
      {item.entries.length > 0 && (
        <View style={styles.entriesPreview}>
          {item.entries.slice(0, 3).map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.entryDot,
                { backgroundColor: getEntryTypeColor(entry.type) },
              ]}
            />
          ))}
          {item.entries.length > 3 && (
            <Text style={styles.moreEntries}>+{item.entries.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSelectedDateEntries = () => {
    if (!selectedDate) return null;

    const selectedDay = calendarDays.find(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );

    if (!selectedDay || selectedDay.entries.length === 0) {
      return (
        <Card style={[styles.selectedDateContainer, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <Typography variant="subtitle" style={[styles.selectedDateTitle, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          <Typography variant="body" style={[styles.noEntriesText, {
            color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
          }]}>No entries for this day</Typography>
        </Card>
      );
    }

    return (
      <Card style={[styles.selectedDateContainer, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
      }]}>
        <Typography variant="subtitle" style={[styles.selectedDateTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
        
        <ScrollView style={styles.entriesList}>
          {selectedDay.entries.map((entry) => (
            <TouchableOpacity key={entry.id} style={styles.entryItem}>
              <Text
                style={[
                  styles.bullet,
                  { color: getEntryTypeColor(entry.type) }
                ]}
              >
                {getBulletSymbol(entry)}
              </Text>
              <View style={styles.entryContent}>
                <Typography
                  variant="body"
                  style={[
                    styles.entryText,
                    entry.status === 'complete' && styles.completedText,
                    { color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E') }
                  ]}
                >
                  {entry.content}
                </Typography>
                {(entry.tags.length > 0 || entry.contexts.length > 0) && (
                  <View style={styles.tagContainer}>
                    {entry.contexts.map(ctx => (
                      <Text key={ctx} style={styles.contextTag}>@{ctx}</Text>
                    ))}
                    {entry.tags.map(tag => (
                      <Text key={tag} style={styles.hashTag}>#{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
    );
  };

  return (
    <PaperBackground>
      <SafeAreaView style={[styles.container, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.background, '#FAF7F0')
      }]}>
        {/* Header */}
        <Card style={[styles.header, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
          borderRadius: 0
        }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Typography variant="subtitle" style={styles.headerTitle}>
            {currentDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </Typography>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setCurrentDate(new Date())}>
          <Typography variant="caption" style={styles.todayButton}>Today</Typography>
        </TouchableOpacity>
        </Card>

        {/* Calendar Grid */}
        <Card style={[styles.calendarContainer, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
        {/* Day Labels */}
        <View style={styles.dayLabelsContainer}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Typography key={day} variant="caption" style={[styles.dayLabel, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
            }]}>{day}</Typography>
          ))}
        </View>

        {/* Calendar Grid */}
        <FlatList
          data={calendarDays}
          renderItem={renderCalendarDay}
          keyExtractor={(item) => item.date.toISOString()}
          numColumns={7}
          scrollEnabled={false}
          contentContainerStyle={styles.calendarGrid}
          // Performance optimizations for calendar
          removeClippedSubviews={false} // Keep false for calendar grid layout
          maxToRenderPerBatch={21} // 3 weeks at a time
          initialNumToRender={42} // Full month
          getItemLayout={(data, index) => ({
            length: 50, // Calendar day height
            offset: 50 * Math.floor(index / 7), // Row height
            index,
          })}
        />
        </Card>

        {/* Selected Date Details */}
        {renderSelectedDateEntries()}
      </SafeAreaView>
    </PaperBackground>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    minWidth: 160,
    textAlign: 'center',
  },
  todayButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    gap: 0,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
    margin: 1,
  },
  dayInactive: {
    opacity: 0.3,
  },
  dayToday: {
    backgroundColor: '#E3F2FD',
  },
  daySelected: {
    backgroundColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  dayNumberInactive: {
    color: '#C7C7CC',
  },
  dayNumberToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  entriesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEntries: {
    fontSize: 10,
    color: '#8E8E93',
    marginLeft: 2,
  },
  selectedDateContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  noEntriesText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  entriesList: {
    flex: 1,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bullet: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  contextTag: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  hashTag: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});