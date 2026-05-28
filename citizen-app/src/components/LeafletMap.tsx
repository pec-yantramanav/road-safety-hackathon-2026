import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ticket, LocationPoint } from '../api/types';
import { useThemeStore } from '../state/themeStore';

interface LeafletMapProps {
  nearbyTickets: Ticket[];
  center: LocationPoint;
  onLocationSelect?: (point: LocationPoint) => void;
  onTicketSelect?: (ticket: Ticket) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  nearbyTickets,
  center,
  onLocationSelect,
  onTicketSelect
}) => {
  const webViewRef = useRef<WebView>(null);
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'dark';
  const mapBg = isDark ? '#0B0F19' : '#F8FAFC';
  const popupBg = isDark ? 'rgba(25, 32, 56, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const popupText = isDark ? '#F3F4F6' : '#0F172A';
  const popupBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)';

  // Generate Leaflet HTML container using OpenStreetMap tiles
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background: ${mapBg};
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: ${popupBg};
            color: ${popupText};
            border: 1px solid ${popupBorder};
            font-family: system-ui, sans-serif;
            border-radius: 8px;
            backdrop-filter: blur(4px);
          }
          .custom-popup .leaflet-popup-tip {
            background: ${popupBg};
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${center.latitude}, ${center.longitude}], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add active markers with explicit click hooks
          const tickets = ${JSON.stringify(nearbyTickets)};
          tickets.forEach(ticket => {
            const marker = L.marker([ticket.location.latitude, ticket.location.longitude]).addTo(map);
            
            // Map pin popup
            marker.bindPopup(\`
              <div class="custom-popup">
                <h4 style="margin: 0 0 4px 0; color: #4F46E5;">\${ticket.id}</h4>
                <p style="margin: 0; font-size: 12px; font-weight: 500;">\${ticket.description}</p>
                <div style="margin-top: 6px; font-weight: bold; font-size: 11px;">Status: \${ticket.status}</div>
              </div>
            \`);

            // Send native postMessage on pin tap
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TICKET_CLICK',
                ticket: ticket
              }));
            });
          });

          // Selection handler callback for general map clicks
          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_CLICK',
              latitude: lat,
              longitude: lng
            }));
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'TICKET_CLICK' && onTicketSelect) {
        onTicketSelect(data.ticket);
      } else if (data.type === 'MAP_CLICK' && onLocationSelect) {
        onLocationSelect({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (e) {
      console.warn('Failed parsing selection point message from Leaflet WebView', e);
    }
  };

  return (
    <View style={[styles.container, { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
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
