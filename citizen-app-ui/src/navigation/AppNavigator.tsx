import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
// Lazy-load expo-speech-recognition to avoid crash in Expo Go (no native module)
let SpeechModule: any = null;
try {
  SpeechModule = require("expo-speech-recognition").ExpoSpeechRecognitionModule;
} catch {
  console.warn("expo-speech-recognition native module not available (Expo Go). Using manual input fallback.");
}
import { useAuthController } from "../controllers/useAuthController";
import { useComplaintController } from "../controllers/useComplaintController";
import { useOfflineSyncController } from "../controllers/useOfflineSyncController";
import { useChatSessionController } from "../controllers/useChatSessionController";
import { useBudgetController } from "../controllers/useBudgetController";
import { BudgetSchemeDetails } from "../api/services/budgetApi";
import { useThemeStore } from "../state/themeStore";
import { NativeGoogleMap } from "../components/NativeGoogleMap";
import * as Location from "expo-location";
import { ChatBubble } from "../components/ChatBubble";
import { GlassCard } from "../components/GlassCard";
import { TicketTimeline } from "../components/TicketTimeline";
import { TicketCategory, LocationPoint, Ticket } from "../api/types";
import { Colors } from "../styles/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  Mic,
  Volume2,
  ChevronLeft,
  Camera,
  PlusCircle,
  History,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
} from "lucide-react-native";

