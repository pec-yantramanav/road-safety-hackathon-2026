import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthController } from '../controllers/useAuthController';
import { useComplaintController } from '../controllers/useComplaintController';
import { useOfflineSyncController } from '../controllers/useOfflineSyncController';
import { useChatSessionController } from '../controllers/useChatSessionController';
import { LeafletMap } from '../components/LeafletMap';
import { ChatBubble } from '../components/ChatBubble';
import { GlassCard } from '../components/GlassCard';
import { TicketCategory, LocationPoint } from '../api/types';
import { MapPin, MessageSquare, Send, FileText, WifiOff, LogOut } from 'lucide-react-native';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoggingIn, login, logout } = useAuthController();
  const { submitComplaint, isSubmitting, useNearbyTickets, isSavedOffline } = useComplaintController();
  const { queueLength, isSyncing, triggerManualSync } = useOfflineSyncController();
  const { messages, isStreaming, sendMessage } = useChatSessionController();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [currentTab, setCurrentTab] = useState<'MAP' | 'REPORT' | 'CHAT'>('MAP');

  // New Ticket State
  const [category, setCategory] = useState<TicketCategory>('POTHOLE');
  const [description, setDescription] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint>({ latitude: 12.9716, longitude: 77.5946 });

  // Load nearby tickets dynamically based on center coordinate
  const { data: nearbyTickets = [], isLoading: isLoadingTickets } = useNearbyTickets({
    latitude: 12.9716,
    longitude: 77.5946
  });

  const [chatInput, setChatInput] = useState('');

  const handleLoginSubmit = () => {
    if (phone && otp) {
      login(phone, otp);
    }
  };

  const handleComplaintSubmit = async () => {
    if (!description.trim()) return;
    try {
      await submitComplaint({
        category,
        description,
        location: selectedPoint,
        photoUrls: ['https://picsum.photos/400/300'],
        isAnonymous: false
      });
      alert(isSavedOffline ? 'Connection offline! Saved to sync queue.' : 'Grievance submitted successfully!');
      setDescription('');
      setCurrentTab('MAP');
    } catch (e) {
      console.error(e);
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-background justify-center px-6">
        <GlassCard className="space-y-6">
          <View className="items-center mb-6">
            <Text className="text-accent font-bold text-3xl tracking-tight">RoadWatch</Text>
            <Text className="text-textSecondary text-xs mt-1">Citizen Empowerment Portal</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-textPrimary text-xs font-bold mb-2">PHONE NUMBER</Text>
              <TextInput
                className="bg-[#121829] text-textPrimary border border-borderBg rounded-xl px-4 py-3"
                placeholder="+91 99999 99999"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View className="mt-4">
              <Text className="text-textPrimary text-xs font-bold mb-2">ENTER OTP</Text>
              <TextInput
                className="bg-[#121829] text-textPrimary border border-borderBg rounded-xl px-4 py-3"
                placeholder="123456"
                placeholderTextColor="#6B7280"
                secureTextEntry
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity
              className="bg-accent rounded-xl py-4 mt-6 items-center flex-row justify-center"
              onPress={handleLoginSubmit}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-textPrimary font-bold text-base">Verify & Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-12">
      {/* Header Panel */}
      <View className="px-6 pb-4 border-b border-borderBg flex-row justify-between items-center">
        <View>
          <Text className="text-textPrimary font-bold text-lg">Welcome, {user?.name}</Text>
          <Text className="text-textSecondary text-xs">{user?.phone}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Offline Sync Banner if actions queued */}
      {queueLength > 0 && (
        <View className="bg-warning px-6 py-2 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <WifiOff size={16} color="#0B0F19" className="mr-2" />
            <Text className="text-[#0B0F19] text-xs font-bold">
              {queueLength} offline action(s) queued.
            </Text>
          </View>
          <TouchableOpacity onPress={triggerManualSync} disabled={isSyncing}>
            <Text className="text-[#0B0F19] text-xs font-bold underline">
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dynamic Tab Body rendering */}
      <ScrollView className="flex-1 px-4 mt-4">
        {currentTab === 'MAP' && (
          <View className="space-y-4">
            <Text className="text-textPrimary font-bold text-lg mb-2">Nearby Grid Grievances</Text>
            {isLoadingTickets ? (
              <ActivityIndicator color="#4F46E5" size="large" />
            ) : (
              <LeafletMap
                nearbyTickets={nearbyTickets}
                center={{ latitude: 12.9716, longitude: 77.5946 }}
                onLocationSelect={setSelectedPoint}
              />
            )}
            
            <GlassCard className="mt-4">
              <Text className="text-textPrimary font-bold text-sm mb-2">Selected Location</Text>
              <Text className="text-textSecondary text-xs">
                Lat: {selectedPoint.latitude.toFixed(6)} | Lng: {selectedPoint.longitude.toFixed(6)}
              </Text>
            </GlassCard>
          </View>
        )}

        {currentTab === 'REPORT' && (
          <View className="space-y-4">
            <Text className="text-textPrimary font-bold text-lg mb-2">Report Road Grievance</Text>
            
            <View>
              <Text className="text-textPrimary text-xs font-bold mb-2">CATEGORY</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['POTHOLE', 'LIGHTING', 'SIGNAGE', 'ROAD_QUALITY', 'OTHER'] as TicketCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-4 py-2 rounded-lg border ${
                      category === cat
                        ? 'bg-accent border-accent'
                        : 'bg-[#121829] border-borderBg'
                    }`}
                    onPress={() => setCategory(cat)}
                  >
                    <Text className="text-textPrimary text-xs font-bold">{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-textPrimary text-xs font-bold mb-2">DESCRIPTION</Text>
              <TextInput
                className="bg-[#121829] text-textPrimary border border-borderBg rounded-xl px-4 py-3 h-24"
                placeholder="Detail the issue size, visibility, or safety hazards..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              className="bg-accent rounded-xl py-4 mt-6 items-center flex-row justify-center"
              onPress={handleComplaintSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-textPrimary font-bold text-base">File Grievance</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentTab === 'CHAT' && (
          <View className="flex-1 h-[450px]">
            <ScrollView className="flex-1 pr-2">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && <ActivityIndicator color="#4F46E5" size="small" className="self-start m-2" />}
            </ScrollView>

            <View className="flex-row items-center border-t border-borderBg pt-4 mt-2">
              <TextInput
                className="flex-1 bg-[#121829] text-textPrimary border border-borderBg rounded-xl px-4 py-3"
                placeholder="Ask AI or type issue to submit..."
                placeholderTextColor="#6B7280"
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity
                className="bg-accent p-3 rounded-xl ml-2 justify-center items-center"
                onPress={handleChatSend}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Tab Navigation Controls */}
      <View className="flex-row border-t border-borderBg bg-cardBg py-4 px-6 justify-between">
        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab('MAP')}
        >
          <MapPin size={20} color={currentTab === 'MAP' ? '#4F46E5' : '#9CA3AF'} />
          <Text className={`text-[10px] mt-1 ${currentTab === 'MAP' ? 'text-accent font-bold' : 'text-textSecondary'}`}>
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab('REPORT')}
        >
          <FileText size={20} color={currentTab === 'REPORT' ? '#4F46E5' : '#9CA3AF'} />
          <Text className={`text-[10px] mt-1 ${currentTab === 'REPORT' ? 'text-accent font-bold' : 'text-textSecondary'}`}>
            File ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab('CHAT')}
        >
          <MessageSquare size={20} color={currentTab === 'CHAT' ? '#4F46E5' : '#9CA3AF'} />
          <Text className={`text-[10px] mt-1 ${currentTab === 'CHAT' ? 'text-accent font-bold' : 'text-textSecondary'}`}>
            AI Helper
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
