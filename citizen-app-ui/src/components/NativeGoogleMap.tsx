import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ticket, LocationPoint } from '../api/types';
import { useThemeStore } from '../state/themeStore';

interface NativeGoogleMapProps {
  nearbyTickets: Ticket[];
  center: LocationPoint;
  userLocation: LocationPoint | null;
  onLocationSelect?: (point: LocationPoint) => void;
  onTicketSelect?: (ticket: Ticket) => void;
}

export const NativeGoogleMap: React.FC<NativeGoogleMapProps> = ({
  nearbyTickets,
  center,
  userLocation,
  onLocationSelect,
  onTicketSelect
}) => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const handleMapPress = (e: any) => {
    if (onLocationSelect) {
      onLocationSelect(e.nativeEvent.coordinate);
    }
  };

  return (
    <View style={[
      styles.container,
      { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' }
    ]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        region={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        onPress={handleMapPress}
      >
        {/* User location pin */}
        {userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number' && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            pinColor="#3B82F6"
          />
        )}

        {/* Grievance markers */}
        {nearbyTickets.map((ticket) => {
          if (!ticket.location || typeof ticket.location.latitude !== 'number' || typeof ticket.location.longitude !== 'number') {
            return null;
          }
          return (
            <Marker
              key={ticket.id}
              coordinate={ticket.location}
              title={ticket.title}
              description={ticket.description}
              onPress={(e) => {
                e.stopPropagation();
                if (onTicketSelect) {
                  onTicketSelect(ticket);
                }
              }}
              pinColor="#EF4444"
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
});
