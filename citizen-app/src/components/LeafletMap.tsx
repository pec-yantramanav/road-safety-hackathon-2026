import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ticket, LocationPoint } from '../api/types';

interface LeafletMapProps {
  nearbyTickets: Ticket[];
  center: LocationPoint;
  onLocationSelect?: (point: LocationPoint) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  nearbyTickets,
  center,
  onLocationSelect
}) => {
  const webViewRef = useRef<WebView>(null);

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
            background: #0B0F19;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: rgba(25, 32, 56, 0.9);
            color: #F3F4F6;
            border: 1px solid rgba(255, 255, 255, 0.15);
            font-family: system-ui, sans-serif;
            border-radius: 8px;
            backdrop-filter: blur(4px);
          }
          .custom-popup .leaflet-popup-tip {
            background: rgba(25, 32, 56, 0.9);
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

          // Add active markers
          const tickets = ${JSON.stringify(nearbyTickets)};
          tickets.forEach(ticket => {
            const marker = L.marker([ticket.location.latitude, ticket.location.longitude]).addTo(map);
            marker.bindPopup(\`
              <div class="custom-popup">
                <h4 style="margin: 0 0 4px 0; color: #4F46E5;">\${ticket.id}</h4>
                <p style="margin: 0; font-size: 12px;">\${ticket.description}</p>
                <div style="margin-top: 6px; font-weight: bold; font-size: 11px;">Status: \${ticket.status}</div>
              </div>
            \`);
          });

          // Selection handler callback
          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            L.marker([lat, lng]).addTo(map).bindPopup('<b>Selected Spot</b>').openPopup();
            window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: lat, longitude: lng }));
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const selectedPoint: LocationPoint = JSON.parse(event.nativeEvent.data);
      if (onLocationSelect) {
        onLocationSelect(selectedPoint);
      }
    } catch (e) {
      console.warn('Failed parsing selection point message from Leaflet WebView', e);
    }
  };

  return (
    <View style={styles.container}>
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  map: {
    flex: 1,
  },
});
