import { useApp } from "@/components/ContextProvider";
import { CONVEX_SITE_URL } from "@/constants";
import {
    aiMarkdownStyles,
    COMPOSER_MAX_HEIGHT,
    COMPOSER_MIN_HEIGHT,
    getUsageLimitMessage,
    isAuthRequiredError,
    userMarkdownStyles,
    type ChatMessageRow,
} from "@/lib/aiChatShared";
import {
    prepareChatImage,
    uploadToConvexStorage,
    type PreparedImage,
} from "@/lib/imageUpload";
import { useChat } from "@ai-sdk/react";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DefaultChatTransport } from "ai";
import { useAction, useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { fetch as expoFetch } from "expo/fetch";
import {
    ArrowLeft,
    Bot,
    Image as ImageIcon,
    Send,
    X,
} from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ElementRef,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    AppState,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TextInputContentSizeChangeEventData,
    TouchableOpacity,
    View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AIChatScreen({
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
  const generateChatImageUploadUrl = useMutation(
    api.aiChat.generateChatImageUploadUrl,
  );
  const updateTitle = useMutation(api.aiChat.updateSessionTitle);
  const generateTitle = useAction(api.aiChat.generateSessionTitle);
  const existingMessages = useQuery(api.aiChat.listMessages, { sessionId });
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const composerInputRef = useRef<ElementRef<typeof TextInput>>(null);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [composerScrollable, setComposerScrollable] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(sessionTitle);
  const [pendingAssistantText, setPendingAssistantText] = useState<
    string | null
  >(null);
  const [isPersistingAssistant, setIsPersistingAssistant] = useState(false);
  const [isAwaitingAssistant, setIsAwaitingAssistant] = useState(false);
  const [pendingChatImage, setPendingChatImage] =
    useState<PreparedImage | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  /** Android + pan: lift composer above keyboard (resize alone was hiding it under tabs/edge-to-edge). */
  const [androidKeyboardInset, setAndroidKeyboardInset] = useState(0);
  const resetKeyboardLayoutState = useCallback(() => {
    setKeyboardVisible(false);
    setAndroidKeyboardInset(0);
    Keyboard.dismiss();
  }, []);

  /**
   * Android back-swipe often hides the keyboard without `keyboardDidHide` while the stream
   * re-renders. `Keyboard.metrics()` alone is unsafe (it can read "closed" while the keyboard is
   * still open). Only clear manual lift when metrics say closed *and* the composer is not focused.
   */
  const syncAndroidKeyboardLiftAfterNativeDismiss = useCallback(() => {
    if (Platform.OS !== "android") return;
    if (!keyboardVisible || androidKeyboardInset <= 0) return;
    const metricsFn = (
      Keyboard as typeof Keyboard & {
        metrics?: () => { height: number } | undefined;
      }
    ).metrics;
    if (typeof metricsFn !== "function") return;
    const m = metricsFn();
    const metricsSaysClosed = m == null || m.height < 12;
    const focused = composerInputRef.current?.isFocused() ?? false;
    if (metricsSaysClosed && !focused) {
      setKeyboardVisible(false);
      setAndroidKeyboardInset(0);
    }
  }, [keyboardVisible, androidKeyboardInset]);
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
  }, [fadeAnim, slideAnim]);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        fetch: expoFetch as unknown as typeof globalThis.fetch,
        api: `${CONVEX_SITE_URL}/api/chat`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { sessionId },
      }),
    [token, sessionId],
  );

  const {
    messages: streamMessages,
    sendMessage,
    status,
  } = useChat({
    transport: chatTransport,
    onFinish: async ({ message }) => {
      const text = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      setIsAwaitingAssistant(false);
      if (text) {
        setPendingAssistantText(text);
        setIsPersistingAssistant(true);
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

  const handlePickChatImage = async () => {
    if (isLoading) return;
    try {
      const prepared = await prepareChatImage();
      if (prepared) setPendingChatImage(prepared);
    } catch (e) {
      Alert.alert(
        "Image",
        e instanceof Error ? e.message : "Could not add image.",
      );
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    const localImage = pendingChatImage;
    if ((!text && !localImage) || isLoading) return;

    /** Dismiss keyboard and clear Android lift immediately so streaming never fights stale inset. */
    resetKeyboardLayoutState();
    composerInputRef.current?.blur();

    const titleSeed = text || "Question about an image";

    setInput("");
    setPendingChatImage(null);
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    setComposerScrollable(false);

    if (!titleSet.current) {
      titleSet.current = true;
      generateTitle({ firstMessage: titleSeed })
        .then((aiTitle) => {
          setDisplayTitle(aiTitle);
          void updateTitle({ sessionId, title: aiTitle });
        })
        .catch(() => {
          const fallback =
            titleSeed.length > 50 ? titleSeed.slice(0, 50) + "…" : titleSeed;
          setDisplayTitle(fallback);
          void updateTitle({ sessionId, title: fallback });
        });
    }

    try {
      let imageStorageId: Id<"_storage"> | undefined;
      if (localImage) {
        const { uploadUrl } = await generateChatImageUploadUrl({ sessionId });
        const sid = await uploadToConvexStorage(
          uploadUrl,
          localImage.uri,
          localImage.mime,
        );
        imageStorageId = sid as Id<"_storage">;
      }

      const saveResult = await saveMessage({
        sessionId,
        content: text,
        ...(imageStorageId ? { imageStorageId } : {}),
      });

      const imagePublicUrl = saveResult.imageUrl ?? null;

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

      const filePart = {
        type: "file" as const,
        url: imagePublicUrl!,
        mediaType: "image/jpeg" as const,
        filename: "image.jpg",
      };

      if (imagePublicUrl) {
        if (text) {
          sendMessage({ text, files: [filePart] });
        } else {
          sendMessage({ files: [filePart] });
        }
      } else {
        sendMessage({ text });
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

  const handleComposerContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const targetHeight = Math.max(
      COMPOSER_MIN_HEIGHT,
      Math.min(COMPOSER_MAX_HEIGHT, contentHeight),
    );

    setComposerHeight(targetHeight);
    setComposerScrollable(contentHeight >= COMPOSER_MAX_HEIGHT - 1);
  };

  const allDisplayed = useMemo(
    () => existingMessages ?? [],
    [existingMessages],
  );

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
      (_: ChatMessageRow, index: number) => index !== latestAssistantIndex,
    );
  })();

  useEffect(() => {
    if (!isPersistingAssistant || !pendingAssistantText) return;

    const latestPersistedAssistant = [...allDisplayed]
      .reverse()
      .find((m: ChatMessageRow) => m.role === "assistant");

    const wasSaved = latestPersistedAssistant?.content === pendingAssistantText;

    if (wasSaved) {
      setPendingAssistantText(null);
      setIsPersistingAssistant(false);
    }
  }, [allDisplayed, isPersistingAssistant, pendingAssistantText]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [displayedMessages.length, streamingAssistantText]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      if (Platform.OS === "android") {
        setAndroidKeyboardInset(e.endCoordinates.height);
      }
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        Platform.OS === "ios" ? 60 : 120,
      );
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      if (Platform.OS === "android") {
        setAndroidKeyboardInset(0);
      }
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetKeyboardLayoutState();
      return () => {
        resetKeyboardLayoutState();
      };
    }, [resetKeyboardLayoutState]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        resetKeyboardLayoutState();
      }
    });
    return () => sub.remove();
  }, [resetKeyboardLayoutState]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", () => {
      resetKeyboardLayoutState();
    });
    return unsub;
  }, [navigation, resetKeyboardLayoutState]);

  /** Poll while lift is applied — `keyboardDidHide` is flaky during streaming. */
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!keyboardVisible || androidKeyboardInset <= 0) return;
    const id = setInterval(syncAndroidKeyboardLiftAfterNativeDismiss, 180);
    return () => clearInterval(id);
  }, [
    keyboardVisible,
    androidKeyboardInset,
    syncAndroidKeyboardLiftAfterNativeDismiss,
  ]);

  /** Snap on each stream chunk without waiting for the next poll tick. */
  useEffect(() => {
    syncAndroidKeyboardLiftAfterNativeDismiss();
  }, [
    streamingAssistantText,
    latestAssistantText,
    isLoading,
    syncAndroidKeyboardLiftAfterNativeDismiss,
  ]);

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
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
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  resetKeyboardLayoutState();
                  onBack();
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
              >
                <ArrowLeft size={20} color="white" />
              </TouchableOpacity>

              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  marginHorizontal: 6,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 17,
                    lineHeight: 22,
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {displayTitle}
                </Text>
              </View>

              <View style={{ width: 44, height: 44 }} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <KeyboardAvoidingView
        style={{
          flex: 1,
          paddingBottom:
            Platform.OS === "android" && keyboardVisible
              ? androidKeyboardInset
              : 0,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
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
          onScrollBeginDrag={() => {
            if (Platform.OS !== "android" || !keyboardVisible) return;
            setKeyboardVisible(false);
            setAndroidKeyboardInset(0);
            Keyboard.dismiss();
          }}
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
                    fontSize: 16,
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

            {displayedMessages.map((m: ChatMessageRow) => {
              const isUser = m.role === "user";
              const hasImage = Boolean(m.imageUrl);
              const hasText = m.content.trim().length > 0;
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
                    {hasImage ? (
                      <Image
                        source={{ uri: m.imageUrl! }}
                        style={{
                          width: 220,
                          height: 220,
                          borderRadius: 12,
                          marginBottom: hasText ? 10 : 0,
                          backgroundColor: isUser
                            ? "rgba(255,255,255,0.15)"
                            : "#F1F5F9",
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                    {hasText ? (
                      <Markdown
                        style={isUser ? userMarkdownStyles : aiMarkdownStyles}
                      >
                        {m.content}
                      </Markdown>
                    ) : null}
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

        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: keyboardVisible
              ? Math.max(insets.bottom, 8)
              : tabBarHeight + 8,
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
            }}
          >
            {pendingChatImage ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                  gap: 10,
                }}
              >
                <Image
                  source={{ uri: pendingChatImage.uri }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    backgroundColor: "#E2E8F0",
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setPendingChatImage(null)}
                  hitSlop={8}
                  style={{
                    padding: 8,
                    backgroundColor: "#F1F5F9",
                    borderRadius: 999,
                  }}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <TouchableOpacity
                onPress={handlePickChatImage}
                disabled={isLoading}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isLoading ? "#E2E8F0" : "#EEF2FF",
                  marginRight: 8,
                }}
              >
                <ImageIcon
                  size={22}
                  color={isLoading ? "#94A3B8" : "#4F46E5"}
                />
              </TouchableOpacity>
              <TextInput
                ref={composerInputRef}
                style={[
                  {
                    flex: 1,
                    minWidth: 0,
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
                    ...(Platform.OS === "android"
                      ? { includeFontPadding: false }
                      : {}),
                  },
                  Platform.OS === "web"
                    ? ({
                        overflowY: composerScrollable ? "auto" : "hidden",
                        scrollbarWidth: "none",
                      } as object)
                    : null,
                ]}
                placeholder="Ask anything…"
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
                onBlur={() => {
                  if (Platform.OS !== "android") return;
                  setKeyboardVisible(false);
                  setAndroidKeyboardInset(0);
                }}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={(!input.trim() && !pendingChatImage) || isLoading}
                style={{
                  backgroundColor:
                    (input.trim() || pendingChatImage) && !isLoading
                      ? "#4F46E5"
                      : "#E2E8F0",
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#4F46E5",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity:
                    (input.trim() || pendingChatImage) && !isLoading ? 0.3 : 0,
                  shadowRadius: 8,
                  elevation:
                    (input.trim() || pendingChatImage) && !isLoading ? 4 : 0,
                }}
              >
                <Send
                  size={18}
                  color={
                    (input.trim() || pendingChatImage) && !isLoading
                      ? "white"
                      : "#94A3B8"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
