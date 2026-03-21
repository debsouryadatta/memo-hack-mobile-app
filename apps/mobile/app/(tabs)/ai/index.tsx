import { useApp } from "@/components/ContextProvider";
import { CONVEX_SITE_URL } from "@/constants";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMutation, useQuery } from "convex/react";
import { fetch as expoFetch } from "expo/fetch";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bot,
  MessageSquarePlus,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const { width: screenWidth } = Dimensions.get("window");

// ── Session List Screen ────────────────────────────────────────────────────

function SessionList({
  userId,
  onSelect,
  onNew,
}: {
  userId: Id<"users">;
  onSelect: (id: Id<"aiChatSessions">, title: string) => void;
  onNew: () => void;
}) {
  const sessions = useQuery(api.aiChat.listSessions, { userId });
  const deleteSession = useMutation(api.aiChat.deleteSession);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#6366F1", "#4F46E5", "#4338CA"]} style={{ position: "absolute", inset: 0 }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#c7d2fe", fontSize: 15, fontWeight: "500" }}>Your AI powered</Text>
              <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 2 }}>AI Tutor</Text>
            </View>
            <TouchableOpacity
              onPress={onNew}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 14,
                borderRadius: 16,
              }}
            >
              <Plus size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Strip */}
          <View style={{ flexDirection: "row", marginBottom: 28, gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, width: 38, height: 38, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <MessageSquarePlus size={18} color="white" />
              </View>
              <Text style={{ color: "white", fontWeight: "800", fontSize: 22 }}>
                {sessions?.length ?? 0}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>Chats</Text>
            </View>
            <View style={{ flex: 2, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, width: 38, height: 38, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Sparkles size={18} color="white" />
              </View>
              <Text style={{ color: "white", fontWeight: "800", fontSize: 22 }}>GPT-4o</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>JEE &amp; NEET Tutor</Text>
            </View>
          </View>

          {/* New Chat CTA */}
          <TouchableOpacity
            onPress={onNew}
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              paddingVertical: 18,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <MessageSquarePlus size={20} color="#4F46E5" />
            <Text style={{ color: "#4F46E5", fontWeight: "700", fontSize: 16, marginLeft: 10 }}>
              Start New Chat
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Sessions White Card */}
        <Animated.View
          style={{
            marginTop: -8,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 16,
              minHeight: 300,
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View style={{ backgroundColor: "#EEF2FF", padding: 10, borderRadius: 14, marginRight: 12 }}>
                <Bot size={22} color="#4F46E5" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#0F172A" }}>Recent Chats</Text>
                <Text style={{ color: "#94A3B8", fontSize: 13 }}>Tap a chat to continue</Text>
              </View>
            </View>

            {sessions === undefined ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <ActivityIndicator color="#4F46E5" size="large" />
              </View>
            ) : sessions.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View style={{ backgroundColor: "#EEF2FF", borderRadius: 60, padding: 24, marginBottom: 16 }}>
                  <Bot size={48} color="#4F46E5" />
                </View>
                <Text style={{ color: "#0F172A", fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
                  No chats yet
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                  Tap "Start New Chat" above to ask{"\n"}your first JEE / NEET question.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {sessions.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    onPress={() => onSelect(item._id, item.title)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "white",
                      borderRadius: 18,
                      padding: 16,
                      shadowColor: "#94A3B8",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: "#F1F5F9",
                    }}
                  >
                    <View style={{ backgroundColor: "#EEF2FF", borderRadius: 12, padding: 10, marginRight: 14 }}>
                      <Bot size={20} color="#4F46E5" />
                    </View>
                    <Text style={{ flex: 1, color: "#1E293B", fontWeight: "600", fontSize: 15 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteSession({ sessionId: item._id, userId })}
                      hitSlop={10}
                      style={{ padding: 6 }}
                    >
                      <Trash2 size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Active Chat Screen ─────────────────────────────────────────────────────

function ChatScreen({
  userId,
  sessionId,
  sessionTitle,
  onBack,
}: {
  userId: Id<"users">;
  sessionId: Id<"aiChatSessions">;
  sessionTitle: string;
  onBack: () => void;
}) {
  const { token } = useApp();
  const saveMessage = useMutation(api.aiChat.saveMessage);
  const updateTitle = useMutation(api.aiChat.updateSessionTitle);
  const existingMessages = useQuery(api.aiChat.listMessages, { sessionId, userId });
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const titleUpdated = useRef(false);

  const { messages: streamMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: `${CONVEX_SITE_URL}/api/chat`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    onFinish: async ({ message }) => {
      const text = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (text) {
        await saveMessage({ sessionId, userId, role: "assistant", content: text });
      }
      if (!titleUpdated.current) {
        titleUpdated.current = true;
        const firstUser = streamMessages.find((m) => m.role === "user");
        if (firstUser) {
          const userText = firstUser.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("")
            .slice(0, 60);
          if (userText) await updateTitle({ sessionId, userId, title: userText });
        }
      }
    },
    onError: (error) => console.error("chat error:", error),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const streamingAssistantText = isLoading
    ? streamMessages
        .filter((m) => m.role === "assistant")
        .flatMap((m) =>
          m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
        )
        .join("")
    : null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await saveMessage({ sessionId, userId, role: "user", content: text });
    sendMessage({ text });
  };

  const allDisplayed = existingMessages ?? [];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [allDisplayed.length, streamingAssistantText]);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ paddingTop: insets.top + 8, paddingBottom: 18, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={onBack}
            style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10, marginRight: 14 }}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 8, marginRight: 12 }}>
            <Bot size={20} color="white" />
          </View>
          <Text style={{ color: "white", fontWeight: "700", fontSize: 17, flex: 1 }} numberOfLines={1}>
            {sessionTitle}
          </Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={tabBarHeight}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: "#F8FAFC" }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {allDisplayed.length === 0 && !isLoading && (
            <View style={{ alignItems: "center", marginTop: 48 }}>
              <View style={{ backgroundColor: "#EEF2FF", borderRadius: 56, padding: 20, marginBottom: 16 }}>
                <Bot size={40} color="#4F46E5" />
              </View>
              <Text style={{ color: "#1E293B", fontWeight: "700", fontSize: 18, textAlign: "center", marginBottom: 8 }}>
                How can I help you today?
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 }}>
                Ask anything about Physics, Chemistry, Maths or Biology.
              </Text>
            </View>
          )}

          {/* Persisted messages */}
          {allDisplayed.map((m: Doc<"aiChatMessages">) => {
            const isUser = m.role === "user";
            return (
              <View
                key={m._id}
                style={{
                  marginBottom: 10,
                  maxWidth: "82%",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                }}
              >
                {!isUser && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                    <View style={{ backgroundColor: "#EEF2FF", borderRadius: 8, padding: 4, marginRight: 6 }}>
                      <Bot size={12} color="#4F46E5" />
                    </View>
                    <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "600" }}>AI Tutor</Text>
                  </View>
                )}
                <View
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: isUser ? "#4F46E5" : "white",
                    borderBottomRightRadius: isUser ? 4 : 20,
                    borderBottomLeftRadius: isUser ? 20 : 4,
                    shadowColor: isUser ? "#4F46E5" : "#94A3B8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isUser ? 0.25 : 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Text style={{ color: isUser ? "white" : "#1E293B", fontSize: 15, lineHeight: 22 }}>
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Streaming bubble */}
          {isLoading && streamingAssistantText ? (
            <View style={{ marginBottom: 10, maxWidth: "82%", alignSelf: "flex-start" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ backgroundColor: "#EEF2FF", borderRadius: 8, padding: 4, marginRight: 6 }}>
                  <Bot size={12} color="#4F46E5" />
                </View>
                <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "600" }}>AI Tutor</Text>
              </View>
              <View style={{
                borderRadius: 20, borderBottomLeftRadius: 4,
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: "white",
                shadowColor: "#94A3B8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
              }}>
                <Text style={{ color: "#1E293B", fontSize: 15, lineHeight: 22 }}>{streamingAssistantText}</Text>
              </View>
            </View>
          ) : isLoading ? (
            <View style={{ marginBottom: 10, alignSelf: "flex-start" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ backgroundColor: "#EEF2FF", borderRadius: 8, padding: 4, marginRight: 6 }}>
                  <Bot size={12} color="#4F46E5" />
                </View>
                <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "600" }}>AI Tutor</Text>
              </View>
              <View style={{
                borderRadius: 20, borderBottomLeftRadius: 4,
                paddingHorizontal: 20, paddingVertical: 14,
                backgroundColor: "white",
                shadowColor: "#94A3B8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
              }}>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "flex-end",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#F1F5F9",
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 12,
              color: "#1E293B",
              fontSize: 15,
              marginRight: 10,
              maxHeight: 120,
            }}
            placeholder="Ask a question..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              backgroundColor: input.trim() && !isLoading ? "#4F46E5" : "#E2E8F0",
              borderRadius: 24,
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: input.trim() && !isLoading ? 0.3 : 0,
              shadowRadius: 8,
              elevation: input.trim() && !isLoading ? 4 : 0,
            }}
          >
            <Send size={18} color={input.trim() && !isLoading ? "white" : "#94A3B8"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Root Screen ────────────────────────────────────────────────────────────

export default function AIScreen() {
  const { isAuthenticated, user } = useApp();
  const createSession = useMutation(api.aiChat.createSession);
  const [activeSession, setActiveSession] = useState<{
    id: Id<"aiChatSessions">;
    title: string;
  } | null>(null);
  const router = useRouter();

  const userId = user?._id as Id<"users"> | undefined;

  const handleNewChat = async () => {
    if (!userId) return;
    const session = await createSession({ userId, title: "New Chat" });
    if (session) {
      setActiveSession({ id: session._id, title: session.title });
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Image
              source={require("../../../assets/illustrations/hero-auth.png")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ width: "100%" }}>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 28,
              padding: 32,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 50, padding: 16, marginBottom: 16 }}>
                  <User size={32} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "white", textAlign: "center", marginBottom: 12 }}>
                  Sign In Required
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", fontSize: 15, lineHeight: 22, marginBottom: 28 }}>
                  Please sign in to your account to view and manage your profile information
                </Text>
                <TouchableOpacity
                  style={{
                    width: "100%", backgroundColor: "white", borderRadius: 18,
                    paddingVertical: 16, paddingHorizontal: 24, marginBottom: 16,
                    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
                  }}
                  onPress={() => router.push("/(auth)/signin")}
                >
                  <Text style={{ color: "#4F46E5", textAlign: "center", fontSize: 17, fontWeight: "700" }}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 50, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "500" }}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (activeSession && userId) {
    return (
      <ChatScreen
        userId={userId}
        sessionId={activeSession.id}
        sessionTitle={activeSession.title}
        onBack={() => setActiveSession(null)}
      />
    );
  }

  return (
    <SessionList
      userId={userId!}
      onSelect={(id, title) => setActiveSession({ id, title })}
      onNew={handleNewChat}
    />
  );
}
