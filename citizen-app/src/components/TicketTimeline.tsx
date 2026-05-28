import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { TicketEvent } from '../api/types';

interface TicketTimelineProps {
  events: TicketEvent[];
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({ events }) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View className="py-4">
      <FlatList
        data={sortedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View className="flex-row">
            {/* Dynamic visual line divider indicators */}
            <View className="items-center mr-4">
              <View className="w-3 h-3 rounded-full bg-accent dark:bg-darkAccent border-2 border-background dark:border-darkBackground" />
              {index !== sortedEvents.length - 1 && (
                <View className="w-[2px] flex-1 bg-borderBg dark:bg-darkBorderBg my-1" />
              )}
            </View>
            <View className="flex-1 pb-6">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-sm">
                  {item.eventType}
                </Text>
                <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary">
                  {new Date(item.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text className="text-textSecondary dark:text-darkTextSecondary text-xs">
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