export const AppNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, isLoggingIn, loginError, login, signup, logout } =
    useAuthController();
  const {
    submitComplaint,
    isSubmitting,
    useNearbyTickets,
    useTicketEvents,
    useMyTickets,
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
  const isDark = theme === "dark";
  const currentColors = isDark ? Colors.dark : Colors.light;

  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupAadhar, setSignupAadhar] = useState("");
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

  // Report sub-modes, GPS Camera simulator and user tickets states
  const [reportSubMode, setReportSubMode] = useState<"SELECT" | "CAMERA" | "DESCRIPTION" | "VIEW">("SELECT");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [cameraTelemetry, setCameraTelemetry] = useState({
    lat: 12.9716,
    lng: 77.5946,
    alt: 92.4,
    speed: 0.2,
    accuracy: 3.5,
    timestamp: "",
    address: "IIT Madras, Adyar, Chennai"
  });

  // Fetch tickets registered by the logged-in citizen
  const { data: myTickets = [], isLoading: isLoadingMyTickets, refetch: refetchMyTickets } = useMyTickets(user?.id);

  // Chat sub-modes and voice simulator states
  const [chatSubMode, setChatSubMode] = useState<"SELECT" | "TEXT" | "VOICE">("SELECT");
  const [isListening, setIsListening] = useState(false);
  const [voiceSimInput, setVoiceSimInput] = useState("");

  // User location and Map Center states
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<LocationPoint>({
    latitude: 12.9716,
    longitude: 77.5946,
  });

  // Geolocation trigger to ask permission and fetch live position
  useEffect(() => {
    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Foreground location permission denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const currentPt = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(currentPt);
        setMapCenter(currentPt);
        setSelectedPoint(currentPt);
      } catch (err) {
        console.warn("Failed getting user location", err);
      }
    }
    requestLocation();
  }, [isAuthenticated]);

  // Scans chat message contents for user intent and switches tabs automatically if they want to report
  const checkComplaintIntent = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    if (
      lower.includes("complain") || 
      lower.includes("complaint") || 
      lower.includes("report") ||
      lower.includes("pothole") ||
      lower.includes("streetlight") ||
      lower.includes("road quality")
    ) {
      alert("Directing you to the Grievance & GPS Camera section...");
      setCurrentTab("REPORT");
      setReportSubMode("SELECT");
      return true;
    }
    return false;
  };

  // Telemetry sensor listener to reverse-geocode coordinates inside GPS Camera viewfinder in real-time
  useEffect(() => {
    if (reportSubMode === "CAMERA") {
      const fetchCameraTelemetry = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          // Reverse geocode
          const [addr] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
          const street = addr 
            ? `${addr.streetNumber || ""} ${addr.street || ""}, ${addr.subregion || addr.district || ""}, ${addr.city || ""}`.trim().replace(/^,\s*/, "") 
            : "IIT Madras, Adyar Sector";
          setCameraTelemetry({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            alt: loc.coords.altitude || 42.5,
            speed: (loc.coords.speed || 0) * 3.6, // m/s to km/h
            accuracy: loc.coords.accuracy || 4.2,
            timestamp: new Date().toLocaleString(),
            address: street || "IIT Madras Adyar Sector, Chennai"
          });
        } catch (e) {
          console.warn("Could not load high accuracy GPS telemetry, using fallback");
          setCameraTelemetry({
            lat: selectedPoint.latitude,
            lng: selectedPoint.longitude,
            alt: 92.4,
            speed: 0.2,
            accuracy: 3.5,
            timestamp: new Date().toLocaleString(),
            address: "IIT Madras, Adyar, Chennai"
          });
        }
      };
      fetchCameraTelemetry();
    }
  }, [reportSubMode]);

  // Listen for native speech recognition events (only when native module is available)
  useEffect(() => {
    if (!SpeechModule) return;

    const startSub = SpeechModule.addListener("start", () => {
      setIsListening(true);
    });

    const endSub = SpeechModule.addListener("end", () => {
      setIsListening(false);
    });

    const resultSub = SpeechModule.addListener("result", (event: any) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0].transcript;
        setVoiceSimInput(transcript);
        
        if (event.isFinal && transcript.trim()) {
          const wasRouted = checkComplaintIntent(transcript.trim());
          if (!wasRouted) {
            sendMessage(transcript.trim());
          }
          setVoiceSimInput("");
        }
      }
    });

    const errorSub = SpeechModule.addListener("error", (event: any) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
    });

    return () => {
      startSub.remove();
      endSub.remove();
      resultSub.remove();
      errorSub.remove();
    };
  }, []);

  // Load nearby tickets dynamically based on center coordinate
  const { data: nearbyTickets = [], isLoading: isLoadingTickets } =
    useNearbyTickets(mapCenter);

  // Load events timeline for selected ticket overlay
  const { data: selectedTicketEvents = [], isLoading: loadingEvents } =
    useTicketEvents(selectedTicket?.id || "");

  const [chatInput, setChatInput] = useState("");

  const handleLoginSubmit = async () => {
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }
    try {
      await login(phone.trim());
    } catch (e) {
      // Handled in controller/error state
    }
  };

  const handleSignupSubmit = async () => {
    if (!signupName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }
    try {
      await signup(signupName.trim(), phone.trim(), signupEmail.trim(), signupAadhar.trim());
    } catch (e) {
      // Handled in controller/error state
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPhone("");
      setSignupName("");
      setSignupEmail("");
      setSignupAadhar("");
    } catch (e) {
      console.error("Logout failed", e);
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
    const wasRouted = checkComplaintIntent(chatInput);
    if (!wasRouted) {
      sendMessage(chatInput);
    }
    setChatInput("");
  };

  const startRecording = async () => {
    if (!SpeechModule) {
      // Native module unavailable (Expo Go) — toggle manual input mode
      setIsListening(true);
      return;
    }

    try {
      const { status } = await SpeechModule.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Microphone and speech recognition permissions are required to use voice mode.");
        return;
      }

      setVoiceSimInput("");
      setIsListening(true);

      SpeechModule.start({
        lang: "en-US",
        interimResults: true,
      });
    } catch (err) {
      console.warn("Native speech recognition start failed, using manual input", err);
      setIsListening(true);
    }
  };

  const stopRecording = () => {
    if (!SpeechModule) {
      setIsListening(false);
      return;
    }

    try {
      SpeechModule.stop();
    } catch (err) {
      console.warn("Failed to stop speech recognition", err);
      setIsListening(false);
    }
  };

  const toggleSpeechToText = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleQuickSpeak = (text: string) => {
    setIsListening(false);
    const wasRouted = checkComplaintIntent(text);
    if (!wasRouted) {
      sendMessage(text);
    }
  };

  const handleVoiceSimSubmit = () => {
    if (!voiceSimInput.trim()) return;
    setIsListening(false);
    const wasRouted = checkComplaintIntent(voiceSimInput);
    if (!wasRouted) {
      sendMessage(voiceSimInput);
    }
    setVoiceSimInput("");
  };

  const renderSelectMode = () => {
    return (
      <View style={styles.selectContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <MessageSquare size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.logoText, { color: currentColors.textPrimary }]}>RoadWatch AI</Text>
          <Text style={[styles.logoSubText, { color: currentColors.textSecondary }]}>
            Intelligent Citizen Copilot
          </Text>
        </View>

        <Text style={[styles.selectPrompt, { color: currentColors.textPrimary }]}>
          Select Interaction Mode
        </Text>

        <TouchableOpacity 
          style={styles.selectCard} 
          onPress={() => setChatSubMode("TEXT")}
        >
          <GlassCard style={styles.innerCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <MessageSquare size={24} color="#4F46E5" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={[styles.cardTitle, { color: currentColors.textPrimary }]}>
                  Text Chat Assistant
                </Text>
                <Text style={[styles.cardDesc, { color: currentColors.textSecondary }]}>
                  Submit issues, query status, or explore budget schemes in details.
                </Text>
              </View>
            </View>
            <View style={styles.cardFooterBtn}>
              <Text style={styles.cardFooterText}>Enter Chat Mode</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.selectCard} 
          onPress={() => setChatSubMode("VOICE")}
        >
          <GlassCard style={styles.innerCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBoxMic}>
                <Mic size={24} color="#10B981" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={[styles.cardTitle, { color: currentColors.textPrimary }]}>
                  Voice Conversational Assistant
                </Text>
                <Text style={[styles.cardDesc, { color: currentColors.textSecondary }]}>
                  Hands-free verbal interface. Tap to speak or select quick-voice shortcuts.
                </Text>
              </View>
            </View>
            <View style={styles.cardFooterBtnMic}>
              <Text style={styles.cardFooterTextMic}>Enter Voice Mode</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTextMode = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={[styles.subHeader, { borderColor: currentColors.borderBg }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => setChatSubMode("SELECT")}
          >
            <ChevronLeft size={20} color={currentColors.textPrimary} />
            <Text style={[styles.backBtnText, { color: currentColors.textPrimary }]}>Back</Text>
          </TouchableOpacity>
          <View style={styles.modeIndicator}>
            <View style={styles.onlineDot} />
            <Text style={[styles.modeIndicatorText, { color: currentColors.textSecondary }]}>
              Chat Mode
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.chatMessageScroll} 
          contentContainerStyle={{ paddingBottom: 16 }}
          ref={(ref) => {
            setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
          }}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && (
            <ActivityIndicator
              color="#4F46E5"
              size="small"
              style={styles.aiStreamingIndicator}
            />
          )}
        </ScrollView>

        <View style={[styles.chatInputRow, { borderColor: currentColors.borderBg, paddingBottom: 8 }]}>
          <TextInput
            style={[
              styles.chatTextInput,
              {
                backgroundColor: isDark ? "#121829" : "#FFFFFF",
                color: currentColors.textPrimary,
                borderColor: currentColors.borderBg,
              },
            ]}
            placeholder="Ask AI or type issue to submit..."
            placeholderTextColor="#6B7280"
            value={chatInput}
            onChangeText={setChatInput}
          />
          <TouchableOpacity
            style={styles.chatSendBtn}
            onPress={handleChatSend}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderVoiceMode = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={[styles.subHeader, { borderColor: currentColors.borderBg }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => {
              setChatSubMode("SELECT");
              setIsListening(false);
            }}
          >
            <ChevronLeft size={20} color={currentColors.textPrimary} />
            <Text style={[styles.backBtnText, { color: currentColors.textPrimary }]}>Back</Text>
          </TouchableOpacity>
          <View style={styles.modeIndicator}>
            <View style={[styles.onlineDot, { backgroundColor: isListening ? "#10B981" : "#D97706" }]} />
            <Text style={[styles.modeIndicatorText, { color: currentColors.textSecondary }]}>
              {isListening ? "Listening..." : "Conversational Mode"}
            </Text>
          </View>
        </View>

        <GlassCard style={styles.waveformContainer}>
          {isListening ? (
            <View style={styles.voiceWavesRow}>
              <View style={[styles.waveBar, styles.waveBar1]} />
              <View style={[styles.waveBar, styles.waveBar2]} />
              <View style={[styles.waveBar, styles.waveBar3]} />
              <View style={[styles.waveBar, styles.waveBar4]} />
              <View style={[styles.waveBar, styles.waveBar3]} />
              <View style={[styles.waveBar, styles.waveBar2]} />
              <View style={[styles.waveBar, styles.waveBar1]} />
            </View>
          ) : (
            <Text style={[styles.waveformText, { color: currentColors.textSecondary }]}>
              Hands-Free System Ready
            </Text>
          )}

          <TouchableOpacity 
            style={[
              styles.micButtonPulse, 
              isListening ? styles.micActivePulse : styles.micInactivePulse
            ]}
            onPress={toggleSpeechToText}
          >
            <Mic size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={[styles.micStatusText, { color: currentColors.textPrimary }]}>
            {isListening ? "Listening... Speak now" : "Tap Mic to Talk"}
          </Text>
        </GlassCard>

        <GlassCard style={styles.voiceSimCard}>
          <Text style={[styles.voiceSimTitle, { color: currentColors.textPrimary }]}>
            {isListening ? "Speak now or type below" : "Type your message to speak"}
          </Text>
          <View style={styles.voiceSimInputRow}>
            <TextInput
              style={[
                styles.voiceSimInput,
                {
                  backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
                  color: currentColors.textPrimary,
                  borderColor: currentColors.borderBg,
                },
              ]}
              placeholder={isListening ? "Listening... or type here" : "Type what you want to say..."}
              placeholderTextColor="#6B7280"
              value={voiceSimInput}
              onChangeText={setVoiceSimInput}
            />
            <TouchableOpacity
              style={styles.voiceSimSend}
              onPress={handleVoiceSimSubmit}
            >
              <Send size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={[styles.transcriptHeading, { color: currentColors.textPrimary }]}>
          Speech Log
        </Text>
        
        <ScrollView 
          style={styles.transcriptScroll}
          contentContainerStyle={{ paddingBottom: 16 }}
          ref={(ref) => {
            setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View 
                key={msg.id} 
                style={[
                  styles.transcriptBubbleRow, 
                  isUser ? styles.transcriptUserRow : styles.transcriptBotRow
                ]}
              >
                <View 
                  style={[
                    styles.transcriptBubble,
                    isUser
                      ? [styles.transcriptUserBubble, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)" }]
                      : [styles.transcriptBotBubble, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)" }],
                    { borderColor: isUser ? "rgba(16, 185, 129, 0.3)" : currentColors.borderBg }
                  ]}
                >
                  <View style={styles.transcriptRoleHeader}>
                    {isUser ? (
                      <>
                        <Mic size={10} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={[styles.transcriptRoleText, { color: "#10B981" }]}>
                          Spoken Speech
                        </Text>
                      </>
                    ) : (
                      <>
                        <Volume2 size={10} color="#4F46E5" style={{ marginRight: 4 }} />
                        <Text style={[styles.transcriptRoleText, { color: "#4F46E5" }]}>
                          Voice Assistant Response
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={[styles.transcriptContent, { color: currentColors.textPrimary }]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}
          {isStreaming && (
            <ActivityIndicator
              color="#4F46E5"
              size="small"
              style={styles.aiStreamingIndicator}
            />
          )}
        </ScrollView>

        <View style={styles.quickSpeakContainer}>
          <Text style={[styles.quickSpeakHeading, { color: currentColors.textSecondary }]}>
            Quick-Speak Prompts (Tap to say)
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSpeakScroll}
          >
            {[
              "Report a pothole at my current location",
              "What is the total sanctioned funding budget?",
              "Are there any road quality complaints nearby?",
              "Show me allocation schemes under CWD",
            ].map((promptText, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickSpeakPill,
                  {
                    backgroundColor: isDark ? "#121829" : "#FFFFFF",
                    borderColor: currentColors.borderBg,
                  }
                ]}
                onPress={() => handleQuickSpeak(promptText)}
              >
                <Mic size={12} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={[styles.quickSpeakPillText, { color: currentColors.textPrimary }]}>
                  {"\""}{promptText}{"\""}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const activeIconColor = "#4F46E5";
  const inactiveIconColor = isDark ? "#9CA3AF" : "#475569";

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.loginContainer,
          { 
            backgroundColor: currentColors.background,
            paddingTop: insets.top || 12,
            paddingBottom: insets.bottom || 12,
          },
        ]}
      >
        <GlassCard style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>RoadWatch</Text>
            <Text
              style={[
                styles.loginSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              Citizen Empowerment Portal
            </Text>
          </View>

          {/* Toggle Tab Bar */}
          <View style={styles.authTabRow}>
            <TouchableOpacity
              style={[styles.authTabBtn, authMode === "LOGIN" && styles.authTabBtnActive]}
              onPress={() => setAuthMode("LOGIN")}
            >
              <Text style={[styles.authTabBtnText, { color: authMode === "LOGIN" ? "#FFFFFF" : currentColors.textSecondary }]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authTabBtn, authMode === "SIGNUP" && styles.authTabBtnActive]}
              onPress={() => setAuthMode("SIGNUP")}
            >
              <Text style={[styles.authTabBtnText, { color: authMode === "SIGNUP" ? "#FFFFFF" : currentColors.textSecondary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message banner */}
          {loginError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          )}

          <View style={styles.loginForm}>
            {authMode === "SIGNUP" && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>
                  FULL NAME
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? "#121829" : "#FFFFFF",
                      color: currentColors.textPrimary,
                      borderColor: currentColors.borderBg,
                    },
                  ]}
                  placeholder="Jane Doe"
                  placeholderTextColor="#6B7280"
                  value={signupName}
                  onChangeText={setSignupName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>
                PHONE NUMBER
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? "#121829" : "#FFFFFF",
                    color: currentColors.textPrimary,
                    borderColor: currentColors.borderBg,
                  },
                ]}
                placeholder="9999999999"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {authMode === "SIGNUP" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>
                    EMAIL ADDRESS (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? "#121829" : "#FFFFFF",
                        color: currentColors.textPrimary,
                        borderColor: currentColors.borderBg,
                      },
                    ]}
                    placeholder="jane.doe@example.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>
                    AADHAR NUMBER (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? "#121829" : "#FFFFFF",
                        color: currentColors.textPrimary,
                        borderColor: currentColors.borderBg,
                      },
                    ]}
                    placeholder="1234 5678 9012"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    value={signupAadhar}
                    onChangeText={setSignupAadhar}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={authMode === "LOGIN" ? handleLoginSubmit : handleSignupSubmit}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {authMode === "LOGIN" ? "Sign In" : "Register Profile"}
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
      style={[
        styles.mainContainer,
        { 
          backgroundColor: currentColors.background,
          paddingTop: insets.top || 12,
        },
      ]}
    >
      {/* Header Panel */}
      <View style={[styles.header, { borderColor: currentColors.borderBg }]}>
        <View>
          <Text style={[styles.welcomeText, { color: currentColors.textPrimary }]}>
            Welcome, {user?.name}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Dynamic Theme Toggle Switch */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.themeToggle,
              {
                backgroundColor: currentColors.cardBg,
                borderColor: currentColors.borderBg,
              },
            ]}
          >
            {isDark ? (
              <Sun size={18} color="#F59E0B" />
            ) : (
              <Moon size={18} color="#4F46E5" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Sync Banner if actions queued */}
      {queueLength > 0 && (
        <View style={[styles.syncBanner, { backgroundColor: currentColors.warning }]}>
          <View style={styles.syncBannerLeft}>
            <WifiOff size={16} color="#0B0F19" style={styles.syncIcon} />
            <Text style={styles.syncText}>
              {queueLength} offline action(s) queued.
            </Text>
          </View>
          <TouchableOpacity onPress={triggerManualSync} disabled={isSyncing}>
            <Text style={styles.syncLink}>
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dynamic Tab Body rendering */}
      {currentTab === "CHAT" ? (
        <View style={[styles.flex1, { paddingHorizontal: 16, marginTop: 16 }]}>
          {chatSubMode === "SELECT" && renderSelectMode()}
          {chatSubMode === "TEXT" && renderTextMode()}
          {chatSubMode === "VOICE" && renderVoiceMode()}
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {currentTab === "MAP" && (
            <View style={styles.tabContainer}>
              <Text style={[styles.tabTitle, { color: currentColors.textPrimary }]}>
                Nearby Grid Grievances
              </Text>
              {isLoadingTickets ? (
                <ActivityIndicator color="#4F46E5" size="large" />
              ) : (
                <NativeGoogleMap
                  nearbyTickets={nearbyTickets}
                  center={mapCenter}
                  userLocation={userLocation}
                  onLocationSelect={(point) => {
                    setSelectedPoint(point);
                    setSelectedTicket(null); // Close active ticket when maps clicked
                  }}
                  onTicketSelect={setSelectedTicket}
                />
              )}

              {/* Ticket details sliding drawer card if marker is clicked */}
              {selectedTicket ? (
                <GlassCard style={styles.ticketCard}>
                  <View style={[styles.ticketCardHeader, { borderColor: currentColors.borderBg }]}>
                    <View style={styles.flex1}>
                      <Text style={[styles.ticketId, { color: currentColors.textSecondary }]}>
                        Ticket {selectedTicket.id}
                      </Text>
                      <Text style={[styles.ticketTitle, { color: currentColors.textPrimary }]}>
                        {selectedTicket.title}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedTicket(null)}
                      style={[styles.closeButton, { backgroundColor: currentColors.borderBg }]}
                    >
                      <Text style={[styles.closeButtonText, { color: currentColors.textSecondary }]}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Left side thumbnail and detail specs */}
                  <View style={styles.ticketDetails}>
                    {selectedTicket.photoUrls && selectedTicket.photoUrls[0] && (
                      <Image
                        source={{ uri: selectedTicket.photoUrls[0] }}
                        style={styles.ticketImage}
                      />
                    )}
                    <View style={styles.flex1}>
                      <Text
                        style={[styles.ticketDesc, { color: currentColors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {selectedTicket.description}
                      </Text>
                      <View style={styles.slaContainer}>
                        <Clock size={12} color={inactiveIconColor} />
                        <Text style={[styles.slaText, { color: currentColors.textSecondary }]}>
                          SLA Limit:{" "}
                          {new Date(
                            selectedTicket.slaDeadline,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* dynamic workflow timeline updates */}
                  <Text style={[styles.sectionHeading, { color: currentColors.textPrimary }]}>
                    Grievance Progress timeline
                  </Text>
                  {loadingEvents ? (
                    <ActivityIndicator
                      color="#4F46E5"
                      size="small"
                      style={{ paddingVertical: 16 }}
                    />
                  ) : (
                    <TicketTimeline events={selectedTicketEvents} />
                  )}

                  {/* Contribute upvote buttons */}
                  <View style={[styles.ticketFooter, { borderColor: currentColors.borderBg }]}>
                    <View style={styles.upvotesCount}>
                      <Heart size={14} color="#EF4444" fill="#EF4444" />
                      <Text style={[styles.upvotesText, { color: currentColors.textSecondary }]}>
                        {selectedTicket.contributorCount} citizens upvoted
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleContribute(selectedTicket.id)}
                      disabled={isContributing}
                      style={styles.upvoteButton}
                    >
                      <Text style={styles.upvoteButtonText}>
                        Me Too (Upvote)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard style={{ marginTop: 16 }}>
                  <Text style={[styles.coordinatesTitle, { color: currentColors.textPrimary }]}>
                    Selected Coordinates
                  </Text>
                  <Text style={[styles.coordinatesText, { color: currentColors.textSecondary }]}>
                    Lat: {selectedPoint.latitude.toFixed(6)} | Lng:{" "}
                    {selectedPoint.longitude.toFixed(6)}
                  </Text>
                </GlassCard>
              )}
            </View>
          )}
          {currentTab === "REPORT" && (
            <View style={styles.tabContainer}>
              {/* COMPLAINT PORTAL SELECTOR SCREEN */}
              {reportSubMode === "SELECT" && (
                <View style={styles.reportPortalSelect}>
                  <View style={styles.portalHeadingBox}>
                    <Text style={[styles.tabTitle, { color: currentColors.textPrimary }]}>
                      Grievance Center
                    </Text>
                    <Text style={[styles.portalSubText, { color: currentColors.textSecondary }]}>
                      Submit GPS-verified road hazard complaints or track your existing active tickets.
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.portalCard} 
                    onPress={() => setReportSubMode("CAMERA")}
                  >
                    <GlassCard style={styles.portalInnerCard}>
                      <View style={[styles.portalIconBox, { backgroundColor: "rgba(79, 70, 229, 0.1)" }]}>
                        <Camera size={28} color="#4F46E5" />
                      </View>
                      <View style={styles.portalCardContent}>
                        <Text style={[styles.portalCardTitle, { color: currentColors.textPrimary }]}>
                          File New Grievance
                        </Text>
                        <Text style={[styles.portalCardDesc, { color: currentColors.textSecondary }]}>
                          Activate telemetry GPS camera to photograph potholes, broken street lights, or signage issues.
                        </Text>
                        <View style={[styles.portalCardBadge, { backgroundColor: "#4F46E5" }]}>
                          <Text style={styles.portalCardBadgeText}>Open GPS Camera</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.portalCard} 
                    onPress={async () => {
                      await refetchMyTickets();
                      setReportSubMode("VIEW");
                    }}
                  >
                    <GlassCard style={styles.portalInnerCard}>
                      <View style={[styles.portalIconBox, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                        <History size={28} color="#10B981" />
                      </View>
                      <View style={styles.portalCardContent}>
                        <Text style={[styles.portalCardTitle, { color: currentColors.textPrimary }]}>
                          View Existing Complaints
                        </Text>
                        <Text style={[styles.portalCardDesc, { color: currentColors.textSecondary }]}>
                          Monitor live resolution states, Junior Engineer logs, and tracking details for your registered reports.
                        </Text>
                        <View style={[styles.portalCardBadge, { backgroundColor: "#10B981" }]}>
                          <Text style={styles.portalCardBadgeText}>Check My History ({myTickets.length})</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </View>
              )}

              {/* TELEMETRY GPS CAMERA VIEW */}
              {reportSubMode === "CAMERA" && (
                <View style={styles.cameraContainer}>
                  <View style={styles.cameraTopRow}>
                    <TouchableOpacity 
                      style={[styles.cameraBackBtn, { backgroundColor: currentColors.cardBg }]} 
                      onPress={() => setReportSubMode("SELECT")}
                    >
                      <ChevronLeft size={16} color={currentColors.textPrimary} />
                      <Text style={[styles.cameraBackBtnText, { color: currentColors.textPrimary }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.cameraTopTitle}>GPS Camera Simulator</Text>
                  </View>

                  {/* Grievance Category Selector Above Camera */}
                  <View style={styles.cameraCategoryBox}>
                    <Text style={styles.cameraCategoryLabel}>Select Grievance Category:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                      {(["POTHOLE", "LIGHTING", "SIGNAGE", "ROAD_QUALITY", "OTHER"] as TicketCategory[]).map((cat) => {
                        const isSel = category === cat;
                        return (
                          <TouchableOpacity 
                            key={cat} 
                            style={[styles.catPill, isSel ? styles.catPillActive : { borderColor: currentColors.borderBg, backgroundColor: currentColors.cardBg }]}
                            onPress={() => setCategory(cat)}
                          >
                            <Text style={[styles.catPillText, { color: isSel ? "#FFFFFF" : currentColors.textPrimary }]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Futuristic Viewfinder Screen */}
                  <View style={styles.viewfinder}>
                    {/* Corner Framing Marks */}
                    <View style={[styles.frameCorner, styles.cornerTL]} />
                    <View style={[styles.frameCorner, styles.cornerTR]} />
                    <View style={[styles.frameCorner, styles.cornerBL]} />
                    <View style={[styles.frameCorner, styles.cornerBR]} />

                    {/* Central Aiming Crosshair */}
                    <View style={styles.crosshairCenter}>
                      <View style={styles.crosshairDot} />
                      <View style={styles.crosshairCircle} />
                    </View>

                    {/* Real-time GPS Telemetry Banner Overlay */}
                    <View style={styles.telemetryOverlay}>
                      <View style={styles.telemetryRow}>
                        <Text style={styles.telemetryText}>LAT: {cameraTelemetry.lat.toFixed(6)}</Text>
                        <Text style={styles.telemetryText}>LNG: {cameraTelemetry.lng.toFixed(6)}</Text>
                      </View>
                      <View style={styles.telemetryRow}>
                        <Text style={styles.telemetryText}>ALT: {cameraTelemetry.alt.toFixed(1)}m</Text>
                        <Text style={styles.telemetryText}>SPD: {cameraTelemetry.speed.toFixed(1)} km/h</Text>
                        <Text style={styles.telemetryText}>ACC: {cameraTelemetry.accuracy.toFixed(1)}m</Text>
                      </View>
                      <Text style={styles.telemetryText}>LOC: {cameraTelemetry.address}</Text>
                      <Text style={styles.telemetryText}>TIME: {cameraTelemetry.timestamp}</Text>
                    </View>

                    {/* Shutter Whiteout Flash Animation */}
                    {shutterFlash && (
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF", zIndex: 999 }]} />
                    )}
                  </View>

                  {/* Camera Controls Footer */}
                  <View style={styles.cameraFooter}>
                    <TouchableOpacity 
                      style={styles.galleryMockBtn}
                      onPress={() => alert("Mocking gallery image selection...")}
                    >
                      <Sparkles size={18} color="#FFFFFF" />
                      <Text style={styles.galleryMockText}>Filters</Text>
                    </TouchableOpacity>

                    {/* Haptic Shutter Button */}
                    <TouchableOpacity 
                      style={styles.shutterButtonOuter} 
                      activeOpacity={0.8}
                      onPress={() => {
                        setShutterFlash(true);
                        // Curated high quality street photos matching the category
                        const potholeUrls = [
                          "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
                          "https://images.unsplash.com/photo-1599740487739-df63ab37d8b5?auto=format&fit=crop&w=600&q=80"
                        ];
                        const lightingUrls = [
                          "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=600&q=80",
                          "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80"
                        ];
                        const signUrls = [
                          "https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&w=600&q=80",
                          "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80"
                        ];
                        const selectedPhotos = category === "POTHOLE" 
                          ? potholeUrls 
                          : (category === "LIGHTING" ? lightingUrls : signUrls);
                        const finalPhoto = selectedPhotos[Math.floor(Math.random() * selectedPhotos.length)] || "https://images.unsplash.com/photo-1584467541268-b029fb34de4e?auto=format&fit=crop&w=600&q=80";
                        
                        setCapturedPhoto(finalPhoto);

                        setTimeout(() => {
                          setShutterFlash(false);
                          setReportSubMode("DESCRIPTION");
                        }, 180);
                      }}
                    >
                      <View style={styles.shutterButtonInner} />
                    </TouchableOpacity>

                    <View style={{ width: 64 }} />
                  </View>
                </View>
              )}

              {/* DESCRIPTION & FINAL SUBMISSION FORM */}
              {reportSubMode === "DESCRIPTION" && (
                <View style={styles.reportFormContainer}>
                  <View style={styles.cameraTopRow}>
                    <TouchableOpacity 
                      style={[styles.cameraBackBtn, { backgroundColor: currentColors.cardBg }]} 
                      onPress={() => setReportSubMode("CAMERA")}
                    >
                      <ChevronLeft size={16} color={currentColors.textPrimary} />
                      <Text style={[styles.cameraBackBtnText, { color: currentColors.textPrimary }]}>Retake</Text>
                    </TouchableOpacity>
                    <Text style={[styles.cameraTopTitle, { color: currentColors.textPrimary }]}>Describe Complaint</Text>
                  </View>

                  <GlassCard style={styles.capturedPhotoCard}>
                    {capturedPhoto && (
                      <Image source={{ uri: capturedPhoto }} style={styles.capturedPhoto} />
                    )}
                    <View style={styles.photoGPSBadge}>
                      <Text style={styles.photoGPSBadgeText}>GPS Stamped Coordinate</Text>
                    </View>
                  </GlassCard>

                  {/* Telemetry stamps text info */}
                  <GlassCard style={styles.telemetryReviewCard}>
                    <View style={styles.reviewTelemetryRow}>
                      <MapPin size={12} color="#4F46E5" style={{ marginRight: 6 }} />
                      <Text style={[styles.reviewTelemetryText, { color: currentColors.textSecondary }]}>
                        {cameraTelemetry.address}
                      </Text>
                    </View>
                    <Text style={[styles.reviewCoordsText, { color: currentColors.textSecondary }]}>
                      Lat: {cameraTelemetry.lat.toFixed(6)} | Lng: {cameraTelemetry.lng.toFixed(6)} | Acc: {cameraTelemetry.accuracy.toFixed(1)}m
                    </Text>
                  </GlassCard>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>
                      DESCRIPTION (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: isDark ? "#121829" : "#FFFFFF",
                          color: currentColors.textPrimary,
                          borderColor: currentColors.borderBg,
                        },
                      ]}
                      placeholder="e.g. Large 1 meter pothole blocking left lane. Damaging cars..."
                      placeholderTextColor="#6B7280"
                      multiline
                      numberOfLines={4}
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={async () => {
                      try {
                        await submitComplaint({
                          category,
                          description: description.trim() || `${category.charAt(0) + category.slice(1).toLowerCase()} reported at ${cameraTelemetry.address}`,
                          location: { latitude: cameraTelemetry.lat, longitude: cameraTelemetry.lng },
                          photoUrls: [capturedPhoto || "https://picsum.photos/400/300"],
                          isAnonymous: false,
                          citizenId: user?.id || undefined
                        });
                        alert(
                          isSavedOffline
                            ? "Connection offline! Grievance queued in sync folder."
                            : "Grievance registered successfully with your citizen profile!"
                        );
                        setDescription("");
                        await refetchMyTickets();
                        setReportSubMode("VIEW");
                      } catch (e) {
                        console.error("Submission failed", e);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>File Official Ticket</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* CITIZEN PERSONAL COMPLAINTS HISTORY LOG */}
              {reportSubMode === "VIEW" && (
                <View style={styles.historyPortalContainer}>
                  <View style={styles.cameraTopRow}>
                    <TouchableOpacity 
                      style={[styles.cameraBackBtn, { backgroundColor: currentColors.cardBg }]} 
                      onPress={() => setReportSubMode("SELECT")}
                    >
                      <ChevronLeft size={16} color={currentColors.textPrimary} />
                      <Text style={[styles.cameraBackBtnText, { color: currentColors.textPrimary }]}>Portal</Text>
                    </TouchableOpacity>
                    <Text style={[styles.cameraTopTitle, { color: currentColors.textPrimary }]}>My Registered Tickets</Text>
                  </View>

                  {isLoadingMyTickets ? (
                    <ActivityIndicator color="#4F46E5" size="large" style={{ marginTop: 32 }} />
                  ) : myTickets.length === 0 ? (
                    <GlassCard style={styles.emptyHistoryCard}>
                      <AlertTriangle size={32} color="#D97706" style={{ marginBottom: 12 }} />
                      <Text style={[styles.emptyHistoryTitle, { color: currentColors.textPrimary }]}>No active filings</Text>
                      <Text style={[styles.emptyHistoryDesc, { color: currentColors.textSecondary }]}>
                        {"You haven't filed any road grievances with this profile yet. Tap File Complaint to register a new report."}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.primaryButton, { paddingHorizontal: 24, marginTop: 8 }]}
                        onPress={() => setReportSubMode("CAMERA")}
                      >
                        <PlusCircle size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryButtonText}>File a Complaint</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                      {myTickets.map((ticket) => {
                        // Dynamic status badge mapping
                        let badgeColor = "#4F46E5"; // default
                        let badgeBg = "rgba(79, 70, 229, 0.1)";
                        if (ticket.status === "OPEN") {
                          badgeColor = "#3B82F6";
                          badgeBg = "rgba(59, 130, 246, 0.15)";
                        } else if (ticket.status === "ASSIGNED") {
                          badgeColor = "#D97706";
                          badgeBg = "rgba(217, 119, 6, 0.15)";
                        } else if (ticket.status === "IN_PROGRESS") {
                          badgeColor = "#8B5CF6";
                          badgeBg = "rgba(139, 92, 246, 0.15)";
                        } else if (ticket.status === "RESOLVED") {
                          badgeColor = "#10B981";
                          badgeBg = "rgba(16, 185, 129, 0.15)";
                        } else if (ticket.status === "ESCALATED") {
                          badgeColor = "#EF4444";
                          badgeBg = "rgba(239, 68, 68, 0.15)";
                        }

                        return (
                          <TouchableOpacity 
                            key={ticket.id} 
                            onPress={() => {
                              setSelectedTicket(ticket);
                              if (ticket.location && typeof ticket.location.latitude === 'number' && typeof ticket.location.longitude === 'number') {
                                setMapCenter(ticket.location);
                              }
                              setCurrentTab("MAP");
                            }}
                          >
                            <GlassCard style={styles.historyLogCard}>
                              <View style={styles.historyLogCardRow}>
                                {ticket.photoUrls && ticket.photoUrls[0] && (
                                  <Image source={{ uri: ticket.photoUrls[0] }} style={styles.historyLogThumb} />
                                )}
                                <View style={styles.historyLogContent}>
                                  <View style={styles.historyHeaderInfo}>
                                    <Text style={[styles.historyLogTicketId, { color: currentColors.textSecondary }]}>
                                      ID: {ticket.id}
                                    </Text>
                                    <View style={[styles.statusBadgeText, { backgroundColor: badgeBg }]}>
                                      <Text style={[styles.statusBadgeTextLabel, { color: badgeColor }]}>
                                        {ticket.status}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={[styles.historyLogTitle, { color: currentColors.textPrimary }]}>
                                    {ticket.title}
                                  </Text>
                                  <Text 
                                    style={[styles.historyLogDesc, { color: currentColors.textSecondary }]}
                                    numberOfLines={1}
                                  >
                                    {ticket.description}
                                  </Text>
                                  <Text style={[styles.historyLogDate, { color: currentColors.textSecondary }]}>
                                    Reported: {new Date(ticket.createdAt).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                            </GlassCard>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 4th Navigation Tab: Budgets Explorer */}
          {currentTab === "BUDGET" && (
            <View style={styles.tabContainer}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.tabTitle, { color: currentColors.textPrimary }]}>
                  Open Budgets
                </Text>
                <Text style={[styles.budgetSub, { color: currentColors.textSecondary }]}>
                  Jurisdiction: Central PWD Division
                </Text>
              </View>

              {/* Financial aggregations card summaries */}
              <View style={styles.budgetCardsGrid}>
                <GlassCard style={styles.budgetGridCard}>
                  <View style={styles.flex1}>
                    <Text style={[styles.budgetCardLabel, { color: currentColors.textSecondary }]}>
                      Sanctioned Funding
                    </Text>
                    <Text style={[styles.budgetCardValue, { color: currentColors.textPrimary }]}>
                      ₹{(budgetSummary.totalSanctioned / 10000000).toFixed(1)} Cr
                    </Text>
                  </View>
                  <View style={styles.budgetIconAccent}>
                    <DollarSign size={20} color="#4F46E5" />
                  </View>
                </GlassCard>

                <GlassCard style={styles.budgetGridCard}>
                  <View style={styles.flex1}>
                    <Text style={[styles.budgetCardLabel, { color: currentColors.textSecondary }]}>
                      Spent & Utilized
                    </Text>
                    <Text style={[styles.budgetCardValue, { color: currentColors.success }]}>
                      ₹{(budgetSummary.totalUtilized / 10000000).toFixed(1)} Cr
                    </Text>
                  </View>
                  <View style={styles.budgetIconSuccess}>
                    <Award size={20} color="#16A34A" />
                  </View>
                </GlassCard>
              </View>

              {/* Dynamic scheme checklists */}
              <GlassCard style={styles.schemesContainer}>
                <Text
                  style={[
                    styles.schemesHeading,
                    {
                      color: currentColors.textPrimary,
                      borderColor: currentColors.borderBg,
                    },
                  ]}
                >
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
                        style={[
                          styles.schemeCard,
                          {
                            backgroundColor: isDark ? "#121829" : "#FFFFFF",
                            borderColor: currentColors.borderBg,
                          },
                        ]}
                      >
                        <View style={styles.schemeHeader}>
                          <View style={styles.flex1}>
                            <Text style={[styles.schemeName, { color: currentColors.textPrimary }]}>
                              {scheme.schemeName}
                            </Text>
                            <Text style={styles.schemeAuthority}>
                              {scheme.authorityType}
                            </Text>
                          </View>
                          <Text style={[styles.schemeYear, { color: currentColors.textSecondary }]}>
                            {scheme.financialYear}
                          </Text>
                        </View>

                        {/* Progress bar and utilization */}
                        <View style={styles.progressBarWrapper}>
                          <View style={styles.progressTextRow}>
                            <Text style={[styles.progressLabel, { color: currentColors.textSecondary }]}>
                              Utilization Rate
                            </Text>
                            <Text style={[styles.progressValText, { color: currentColors.success }]}>
                              {utilPercent.toFixed(1)}%
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressBarTrack,
                              { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${utilPercent}%`,
                                  backgroundColor: currentColors.success,
                                },
                              ]}
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
      )}

      {/* Tab Navigation Controls */}
      <View
        style={[
          styles.tabBar,
          {
            borderColor: currentColors.borderBg,
            backgroundColor: currentColors.cardBg,
            paddingTop: 16,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 16,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabBarItem}
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
            style={[
              styles.tabBarLabel,
              currentTab === "MAP"
                ? styles.tabBarLabelActive
                : { color: currentColors.textSecondary },
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setCurrentTab("REPORT")}
        >
          <FileText
            size={20}
            color={currentTab === "REPORT" ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[
              styles.tabBarLabel,
              currentTab === "REPORT"
                ? styles.tabBarLabelActive
                : { color: currentColors.textSecondary },
            ]}
          >
            File ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setCurrentTab("CHAT")}
        >
          <MessageSquare
            size={20}
            color={currentTab === "CHAT" ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[
              styles.tabBarLabel,
              currentTab === "CHAT"
                ? styles.tabBarLabelActive
                : { color: currentColors.textSecondary },
            ]}
          >
            AI Helper
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => setCurrentTab("BUDGET")}
        >
          <DollarSign
            size={20}
            color={currentTab === "BUDGET" ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[
              styles.tabBarLabel,
              currentTab === "BUDGET"
                ? styles.tabBarLabelActive
                : { color: currentColors.textSecondary },
            ]}
          >
            Budgets
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loginCard: {
    paddingVertical: 24,
    gap: 24,
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  loginTitle: {
    color: "#4F46E5",
    fontWeight: "bold",
    fontSize: 30,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  loginForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  mainContainer: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  phoneText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeToggle: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 12,
  },
  syncBanner: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncIcon: {
    marginRight: 8,
  },
  syncText: {
    color: "#0B0F19",
    fontSize: 12,
    fontWeight: "bold",
  },
  syncLink: {
    color: "#0B0F19",
    fontSize: 12,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  tabContainer: {
    gap: 16,
  },
  tabTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  ticketCard: {
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
    gap: 16,
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  ticketId: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closeButtonText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  ticketDetails: {
    flexDirection: "row",
    gap: 12,
  },
  ticketImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  ticketDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  slaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  slaText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  upvotesCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  upvotesText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  upvoteButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upvoteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  coordinatesTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBtnActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  categoryBtnInactive: {
    borderWidth: 1,
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  categoryBtnTextActive: {
    color: "#FFFFFF",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 96,
    textAlignVertical: "top",
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
    height: 450,
    gap: 16,
  },
  aiStreamingIndicator: {
    alignSelf: "flex-start",
    margin: 8,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  chatTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  chatSendBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetHeader: {
    marginBottom: 8,
  },
  budgetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetCardsGrid: {
    flexDirection: "column",
    gap: 16,
  },
  budgetGridCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  budgetCardLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  budgetCardValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  budgetIconAccent: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    borderColor: "rgba(79, 70, 229, 0.2)",
  },
  budgetIconSuccess: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(22, 163, 74, 0.15)",
    borderColor: "rgba(22, 163, 74, 0.2)",
  },
  schemesContainer: {
    gap: 16,
  },
  schemesHeading: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  schemeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  schemeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  schemeName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  schemeAuthority: {
    fontSize: 9,
    color: "#4F46E5",
    fontWeight: "bold",
    marginTop: 4,
    textTransform: "uppercase",
  },
  schemeYear: {
    fontSize: 10,
    fontWeight: "600",
  },
  progressBarWrapper: {
    gap: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  progressValText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  progressBarTrack: {
    height: 8,
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  authTabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: 8,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  authTabBtnActive: {
    backgroundColor: "#4F46E5",
  },
  authTabBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  authTabBtnTextActive: {
    color: "#FFFFFF",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  tabBarItem: {
    alignItems: "center",
    flex: 1,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  tabBarLabelActive: {
    color: "#4F46E5",
    fontWeight: "bold",
  },
  selectContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 12,
  },
  logoContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  logoBadge: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  logoSubText: {
    fontSize: 12,
    fontWeight: "500",
  },
  selectPrompt: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  selectCard: {
    width: "100%",
  },
  innerCard: {
    padding: 20,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  cardIconBox: {
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    borderColor: "rgba(79, 70, 229, 0.2)",
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  cardIconBoxMic: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  cardTitleBox: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooterBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cardFooterBtnMic: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cardFooterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  cardFooterTextMic: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  modeIndicatorText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  chatMessageScroll: {
    flex: 1,
  },
  waveformContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 16,
    marginBottom: 16,
  },
  voiceWavesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
  },
  waveBar1: {
    height: 12,
  },
  waveBar2: {
    height: 24,
  },
  waveBar3: {
    height: 36,
  },
  waveBar4: {
    height: 48,
  },
  waveformText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    height: 40,
    lineHeight: 40,
  },
  micButtonPulse: {
    padding: 24,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  micActivePulse: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  micInactivePulse: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  micStatusText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  voiceSimCard: {
    padding: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  voiceSimTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  voiceSimInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  voiceSimInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  voiceSimSend: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  transcriptHeading: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  transcriptScroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  transcriptBubbleRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  transcriptUserRow: {
    justifyContent: "flex-end",
  },
  transcriptBotRow: {
    justifyContent: "flex-start",
  },
  transcriptBubble: {
    maxWidth: "85%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  transcriptUserBubble: {
    borderTopRightRadius: 0,
  },
  transcriptBotBubble: {
    borderTopLeftRadius: 0,
  },
  transcriptRoleHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  transcriptRoleText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickSpeakContainer: {
    marginTop: 12,
    gap: 6,
    paddingBottom: 8,
  },
  quickSpeakHeading: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickSpeakScroll: {
    gap: 8,
    paddingRight: 16,
  },
  quickSpeakPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickSpeakPillText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Selector Portal Styles
  reportPortalSelect: {
    gap: 16,
    paddingTop: 8,
  },
  portalHeadingBox: {
    marginBottom: 8,
    gap: 4,
  },
  portalSubText: {
    fontSize: 13,
    lineHeight: 18,
  },
  portalCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  portalInnerCard: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    alignItems: "center",
  },
  portalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  portalCardContent: {
    flex: 1,
    gap: 6,
  },
  portalCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  portalCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  portalCardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  portalCardBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  // GPS Camera Viewfinder Screen Styles
  cameraContainer: {
    gap: 16,
  },
  cameraTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cameraBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cameraBackBtnText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },
  cameraTopTitle: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  cameraCategoryBox: {
    gap: 8,
  },
  cameraCategoryLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  catScroll: {
    flexDirection: "row",
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  catPillText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  viewfinder: {
    height: 320,
    backgroundColor: "#000000",
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  frameCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  crosshairCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  crosshairCircle: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderStyle: "dashed",
  },
  telemetryOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    gap: 4,
  },
  telemetryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  telemetryText: {
    color: "#10B981",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 10,
    fontWeight: "bold",
  },
  cameraFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  galleryMockBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  galleryMockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  shutterButtonOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  shutterButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },

  // Description and Final Submission Styles
  reportFormContainer: {
    gap: 16,
  },
  capturedPhotoCard: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    padding: 0,
  },
  capturedPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 20,
  },
  photoGPSBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  photoGPSBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  telemetryReviewCard: {
    padding: 12,
    gap: 6,
  },
  reviewTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewTelemetryText: {
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
  },
  reviewCoordsText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Grievance History Log Styles
  historyPortalContainer: {
    gap: 16,
  },
  emptyHistoryCard: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyHistoryDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  historyLogCard: {
    marginBottom: 12,
    padding: 12,
  },
  historyLogCardRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  historyLogThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  historyLogContent: {
    flex: 1,
    gap: 4,
  },
  historyHeaderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLogTicketId: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusBadgeText: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeTextLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },
  historyLogTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  historyLogDesc: {
    fontSize: 12,
  },
  historyLogDate: {
    fontSize: 10,
  },
});

export default AppNavigator;
