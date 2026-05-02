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
    type ChatImageSource,
    type PreparedImage,
} from "@/lib/imageUpload";
import { ReadableMarkdown } from "./ReadableMarkdown";
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
    Camera,
    Image as ImageIcon,
    Images,
    Send,
    Square,
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
    Modal,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TextInputContentSizeChangeEventData,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type OutgoingUserMessage = {
  id: string;
  persistedId?: Id<"aiChatMessages">;
  content: string;
  imageUri?: string;
  statusText: string;
};

type LocalAssistantMessage = {
  id: string;
  content: string;
};

function ChatBubbleImage({
  remoteUri,
  fallbackUri,
  isUser,
  marginBottom,
  statusText,
}: {
  remoteUri?: string | null;
  fallbackUri?: string;
  isUser: boolean;
  marginBottom: number;
  statusText?: string;
}) {
  const [remoteReady, setRemoteReady] = useState(
    Boolean(remoteUri) && !fallbackUri,
  );
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(Boolean(remoteUri));

  useEffect(() => {
    let cancelled = false;
    setRemoteFailed(false);

    if (!remoteUri) {
      setRemoteReady(false);
      setImageLoading(false);
      return;
    }

    if (!fallbackUri) {
      setRemoteReady(true);
      setImageLoading(true);
      return;
    }

    setRemoteReady(false);
    setImageLoading(false);
    Image.prefetch(remoteUri)
      .then(() => {
        if (!cancelled) {
          setRemoteReady(true);
          setImageLoading(true);
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [remoteUri, fallbackUri]);

  const imageUri =
    remoteReady && remoteUri ? remoteUri : fallbackUri ?? remoteUri;
  const waitingForRemote = Boolean(
    remoteUri && fallbackUri && !remoteReady && !remoteFailed,
  );
  const loadingLabel =
    statusText ??
    (waitingForRemote || (imageUri && imageLoading)
      ? "Loading image..."
      : null);
  const errorLabel =
    !imageUri || (remoteFailed && !fallbackUri) ? "Image unavailable" : null;

  return (
    <View
      style={{
        width: 220,
        height: 220,
        borderRadius: 12,
        marginBottom,
        overflow: "hidden",
        backgroundColor: isUser ? "rgba(255,255,255,0.15)" : "#F1F5F9",
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            if (remoteReady) setRemoteFailed(true);
          }}
        />
      ) : null}

      {loadingLabel ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: 42,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 12,
            backgroundColor: "rgba(15,23,42,0.68)",
          }}
        >
          <ActivityIndicator size="small" color="white" />
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {loadingLabel}
          </Text>
        </View>
      ) : errorLabel ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Text
            style={{
              color: isUser ? "white" : "#64748B",
              fontSize: 12,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {errorLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

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
  const [chatErrorText, setChatErrorText] = useState<string | null>(null);
  const [pendingChatImage, setPendingChatImage] =
    useState<PreparedImage | null>(null);
  const [outgoingUserMessage, setOutgoingUserMessage] =
    useState<OutgoingUserMessage | null>(null);
  const [localAssistantMessages, setLocalAssistantMessages] = useState<
    LocalAssistantMessage[]
  >([]);
  const [localImageByMessageId, setLocalImageByMessageId] = useState<
    Record<string, string>
  >({});
  const [imagePickerSheetVisible, setImagePickerSheetVisible] = useState(false);
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
  const stopRequestedRef = useRef(false);
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
    stop,
    status,
  } = useChat({
    transport: chatTransport,
    onFinish: async ({ message }) => {
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        setIsAwaitingAssistant(false);
        return;
      }
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
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        return;
      }
      setChatErrorText(
        "I could not get a response right now. Please try sending it again.",
      );
      console.error("chat error:", error);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isSendingUserMessage = outgoingUserMessage != null;
  const isComposerBusy = isLoading || isSendingUserMessage;
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

  const addChatImage = async (source: ChatImageSource) => {
    if (isComposerBusy) return;
    try {
      const prepared = await prepareChatImage(source);
      if (prepared) setPendingChatImage(prepared);
    } catch (e) {
      Alert.alert(
        "Image",
        e instanceof Error ? e.message : "Could not add image.",
      );
    }
  };

  const handlePickChatImage = () => {
    if (isComposerBusy) return;
    if (Platform.OS === "web") {
      void addChatImage("library");
      return;
    }

    setImagePickerSheetVisible(true);
  };

  const handleImageSourceChoice = (source: ChatImageSource) => {
    setImagePickerSheetVisible(false);
    setTimeout(
      () => void addChatImage(source),
      Platform.OS === "android" ? 180 : 0,
    );
  };

  const handleStopStreaming = () => {
    if (!isLoading) return;
    if (stopRequestedRef.current) return;

    stopRequestedRef.current = true;
    setTimeout(() => {
      stopRequestedRef.current = false;
    }, 1200);

    const partialText = latestAssistantText.trim();
    stop();
    setIsAwaitingAssistant(false);
    setPendingAssistantText(null);
    setIsPersistingAssistant(false);
    setChatErrorText(null);

    if (partialText) {
      setLocalAssistantMessages((current) => [
        ...current,
        {
          id: `stopped-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: partialText,
        },
      ]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    const localImage = pendingChatImage;
    if ((!text && !localImage) || isComposerBusy) return;

    /** Dismiss keyboard and clear Android lift immediately so streaming never fights stale inset. */
    resetKeyboardLayoutState();
    composerInputRef.current?.blur();

    const titleSeed = text || "Question about an image";
    const outgoingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setInput("");
    setPendingChatImage(null);
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    setComposerScrollable(false);
    setChatErrorText(null);
    setOutgoingUserMessage({
      id: outgoingId,
      content: text,
      imageUri: localImage?.uri,
      statusText: localImage ? "Uploading image..." : "Sending...",
    });

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

    let messageWasSaved = false;
    try {
      let imageStorageId: Id<"_storage"> | undefined;
      if (localImage) {
        setOutgoingUserMessage((current) =>
          current?.id === outgoingId
            ? { ...current, statusText: "Uploading image..." }
            : current,
        );
        const { uploadUrl } = await generateChatImageUploadUrl({ sessionId });
        const sid = await uploadToConvexStorage(
          uploadUrl,
          localImage.uri,
          localImage.mime,
        );
        imageStorageId = sid as Id<"_storage">;
        setOutgoingUserMessage((current) =>
          current?.id === outgoingId
            ? { ...current, statusText: "Saving message..." }
            : current,
        );
      }

      const saveResult = await saveMessage({
        sessionId,
        content: text,
        ...(imageStorageId ? { imageStorageId } : {}),
      });
      messageWasSaved = true;

      const imagePublicUrl = saveResult.imageUrl ?? null;
      if (localImage) {
        setLocalImageByMessageId((current) => ({
          ...current,
          [saveResult._id]: localImage.uri,
        }));
      }
      setOutgoingUserMessage((current) =>
        current?.id === outgoingId
          ? {
              ...current,
              persistedId: saveResult._id,
              statusText: "Asking AI...",
            }
          : current,
      );
      if (localImage && !imagePublicUrl) {
        throw new Error(
          "The image was saved, but it is not ready for the AI tutor yet. Please try again.",
        );
      }

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
      setOutgoingUserMessage(null);
      setIsAwaitingAssistant(false);
      if (!messageWasSaved) {
        setInput(text);
        if (localImage) setPendingChatImage(localImage);
      }
      const usageMessage = getUsageLimitMessage(error);
      if (usageMessage) {
        Alert.alert("Limit reached", usageMessage);
        return;
      }
      if (isAuthRequiredError(error)) {
        return;
      }
      Alert.alert(
        "Could not send",
        error instanceof Error
          ? error.message
          : "Something went wrong while sending your message.",
      );
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

  useEffect(() => {
    setLocalAssistantMessages([]);
    setOutgoingUserMessage(null);
    setLocalImageByMessageId({});
    setChatErrorText(null);
    stopRequestedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    setLocalAssistantMessages((current) => {
      const filtered = current.filter(
        (localMessage) =>
          !allDisplayed.some(
            (message) =>
              message.role === "assistant" &&
              message.content.trim() === localMessage.content.trim(),
          ),
      );
      return filtered.length === current.length ? current : filtered;
    });
  }, [allDisplayed]);

  const displayedMessages = (() => {
    const messages =
      outgoingUserMessage?.persistedId == null
        ? allDisplayed
        : allDisplayed.filter((m) => m._id !== outgoingUserMessage.persistedId);

    if (
      !isPersistingAssistant ||
      !pendingAssistantText ||
      messages.length === 0
    ) {
      return messages;
    }

    const latestAssistantIndex = [...messages]
      .map((m, index) => ({ m, index }))
      .reverse()
      .find(({ m }) => m.role === "assistant")?.index;

    if (latestAssistantIndex === undefined) return messages;
    if (messages[latestAssistantIndex]?.content !== pendingAssistantText)
      return messages;

    return messages.filter(
      (_: ChatMessageRow, index: number) => index !== latestAssistantIndex,
    );
  })();

  useEffect(() => {
    if (!outgoingUserMessage?.persistedId) return;
    const persistedIsVisible = allDisplayed.some(
      (m) => m._id === outgoingUserMessage.persistedId,
    );
    if (persistedIsVisible) {
      setOutgoingUserMessage(null);
    }
  }, [allDisplayed, outgoingUserMessage?.persistedId]);

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
  }, [
    chatErrorText,
    displayedMessages.length,
    localAssistantMessages.length,
    outgoingUserMessage?.statusText,
    streamingAssistantText,
  ]);

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
            {displayedMessages.length === 0 && !isComposerBusy && (
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
              const localImageUri = localImageByMessageId[m._id];
              const hasImage = Boolean(
                m.imageUrl || localImageUri || m.imageStorageId,
              );
              const hasText = m.content.trim().length > 0;
              return (
                <View
                  key={m._id}
                  style={{
                    marginBottom: 10,
                    maxWidth: isUser ? "82%" : "92%",
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
                      <ChatBubbleImage
                        remoteUri={m.imageUrl}
                        fallbackUri={localImageUri}
                        isUser={isUser}
                        marginBottom={hasText ? 10 : 0}
                        statusText={
                          !m.imageUrl && !localImageUri && m.imageStorageId
                            ? "Loading image..."
                            : undefined
                        }
                      />
                    ) : null}
                    {hasText ? (
                      <ReadableMarkdown
                        style={isUser ? userMarkdownStyles : aiMarkdownStyles}
                      >
                        {m.content}
                      </ReadableMarkdown>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {localAssistantMessages.map((message) => (
              <View
                key={message.id}
                style={{
                  marginBottom: 10,
                  maxWidth: "92%",
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
                  <ReadableMarkdown style={aiMarkdownStyles}>
                    {message.content}
                  </ReadableMarkdown>
                </View>
              </View>
            ))}

            {outgoingUserMessage
              ? (() => {
                  const hasText =
                    outgoingUserMessage.content.trim().length > 0;
                  const hasImage = Boolean(outgoingUserMessage.imageUri);

                  return (
                    <View
                      style={{
                        marginBottom: 10,
                        maxWidth: "82%",
                        alignSelf: "flex-end",
                      }}
                    >
                      <View
                        style={{
                          borderRadius: 20,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: "#4F46E5",
                          borderBottomRightRadius: 4,
                          borderBottomLeftRadius: 20,
                          shadowColor: "#4F46E5",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 6,
                          elevation: 2,
                          opacity: 0.96,
                        }}
                      >
                        {hasImage ? (
                          <ChatBubbleImage
                            fallbackUri={outgoingUserMessage.imageUri}
                            isUser
                            marginBottom={hasText ? 10 : 0}
                            statusText={outgoingUserMessage.statusText}
                          />
                        ) : null}
                        {hasText ? (
                          <ReadableMarkdown style={userMarkdownStyles}>
                            {outgoingUserMessage.content}
                          </ReadableMarkdown>
                        ) : null}
                        {!hasImage ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              marginTop: hasText ? 8 : 0,
                            }}
                          >
                            <ActivityIndicator size="small" color="white" />
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.86)",
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {outgoingUserMessage.statusText}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })()
              : null}

            {isStreaming && streamingAssistantText ? (
              <View
                style={{
                  marginBottom: 10,
                  maxWidth: "92%",
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
                  <ReadableMarkdown style={aiMarkdownStyles}>
                    {streamingAssistantText}
                  </ReadableMarkdown>
                </View>
              </View>
            ) : isPersistingAssistant && pendingAssistantText ? (
              <View
                style={{
                  marginBottom: 10,
                  maxWidth: "92%",
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
                  <ReadableMarkdown style={aiMarkdownStyles}>
                    {pendingAssistantText}
                  </ReadableMarkdown>
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
            ) : chatErrorText ? (
              <View
                style={{
                  marginBottom: 10,
                  maxWidth: "92%",
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
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1,
                    borderColor: "#FECACA",
                  }}
                >
                  <Text
                    style={{
                      color: "#991B1B",
                      fontSize: 14,
                      lineHeight: 20,
                      fontWeight: "600",
                    }}
                  >
                    {chatErrorText}
                  </Text>
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
                disabled={isComposerBusy}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isComposerBusy ? "#E2E8F0" : "#EEF2FF",
                  marginRight: 8,
                }}
              >
                <ImageIcon
                  size={22}
                  color={isComposerBusy ? "#94A3B8" : "#4F46E5"}
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
                onPress={isLoading ? handleStopStreaming : handleSend}
                accessibilityRole="button"
                accessibilityLabel={
                  isLoading ? "Stop response" : "Send message"
                }
                disabled={
                  isSendingUserMessage ||
                  (!isLoading && !input.trim() && !pendingChatImage)
                }
                style={{
                  backgroundColor:
                    isLoading ||
                    ((input.trim() || pendingChatImage) && !isComposerBusy)
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
                    isLoading ||
                    ((input.trim() || pendingChatImage) && !isComposerBusy)
                      ? 0.3
                      : 0,
                  shadowRadius: 8,
                  elevation:
                    isLoading ||
                    ((input.trim() || pendingChatImage) && !isComposerBusy)
                      ? 4
                      : 0,
                }}
              >
                {isLoading ? (
                  <Square size={14} color="white" fill="white" />
                ) : (
                  <Send
                    size={18}
                    color={
                      (input.trim() || pendingChatImage) && !isComposerBusy
                        ? "white"
                        : "#94A3B8"
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={imagePickerSheetVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImagePickerSheetVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setImagePickerSheetVisible(false)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(15,23,42,0.58)",
            }}
          />

          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 28,
                padding: 18,
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 18 },
                shadowOpacity: 0.24,
                shadowRadius: 28,
                elevation: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: "#CBD5E1",
                  alignSelf: "center",
                  marginBottom: 16,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontSize: 22,
                      lineHeight: 28,
                      fontWeight: "800",
                    }}
                  >
                    Add image
                  </Text>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 14,
                      lineHeight: 20,
                      marginTop: 4,
                    }}
                  >
                    Share a question, diagram, or handwritten note with your AI
                    tutor.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setImagePickerSheetVisible(false)}
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F1F5F9",
                  }}
                >
                  <X size={18} color="#475569" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => handleImageSourceChoice("camera")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#EEF2FF",
                  }}
                >
                  <Camera size={22} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    Take photo
                  </Text>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      marginTop: 3,
                    }}
                    numberOfLines={1}
                  >
                    Capture a fresh question now
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => handleImageSourceChoice("library")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ECFDF5",
                  }}
                >
                  <Images size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    Choose from gallery
                  </Text>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      marginTop: 3,
                    }}
                    numberOfLines={1}
                  >
                    Pick a saved image or screenshot
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
