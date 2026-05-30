import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { TicketEvent } from '../api/types';
import { useThemeStore } from '../state/themeStore';
import { Colors } from '../styles/theme';

interface TicketTimelineProps {
  events: TicketEvent[];
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({ events }) => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            {/* Dynamic visual line divider indicators */}
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.dot,
                  isDark ? styles.dotDark : styles.dotLight,
                  { borderColor: isDark ? Colors.dark.background : Colors.light.background }
                ]}
              />
              {index !== sortedEvents.length - 1 && (
                <View style={[styles.line, isDark ? styles.lineDark : styles.lineLight]} />
              )}
            </View>
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
                  {item.eventType}
                </Text>
                <Text style={[styles.timeText, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  {new Date(item.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={[styles.description, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                {item.eventType === 'ASSIGNED'
                  ? `Assigned to: ${item.payload.assignedTo || 'Grievance Officer'}`
                  : item.eventType === 'CREATED'
                  ? 'Grievance successfully filed by citizen'
                  : item.eventType === 'ESCALATED'
                  ? 'SLA warning breach triggered auto-escalation chain'
                  : `State transition: ${item.eventType}`}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotLight: {
    backgroundColor: Colors.light.accent,
  },
  dotDark: {
    backgroundColor: Colors.dark.accent,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  lineLight: {
    backgroundColor: Colors.light.borderBg,
  },
  lineDark: {
    backgroundColor: Colors.dark.borderBg,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  textLight: {
    color: Colors.light.textPrimary,
  },
  textDark: {
    color: Colors.dark.textPrimary,
  },
  timeText: {
    fontSize: 10,
  },
  description: {
    fontSize: 12,
  },
  textSecondaryLight: {
    color: Colors.light.textSecondary,
  },
  textSecondaryDark: {
    color: Colors.dark.textSecondary,
  },
});
