import { useApp } from "@/components/ContextProvider";
import { CONVEX_SITE_URL } from "@/constants";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useChat } from "@ai-sdk/react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { DefaultChatTransport } from "ai";
import { useAction, useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { fetch as expoFetch } from "expo/fetch";
import {
  ArrowLeft,
  Bot,
  MessageSquarePlus,
  Plus,
  Send,
  Trash2,
  User,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COMPOSER_MIN_HEIGHT = 48;
const COMPOSER_MAX_HEIGHT = 112;

const aiMarkdownStyles = {
  body: {
    color: "#1E293B",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 10,
  },
  heading2: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading3: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 8,
  },
  strong: { color: "#0F172A", fontWeight: "800" },
  em: { color: "#334155", fontStyle: "italic" },
  bullet_list: { marginTop: 0, marginBottom: 8 },
  ordered_list: { marginTop: 0, marginBottom: 8 },
  list_item: { marginBottom: 4 },
  code_inline: {
    backgroundColor: "#E2E8F0",
    color: "#1E293B",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fence: {
    backgroundColor: "#0F172A",
    color: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
} as const;

const userMarkdownStyles = {
  body: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading2: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading3: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 6,
  },
  strong: { color: "#FFFFFF", fontWeight: "800" },
  em: { color: "#E0E7FF", fontStyle: "italic" },
  bullet_list: { marginTop: 0, marginBottom: 8 },
  ordered_list: { marginTop: 0, marginBottom: 8 },
  list_item: { marginBottom: 4 },
  code_inline: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fence: {
    backgroundColor: "rgba(15,23,42,0.55)",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
} as const;

function isAuthRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const err = error as {
    code?: string;
    data?: { code?: string; message?: string };
    message?: string;
  } | null;
  const code = err?.data?.code ?? err?.code;
  const dataMessage = err?.data?.message ?? err?.message;
  return (
    code === "AUTH_REQUIRED" ||
    message.includes("AUTH_REQUIRED") ||
    message.includes("Authentication required") ||
    (typeof dataMessage === "string" &&
      dataMessage.includes("Authentication required"))
  );
}

function getUsageLimitMessage(error: unknown): string | null {
  const err = error as {
    code?: string;
    data?: { code?: string; message?: string };
    message?: string;
  } | null;

  const code = err?.data?.code ?? err?.code;
  const message = err?.data?.message ?? err?.message ?? "";

  if (code === "LIMIT_REACHED" || code === "RATE_LIMITED") {
    return message || "Your AI limit is reached. Please try again later.";
  }

  return null;
}

// ── Session List Screen ────────────────────────────────────────────────────

function SessionList({
  onSelect,
  onNew,
}: {
  onSelect: (id: Id<"aiChatSessions">, title: string) => void;
  onNew: () => void;
}) {
  const sessions = useQuery(api.aiChat.listSessions, {});
  const deleteSession = useMutation(api.aiChat.deleteSession);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ position: "absolute", inset: 0 }}
      />

      <Animated.View
        style={{
          width: "100%",
          maxWidth: 760,
          alignSelf: "center",
          paddingHorizontal: 20,
          paddingTop: insets.top + 14,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#c7d2fe", fontSize: 14, fontWeight: "600" }}>
              Your AI powered
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 42,
                lineHeight: 46,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              AI Tutor
            </Text>
          </View>
          <TouchableOpacity
            onPress={onNew}
            style={{
              width: 60,
              height: 60,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 18,
            }}
          >
            <Plus size={26} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNew}
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 5,
            marginBottom: 14,
          }}
        >
          <MessageSquarePlus size={20} color="#4F46E5" />
          <Text
            style={{
              color: "#4F46E5",
              fontWeight: "700",
              fontSize: 16,
              marginLeft: 10,
            }}
          >
            Start New Chat
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{
          flex: 1,
          marginTop: 8,
          width: "100%",
          maxWidth: 760,
          alignSelf: "center",
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#F8FAFC",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 20,
            paddingTop: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#E2E8F0",
                padding: 10,
                borderRadius: 14,
                marginRight: 12,
              }}
            >
              <Bot size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  lineHeight: 32,
                  fontWeight: "800",
                  color: "#0F172A",
                }}
              >
                Recent Chats
              </Text>
              <Text style={{ color: "#64748B", fontSize: 15 }}>
                Tap a chat to continue
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#EEF2FF",
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{ color: "#4F46E5", fontSize: 13, fontWeight: "700" }}
              >
                {sessions?.length ?? 0} chats
              </Text>
            </View>
          </View>

          {sessions === undefined ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: tabBarHeight + 24,
              }}
            >
              <ActivityIndicator color="#4F46E5" size="large" />
            </View>
          ) : sessions.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 24,
                paddingBottom: tabBarHeight + 24,
              }}
            >
              <View
                style={{
                  backgroundColor: "#E2E8F0",
                  borderRadius: 999,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <Bot size={42} color="#4F46E5" />
              </View>
              <Text
                style={{
                  color: "#0F172A",
                  fontSize: 32,
                  lineHeight: 36,
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                No chats yet
              </Text>
              <Text
                style={{
                  color: "#64748B",
                  fontSize: 16,
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                Tap Start New Chat to ask your first JEE / NEET question.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: tabBarHeight + 20,
                gap: 10,
              }}
              showsVerticalScrollIndicator={false}
            >
              {sessions.map((item: Doc<"aiChatSessions">) => (
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
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EEF2FF",
                      borderRadius: 12,
                      padding: 10,
                      marginRight: 14,
                    }}
                  >
                    <Bot size={20} color="#4F46E5" />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: "#1E293B",
                      fontWeight: "700",
                      fontSize: 18,
                      lineHeight: 24,
                    }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      deleteSession({ sessionId: item._id }).catch(
                        async (error) => {
                          const usageMessage = getUsageLimitMessage(error);
                          if (usageMessage) {
                            Alert.alert("Limit reached", usageMessage);
                            return;
                          }
                          if (isAuthRequiredError(error)) return;
                          throw error;
                        },
                      );
                    }}
                    hitSlop={10}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={17} color="#CBD5E1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Active Chat Screen ─────────────────────────────────────────────────────

function ChatScreen({
  sessionId,
  sessionTitle,
  onBack,
}: {
  sessionId: Id<"aiChatSessions">;
  sessionTitle: string;
  onBack: () => void;
}) {
  const { token } = useApp();
  const insets = useSafeAreaInsets();
  const saveMessage = useMutation(api.aiChat.saveMessage);
  const updateTitle = useMutation(api.aiChat.updateSessionTitle);
  const generateTitle = useAction(api.aiChat.generateSessionTitle);
  const existingMessages = useQuery(api.aiChat.listMessages, { sessionId });
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [composerScrollable, setComposerScrollable] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(sessionTitle);
  const [pendingAssistantText, setPendingAssistantText] = useState<
    string | null
  >(null);
  const [isPersistingAssistant, setIsPersistingAssistant] = useState(false);
  const [isAwaitingAssistant, setIsAwaitingAssistant] = useState(false);
  const baselineAssistantRef = useRef<{
    id: string | null;
    content: string;
  } | null>(null);
  const titleSet = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const {
    messages: streamMessages,
    sendMessage,
    status,
  } = useChat({
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
        setPendingAssistantText(text);
        setIsPersistingAssistant(true);
        try {
          await saveMessage({ sessionId, role: "assistant", content: text });
        } catch (error) {
          setPendingAssistantText(null);
          setIsPersistingAssistant(false);
          const usageMessage = getUsageLimitMessage(error);
          if (usageMessage) {
            Alert.alert("Limit reached", usageMessage);
            return;
          }
          if (isAuthRequiredError(error)) {
            return;
          }
          throw error;
        } finally {
          setIsAwaitingAssistant(false);
        }
      } else {
        setIsAwaitingAssistant(false);
      }
    },
    onError: (error) => {
      setIsAwaitingAssistant(false);
      console.error("chat error:", error);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isStreaming = status === "streaming";
  const isSubmitting = status === "submitted";

  const latestAssistantMessage = [...streamMessages]
    .reverse()
    .find((m) => m.role === "assistant");

  const latestAssistantText = latestAssistantMessage
    ? latestAssistantMessage.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
    : "";

  const latestAssistantId =
    (latestAssistantMessage as { id?: string } | undefined)?.id ?? null;

  const baselineAssistant = baselineAssistantRef.current;
  const isNewAssistantChunk =
    !!latestAssistantMessage &&
    (latestAssistantId && baselineAssistant?.id
      ? latestAssistantId !== baselineAssistant.id
      : latestAssistantText !== (baselineAssistant?.content ?? ""));

  const streamingAssistantText =
    isStreaming && isAwaitingAssistant && isNewAssistantChunk
      ? latestAssistantText
      : null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    setComposerScrollable(false);

    // Generate a smart title from the first user message using AI
    if (!titleSet.current) {
      titleSet.current = true;
      generateTitle({ firstMessage: text })
        .then((aiTitle) => {
          setDisplayTitle(aiTitle);
          void updateTitle({ sessionId, title: aiTitle });
        })
        .catch(() => {
          // Fallback to truncated raw message if AI title fails
          const fallback = text.length > 50 ? text.slice(0, 50) + "…" : text;
          setDisplayTitle(fallback);
          void updateTitle({ sessionId, title: fallback });
        });
    }

    try {
      await saveMessage({ sessionId, role: "user", content: text });
      const previousAssistant = [...streamMessages]
        .reverse()
        .find((m) => m.role === "assistant");

      const previousAssistantText = previousAssistant
        ? previousAssistant.parts
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("")
        : "";

      const previousAssistantId =
        (previousAssistant as { id?: string } | undefined)?.id ?? null;

      baselineAssistantRef.current = {
        id: previousAssistantId,
        content: previousAssistantText,
      };
      setIsAwaitingAssistant(true);
      sendMessage({ text });
    } catch (error) {
      const usageMessage = getUsageLimitMessage(error);
      if (usageMessage) {
        Alert.alert("Limit reached", usageMessage);
        return;
      }
      if (isAuthRequiredError(error)) {
        return;
      }
      throw error;
    }
  };

  const handleComposerContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const targetHeight = Math.max(
      COMPOSER_MIN_HEIGHT,
      Math.min(COMPOSER_MAX_HEIGHT, contentHeight),
    );

    setComposerHeight(targetHeight);
    // Use >= so scrolling activates as soon as we hit the four-line cap.
    setComposerScrollable(contentHeight >= COMPOSER_MAX_HEIGHT - 1);
  };

  const allDisplayed = existingMessages ?? [];

  const displayedMessages = (() => {
    if (
      !isPersistingAssistant ||
      !pendingAssistantText ||
      allDisplayed.length === 0
    ) {
      return allDisplayed;
    }

    const latestAssistantIndex = [...allDisplayed]
      .map((m, index) => ({ m, index }))
      .reverse()
      .find(({ m }) => m.role === "assistant")?.index;

    if (latestAssistantIndex === undefined) return allDisplayed;
    if (allDisplayed[latestAssistantIndex]?.content !== pendingAssistantText)
      return allDisplayed;

    return allDisplayed.filter(
      (_: Doc<"aiChatMessages">, index: number) =>
        index !== latestAssistantIndex,
    );
  })();

  useEffect(() => {
    if (!isPersistingAssistant || !pendingAssistantText) return;

    const latestPersistedAssistant = [...allDisplayed]
      .reverse()
      .find((m: Doc<"aiChatMessages">) => m.role === "assistant");

    const wasSaved = latestPersistedAssistant?.content === pendingAssistantText;

    if (wasSaved) {
      setPendingAssistantText(null);
      setIsPersistingAssistant(false);
    }
  }, [allDisplayed, isPersistingAssistant, pendingAssistantText]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [displayedMessages.length, streamingAssistantText]);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 760,
              alignSelf: "center",
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={onBack}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
              >
                <ArrowLeft size={22} color="white" />
              </TouchableOpacity>

              <View style={{ flex: 1, marginHorizontal: 14 }}>
                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    lineHeight: 28,
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
              </View>

              <View style={{ width: 50, height: 50 }} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Messages + Input */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-slate-50"
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: tabBarHeight + 16,
            paddingHorizontal: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", maxWidth: 760, alignSelf: "center" }}>
            {displayedMessages.length === 0 && !isLoading && (
              <View style={{ alignItems: "center", marginTop: 48 }}>
                <View
                  style={{
                    backgroundColor: "#EEF2FF",
                    borderRadius: 56,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <Bot size={40} color="#4F46E5" />
                </View>
                <Text
                  style={{
                    color: "#1E293B",
                    fontWeight: "700",
                    fontSize: 18,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  How can I help you today?
                </Text>
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 20,
                    paddingHorizontal: 32,
                  }}
                >
                  Ask anything about Physics, Chemistry, Maths or Biology.
                </Text>
              </View>
            )}

            {displayedMessages.map((m: Doc<"aiChatMessages">) => {
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#EEF2FF",
                          borderRadius: 8,
                          padding: 4,
                          marginRight: 6,
                        }}
                      >
                        <Bot size={12} color="#4F46E5" />
                      </View>
                      <Text
                        style={{
                          color: "#94A3B8",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        AI Tutor
                      </Text>
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
                    <Markdown
                      style={isUser ? userMarkdownStyles : aiMarkdownStyles}
                    >
                      {m.content}
                    </Markdown>
                  </View>
                </View>
              );
            })}

            {isStreaming && streamingAssistantText ? (
              <View
                style={{
                  marginBottom: 10,
                  maxWidth: "82%",
                  alignSelf: "flex-start",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EEF2FF",
                      borderRadius: 8,
                      padding: 4,
                      marginRight: 6,
                    }}
                  >
                    <Bot size={12} color="#4F46E5" />
                  </View>
                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    AI Tutor
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "white",
                    shadowColor: "#94A3B8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Markdown style={aiMarkdownStyles}>
                    {streamingAssistantText}
                  </Markdown>
                </View>
              </View>
            ) : isPersistingAssistant && pendingAssistantText ? (
              <View
                style={{
                  marginBottom: 10,
                  maxWidth: "82%",
                  alignSelf: "flex-start",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EEF2FF",
                      borderRadius: 8,
                      padding: 4,
                      marginRight: 6,
                    }}
                  >
                    <Bot size={12} color="#4F46E5" />
                  </View>
                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    AI Tutor
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "white",
                    shadowColor: "#94A3B8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Markdown style={aiMarkdownStyles}>
                    {pendingAssistantText}
                  </Markdown>
                </View>
              </View>
            ) : isSubmitting || (isStreaming && !streamingAssistantText) ? (
              <View style={{ marginBottom: 10, alignSelf: "flex-start" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EEF2FF",
                      borderRadius: 8,
                      padding: 4,
                      marginRight: 6,
                    }}
                  >
                    <Bot size={12} color="#4F46E5" />
                  </View>
                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    AI Tutor
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: "white",
                    shadowColor: "#94A3B8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Input Bar — sits above the absolute tab bar */}
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: tabBarHeight + 8,
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 760,
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "flex-end",
            }}
          >
            <TextInput
              style={[
                {
                  flex: 1,
                  backgroundColor: "#F1F5F9",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  paddingHorizontal: 18,
                  paddingTop: 12,
                  paddingBottom: 12,
                  color: "#1E293B",
                  fontSize: 15,
                  lineHeight: 22,
                  marginRight: 12,
                  minHeight: COMPOSER_MIN_HEIGHT,
                  maxHeight: COMPOSER_MAX_HEIGHT,
                  height: composerHeight,
                  textAlignVertical: "top",
                },
                Platform.OS === "web"
                  ? ({
                      overflowY: composerScrollable ? "auto" : "hidden",
                      scrollbarWidth: "none",
                    } as any)
                  : null,
              ]}
              placeholder="Ask a question..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
              scrollEnabled={composerScrollable}
              onContentSizeChange={handleComposerContentSizeChange}
              maxLength={2000}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                backgroundColor:
                  input.trim() && !isLoading ? "#4F46E5" : "#E2E8F0",
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
              <Send
                size={18}
                color={input.trim() && !isLoading ? "white" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Root Screen ────────────────────────────────────────────────────────────

export default function AIScreen() {
  const { isAuthenticated } = useApp();
  const createSession = useMutation(api.aiChat.createSession);
  const currentUser = useQuery(api.user.getCurrentUser, {});
  const [activeSession, setActiveSession] = useState<{
    id: Id<"aiChatSessions">;
    title: string;
  } | null>(null);
  const router = useRouter();

  const canCreateChat =
    isAuthenticated && currentUser !== undefined && currentUser !== null;

  const handleNewChat = async () => {
    if (!canCreateChat) return;
    try {
      const session = await createSession({ title: "New Chat" });
      if (session) {
        setActiveSession({ id: session._id, title: session.title });
      }
    } catch (error) {
      const usageMessage = getUsageLimitMessage(error);
      if (usageMessage) {
        Alert.alert("Limit reached", usageMessage);
        return;
      }
      if (isAuthRequiredError(error)) {
        return;
      }
      throw error;
    }
  };

  if (isAuthenticated && currentUser === undefined) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="white" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || currentUser === null) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Image
              source={require("../../../assets/illustrations/hero-auth.png")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ width: "100%" }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 28,
                padding: 32,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 50,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <User size={32} color="rgba(255,255,255,0.8)" />
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "white",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Sign In Required
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    textAlign: "center",
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 28,
                  }}
                >
                  Please sign in to your account to view and manage your profile
                  information
                </Text>
                <TouchableOpacity
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderRadius: 18,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={() => router.push("/(auth)/signin")}
                >
                  <Text
                    style={{
                      color: "#4F46E5",
                      textAlign: "center",
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}
                  >
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/signup")}
                    style={{ paddingHorizontal: 4, paddingVertical: 4 }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 50,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 15,
                fontWeight: "500",
              }}
            >
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (activeSession) {
    return (
      <ChatScreen
        sessionId={activeSession.id}
        sessionTitle={activeSession.title}
        onBack={() => setActiveSession(null)}
      />
    );
  }

  return (
    <SessionList
      onSelect={(id, title) => setActiveSession({ id, title })}
      onNew={handleNewChat}
    />
  );
}
