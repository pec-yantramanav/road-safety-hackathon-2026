import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAuthController } from "../controllers/useAuthController";
import { useComplaintController } from "../controllers/useComplaintController";
import { useOfflineSyncController } from "../controllers/useOfflineSyncController";
import { useChatSessionController } from "../controllers/useChatSessionController";
import { useBudgetController } from "../controllers/useBudgetController";
import { BudgetSchemeDetails } from "../api/services/budgetApi";
import { useThemeStore } from "../state/themeStore";
import { LeafletMap } from "../components/LeafletMap";
import { ChatBubble } from "../components/ChatBubble";
import { GlassCard } from "../components/GlassCard";
import { TicketTimeline } from "../components/TicketTimeline";
import { TicketCategory, LocationPoint, Ticket } from "../api/types";
import {
  MapPin,
  MessageSquare,
  Send,
  FileText,
  WifiOff,
  LogOut,
  Sun,
  Moon,
  DollarSign,
  Award,
  Clock,
  Heart,
} from "lucide-react-native";

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoggingIn, login, logout } =
    useAuthController();
  const {
    submitComplaint,
    isSubmitting,
    useNearbyTickets,
    useTicketEvents,
    contributeComplaint,
    isContributing,
    isSavedOffline,
  } = useComplaintController();
  const { queueLength, isSyncing, triggerManualSync } =
    useOfflineSyncController();
  const { messages, isStreaming, sendMessage } = useChatSessionController();
  const {
    budgets,
    summary: budgetSummary,
    isLoading: loadingBudgets,
  } = useBudgetController();
  const { theme, toggleTheme } = useThemeStore();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [currentTab, setCurrentTab] = useState<
    "MAP" | "REPORT" | "CHAT" | "BUDGET"
  >("MAP");

  // Selected Ticket overlay drawer state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // New Ticket State
  const [category, setCategory] = useState<TicketCategory>("POTHOLE");
  const [description, setDescription] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint>({
    latitude: 12.9716,
    longitude: 77.5946,
  });

  // Load nearby tickets dynamically based on center coordinate
  const { data: nearbyTickets = [], isLoading: isLoadingTickets } =
    useNearbyTickets({
      latitude: 12.9716,
      longitude: 77.5946,
    });

  // Load events timeline for selected ticket overlay
  const { data: selectedTicketEvents = [], isLoading: loadingEvents } =
    useTicketEvents(selectedTicket?.id || "");

  const [chatInput, setChatInput] = useState("");

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
        photoUrls: ["https://picsum.photos/400/300"],
        isAnonymous: false,
      });
      alert(
        isSavedOffline
          ? "Connection offline! Saved to sync queue."
          : "Grievance submitted successfully!",
      );
      setDescription("");
      setCurrentTab("MAP");
    } catch (e) {
      console.error(e);
    }
  };

  const handleContribute = async (ticketId: string) => {
    try {
      const updated = await contributeComplaint({
        id: ticketId,
        description: "Upvoted and supported by citizen verification.",
        photoUrls: [],
      });
      setSelectedTicket(updated);
      alert(
        "Your support was logged! Authorities notified of increased severity.",
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  const activeIconColor = "#4F46E5";
  const inactiveIconColor = theme === "dark" ? "#9CA3AF" : "#475569";

  if (!isAuthenticated) {
    return (
      <View
        className={`flex-1 justify-center px-6 ${theme === "dark" ? "bg-darkBackground" : "bg-background"}`}
      >
        <GlassCard className="space-y-6">
          <View className="items-center mb-6">
            <Text className="text-accent font-bold text-3xl tracking-tight">
              RoadWatch
            </Text>
            <Text className="text-textSecondary dark:text-darkTextSecondary text-xs mt-1">
              Citizen Empowerment Portal
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-textPrimary dark:text-darkTextPrimary text-xs font-bold mb-2">
                PHONE NUMBER
              </Text>
              <TextInput
                className="bg-white dark:bg-[#121829] text-textPrimary dark:text-darkTextPrimary border border-borderBg dark:border-darkBorderBg rounded-xl px-4 py-3"
                placeholder="+91 99999 99999"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View className="mt-4">
              <Text className="text-textPrimary dark:text-darkTextPrimary text-xs font-bold mb-2">
                ENTER OTP
              </Text>
              <TextInput
                className="bg-white dark:bg-[#121829] text-textPrimary dark:text-darkTextPrimary border border-borderBg dark:border-darkBorderBg rounded-xl px-4 py-3"
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
                <Text className="text-white font-bold text-base">
                  Verify & Register
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 pt-12 ${theme === "dark" ? "bg-darkBackground" : "bg-background"}`}
    >
      {/* Header Panel */}
      <View className="px-6 pb-4 border-b border-borderBg dark:border-darkBorderBg flex-row justify-between items-center">
        <View>
          <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-lg">
            Welcome, {user?.name}
          </Text>
          <Text className="text-textSecondary dark:text-darkTextSecondary text-xs">
            {user?.phone}
          </Text>
        </View>

        <View className="flex-row items-center">
          {/* Dynamic Theme Toggle Switch */}
          <TouchableOpacity
            onPress={toggleTheme}
            className="p-2 bg-cardBg dark:bg-darkCardBg border border-borderBg dark:border-darkBorderBg rounded-xl mr-3"
          >
            {theme === "dark" ? (
              <Sun size={18} color="#F59E0B" />
            ) : (
              <Moon size={18} color="#4F46E5" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={logout}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
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
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dynamic Tab Body rendering */}
      <ScrollView className="flex-1 px-4 mt-4">
        {currentTab === "MAP" && (
          <View className="space-y-4 pb-12">
            <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-lg mb-2">
              Nearby Grid Grievances
            </Text>
            {isLoadingTickets ? (
              <ActivityIndicator color="#4F46E5" size="large" />
            ) : (
              <LeafletMap
                nearbyTickets={nearbyTickets}
                center={{ latitude: 12.9716, longitude: 77.5946 }}
                onLocationSelect={(point) => {
                  setSelectedPoint(point);
                  setSelectedTicket(null); // Close active ticket when maps clicked
                }}
                onTicketSelect={setSelectedTicket}
              />
            )}

            {/* Ticket details sliding drawer card if marker is clicked */}
            {selectedTicket ? (
              <GlassCard className="mt-4 border-l-4 border-l-accent shadow-xl animate-slide-in">
                <View className="flex-row justify-between items-start mb-2 border-b border-borderBg dark:border-darkBorderBg pb-3">
                  <View className="flex-1">
                    <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary font-bold uppercase tracking-wider">
                      Ticket {selectedTicket.id}
                    </Text>
                    <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-sm mt-0.5">
                      {selectedTicket.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedTicket(null)}
                    className="p-1 rounded bg-borderBg dark:bg-darkBorderBg"
                  >
                    <Text className="text-textSecondary dark:text-darkTextSecondary text-[10px] font-bold px-1.5 py-0.5">
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Left side thumbnail and detail specs */}
                <View className="flex-row items-center space-x-3 mb-4">
                  {selectedTicket.photoUrls && selectedTicket.photoUrls[0] && (
                    <Image
                      source={{ uri: selectedTicket.photoUrls[0] }}
                      className="w-16 h-16 rounded-xl bg-slate-200"
                    />
                  )}
                  <View className="flex-1">
                    <Text
                      className="text-textSecondary dark:text-darkTextSecondary text-xs leading-relaxed"
                      numberOfLines={2}
                    >
                      {selectedTicket.description}
                    </Text>
                    <View className="flex-row items-center space-x-2 mt-1.5">
                      <Clock size={12} color={inactiveIconColor} />
                      <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary font-semibold">
                        SLA Limit:{" "}
                        {new Date(
                          selectedTicket.slaDeadline,
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* dynamic workflow timeline updates */}
                <Text className="text-textPrimary dark:text-darkTextPrimary text-xs font-bold mb-1 tracking-wider uppercase">
                  Grievance Progress timeline
                </Text>
                {loadingEvents ? (
                  <ActivityIndicator
                    color="#4F46E5"
                    size="small"
                    className="py-4"
                  />
                ) : (
                  <TicketTimeline events={selectedTicketEvents} />
                )}

                {/* Contribute upvote buttons */}
                <View className="flex-row items-center justify-between pt-3 border-t border-borderBg dark:border-darkBorderBg mt-3">
                  <View className="flex-row items-center space-x-1.5">
                    <Heart size={14} color="#EF4444" fill="#EF4444" />
                    <Text className="text-xs text-textSecondary dark:text-darkTextSecondary font-bold">
                      {selectedTicket.contributorCount} citizens upvoted
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleContribute(selectedTicket.id)}
                    disabled={isContributing}
                    className="px-4 py-2 bg-accent dark:bg-darkAccent rounded-xl flex-row items-center"
                  >
                    <Text className="text-white text-xs font-bold">
                      Me Too (Upvote)
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ) : (
              <GlassCard className="mt-4">
                <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-sm mb-2">
                  Selected Coordinates
                </Text>
                <Text className="text-textSecondary dark:text-darkTextSecondary text-xs font-semibold">
                  Lat: {selectedPoint.latitude.toFixed(6)} | Lng:{" "}
                  {selectedPoint.longitude.toFixed(6)}
                </Text>
              </GlassCard>
            )}
          </View>
        )}

        {currentTab === "REPORT" && (
          <View className="space-y-4">
            <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-lg mb-2">
              Report Road Grievance
            </Text>

            <View>
              <Text className="text-textPrimary dark:text-darkTextPrimary text-xs font-bold mb-2">
                CATEGORY
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(
                  [
                    "POTHOLE",
                    "LIGHTING",
                    "SIGNAGE",
                    "ROAD_QUALITY",
                    "OTHER",
                  ] as TicketCategory[]
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-4 py-2 rounded-lg border ${
                      category === cat
                        ? "bg-accent border-accent"
                        : "bg-white dark:bg-[#121829] border-borderBg dark:border-darkBorderBg"
                    }`}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      className={`text-xs font-bold ${category === cat ? "text-white" : "text-textPrimary dark:text-darkTextPrimary"}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-textPrimary dark:text-darkTextPrimary text-xs font-bold mb-2">
                DESCRIPTION
              </Text>
              <TextInput
                className="bg-white dark:bg-[#121829] text-textPrimary dark:text-darkTextPrimary border border-borderBg dark:border-darkBorderBg rounded-xl px-4 py-3 h-24"
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
                <Text className="text-white font-bold text-base">
                  File Grievance
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentTab === "CHAT" && (
          <View className="flex-1 h-[450px]">
            <ScrollView className="flex-1 pr-2">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <ActivityIndicator
                  color="#4F46E5"
                  size="small"
                  className="self-start m-2"
                />
              )}
            </ScrollView>

            <View className="flex-row items-center border-t border-borderBg dark:border-darkBorderBg pt-4 mt-2">
              <TextInput
                className="flex-1 bg-white dark:bg-[#121829] text-textPrimary dark:text-darkTextPrimary border border-borderBg dark:border-darkBorderBg rounded-xl px-4 py-3"
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

        {/* 4th Navigation Tab: Budgets Explorer */}
        {currentTab === "BUDGET" && (
          <View className="space-y-6 pb-12">
            <View>
              <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-lg">
                Open Budgets
              </Text>
              <Text className="text-textSecondary dark:text-darkTextSecondary text-xs mt-0.5">
                Jurisdiction: Central PWD Division
              </Text>
            </View>

            {/* Financial aggregations card summaries */}
            <View className="grid gap-4">
              <GlassCard className="flex-row justify-between items-center py-5">
                <View>
                  <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary font-bold uppercase tracking-wider">
                    Sanctioned Funding
                  </Text>
                  <Text className="text-2xl font-black text-textPrimary dark:text-darkTextPrimary mt-1">
                    ₹{(budgetSummary.totalSanctioned / 10000000).toFixed(1)} Cr
                  </Text>
                </View>
                <View className="p-2.5 bg-accent/15 rounded-xl border border-accent/20">
                  <DollarSign size={20} color="#4F46E5" />
                </View>
              </GlassCard>

              <GlassCard className="flex-row justify-between items-center py-5">
                <View>
                  <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary font-bold uppercase tracking-wider">
                    Spent & Utilized
                  </Text>
                  <Text className="text-2xl font-black text-success dark:text-darkSuccess mt-1">
                    ₹{(budgetSummary.totalUtilized / 10000000).toFixed(1)} Cr
                  </Text>
                </View>
                <View className="p-2.5 bg-success/15 rounded-xl border border-success/20">
                  <Award size={20} color="#16A34A" />
                </View>
              </GlassCard>
            </View>

            {/* Dynamic scheme checklists */}
            <GlassCard className="space-y-4">
              <Text className="text-textPrimary dark:text-darkTextPrimary font-bold text-sm tracking-wider uppercase border-b border-borderBg dark:border-darkBorderBg pb-2 mb-2">
                Allocation Schemes
              </Text>
              {loadingBudgets ? (
                <ActivityIndicator color="#4F46E5" size="small" />
              ) : (
                budgets.map((scheme: BudgetSchemeDetails, idx: number) => {
                  const utilPercent =
                    (scheme.utilizedAmount / scheme.releasedAmount) * 100;
                  return (
                    <View
                      key={idx}
                      className="p-4 rounded-xl bg-white dark:bg-[#121829] border border-borderBg dark:border-darkBorderBg space-y-3"
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-textPrimary dark:text-darkTextPrimary">
                            {scheme.schemeName}
                          </Text>
                          <Text className="text-[9px] text-accent font-bold mt-1 uppercase">
                            {scheme.authorityType}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-textSecondary dark:text-darkTextSecondary font-semibold">
                          {scheme.financialYear}
                        </Text>
                      </View>

                      {/* Progress bar and utilization */}
                      <View className="space-y-1">
                        <View className="flex-row justify-between text-[10px] font-bold">
                          <Text className="text-textSecondary dark:text-darkTextSecondary">
                            Utilization Rate
                          </Text>
                          <Text className="text-success">
                            {utilPercent.toFixed(1)}%
                          </Text>
                        </View>
                        <View className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-success rounded-full"
                            style={{ width: `${utilPercent}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Tab Navigation Controls */}
      <View className="flex-row border-t border-borderBg dark:border-darkBorderBg bg-cardBg dark:bg-darkCardBg py-4 px-6 justify-between">
        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => {
            setCurrentTab("MAP");
            setSelectedTicket(null);
          }}
        >
          <MapPin
            size={20}
            color={currentTab === "MAP" ? activeIconColor : inactiveIconColor}
          />
          <Text
            className={`text-[10px] mt-1 ${currentTab === "MAP" ? "text-accent font-bold" : "text-textSecondary dark:text-darkTextSecondary"}`}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab("REPORT")}
        >
          <FileText
            size={20}
            color={
              currentTab === "REPORT" ? activeIconColor : inactiveIconColor
            }
          />
          <Text
            className={`text-[10px] mt-1 ${currentTab === "REPORT" ? "text-accent font-bold" : "text-textSecondary dark:text-darkTextSecondary"}`}
          >
            File ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab("CHAT")}
        >
          <MessageSquare
            size={20}
            color={currentTab === "CHAT" ? activeIconColor : inactiveIconColor}
          />
          <Text
            className={`text-[10px] mt-1 ${currentTab === "CHAT" ? "text-accent font-bold" : "text-textSecondary dark:text-darkTextSecondary"}`}
          >
            AI Helper
          </Text>
        </TouchableOpacity>

        {/* 4th Tab Navigation control button */}
        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => setCurrentTab("BUDGET")}
        >
          <DollarSign
            size={20}
            color={
              currentTab === "BUDGET" ? activeIconColor : inactiveIconColor
            }
          />
          <Text
            className={`text-[10px] mt-1 ${currentTab === "BUDGET" ? "text-accent font-bold" : "text-textSecondary dark:text-darkTextSecondary"}`}
          >
            Budgets
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default AppNavigator;
