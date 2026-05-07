import { useApp } from "@/components/ContextProvider";
import { ReadableMarkdown } from "@/components/ai/ReadableMarkdown";
import { aiMarkdownStyles } from "@/lib/aiChatShared";
import { alertInfo, confirmAsync } from "@/lib/confirm";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationAction } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Play,
  Trophy,
  User,
  XCircle,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ANSWER_REVEAL_TRANSITION_MS = 5000;
const LEADERBOARD_TRANSITION_MS = 5000;
const REVIEW_REDIRECT_MS = 3500;

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AuthRequired() {
  const router = useRouter();

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
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 28,
            padding: 32,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            width: "100%",
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
              <User size={32} color="rgba(255,255,255,0.85)" />
            </View>
            <Text
              style={{
                fontSize: 22,
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
                color: "rgba(255,255,255,0.74)",
                textAlign: "center",
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 28,
              }}
            >
              Sign in to play this live quiz.
            </Text>
            <TouchableOpacity
              style={{
                width: "100%",
                backgroundColor: "white",
                borderRadius: 18,
                paddingVertical: 16,
                paddingHorizontal: 24,
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
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    </SafeAreaView>
  );
}

function GeneratingProgressIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((value) => (value + 0.035) % 1);
    }, 70);
    return () => clearInterval(id);
  }, []);

  const barLeft = `${Math.round(progress * 70)}%` as `${number}%`;

  return (
    <View style={{ alignItems: "center", gap: 14 }}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <View
        style={{
          width: 180,
          maxWidth: "80%",
          height: 6,
          borderRadius: 999,
          backgroundColor: "#E0E7FF",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: barLeft,
            top: 0,
            bottom: 0,
            width: "30%",
            borderRadius: 999,
            backgroundColor: "#4F46E5",
          }}
        />
      </View>
    </View>
  );
}

function PhaseAdvanceRail({
  label,
  phaseKey,
  phaseStartedAt,
  durationMs,
  clockOffset,
  accentColor = "#4F46E5",
}: {
  label: string;
  phaseKey: string;
  phaseStartedAt: number;
  durationMs: number;
  clockOffset: number;
  accentColor?: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const elapsedMs = Math.max(0, Date.now() + clockOffset - phaseStartedAt);
    const startProgress = Math.min(1, elapsedMs / durationMs);
    const remainingMs = Math.max(0, durationMs - elapsedMs);

    progress.stopAnimation();
    progress.setValue(startProgress);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [clockOffset, durationMs, phaseKey, phaseStartedAt, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#C7D2FE",
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#312E81",
            fontSize: 12,
            fontWeight: "900",
            textTransform: "uppercase",
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text style={{ color: "#6366F1", fontSize: 12, fontWeight: "900" }}>
          Next
        </Text>
      </View>
      <View
        style={{
          height: 7,
          borderRadius: 999,
          backgroundColor: "rgba(99,102,241,0.16)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width,
            height: "100%",
            minWidth: 10,
            borderRadius: 999,
            backgroundColor: accentColor,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: "white",
              opacity: 0.92,
              marginRight: -1,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function LiveQuizRoomScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ roomId: string }>();
  const rawRoomId = Array.isArray(params.roomId)
    ? params.roomId[0]
    : params.roomId;
  const roomId = rawRoomId as Id<"liveQuizRooms">;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [now, setNow] = useState(Date.now());
  const [clockOffset, setClockOffset] = useState(0);
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [copyingRoomCode, setCopyingRoomCode] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const skipExitConfirmationRef = useRef(false);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const queryArgs =
    user && !deferAuthRedirect && rawRoomId ? { roomId } : "skip";
  const room = useQuery(api.liveQuiz.getLiveQuizRoom, queryArgs);
  const currentQuestion = useQuery(
    api.liveQuiz.getCurrentLiveQuestion,
    queryArgs,
  );
  const leaderboard = useQuery(api.liveQuiz.getLiveQuizLeaderboard, queryArgs);
  const startRoom = useMutation(api.liveQuiz.startLiveQuizRoom);
  const submitAnswer = useMutation(api.liveQuiz.submitLiveQuizAnswer);
  const displayedJoinCode = room?.joinCode ?? "";

  useEffect(() => {
    if (room?.status !== "finished" || !rawRoomId) return;

    const id = setTimeout(() => {
      router.replace(`/(tabs)/quiz/live/history/${rawRoomId}`);
    }, REVIEW_REDIRECT_MS);

    return () => clearTimeout(id);
  }, [rawRoomId, room?.status, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (room?.serverNow) {
      setClockOffset(room.serverNow - Date.now());
    }
  }, [room?.serverNow]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRoomCodeCopied(false);
  }, [displayedJoinCode]);

  const remainingSeconds = useMemo(() => {
    if (!room || room.status !== "question") return null;
    const syncedNow = now + clockOffset;
    const remainingMs = Math.max(
      0,
      room.secondsPerQuestion * 1000 - (syncedNow - room.phaseStartedAt),
    );
    return Math.ceil(remainingMs / 1000);
  }, [clockOffset, now, room]);

  const isLobby = room?.status === "lobby";
  const shouldConfirmExit =
    isLobby ||
    room?.status === "generating" ||
    room?.status === "question" ||
    room?.status === "answer_reveal" ||
    room?.status === "leaderboard";

  const exitDialogCopy = useMemo(
    () =>
      isLobby
        ? {
            title: "Leave room?",
            body: "Are you sure you want to leave this room? Players can still join until the host starts.",
            confirmLabel: "Leave Room",
          }
        : {
            title: "Exit live quiz?",
            body: "Do you really want to exit the quiz? You may miss questions while you are away.",
            confirmLabel: "Exit Quiz",
          },
    [isLobby],
  );

  const confirmExit = useCallback(
    async (pendingAction: NavigationAction | null) => {
      const shouldExit = await confirmAsync({
        title: exitDialogCopy.title,
        message: exitDialogCopy.body,
        confirmLabel: exitDialogCopy.confirmLabel,
        cancelLabel: "Stay",
      });

      if (!shouldExit) {
        return;
      }

      skipExitConfirmationRef.current = true;
      if (pendingAction) {
        navigation.dispatch(pendingAction);
        return;
      }
      router.back();
    },
    [exitDialogCopy, navigation, router],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (!shouldConfirmExit || skipExitConfirmationRef.current) {
        skipExitConfirmationRef.current = false;
        return;
      }

      event.preventDefault();
      void confirmExit(event.data.action);
    });

    return unsubscribe;
  }, [confirmExit, navigation, shouldConfirmExit]);

  const handleBackPress = useCallback(() => {
    if (shouldConfirmExit) {
      void confirmExit(null);
      return;
    }
    router.back();
  }, [confirmExit, router, shouldConfirmExit]);

  const startQuiz = useCallback(async () => {
    if (!rawRoomId) return;
    setStarting(true);
    try {
      await startRoom({ roomId });
    } catch (error) {
      alertInfo(
        "Live Quiz",
        error instanceof Error ? error.message : "Could not start this quiz.",
      );
    } finally {
      setStarting(false);
    }
  }, [rawRoomId, roomId, startRoom]);

  const handleStartPress = useCallback(async () => {
    if (!rawRoomId || starting) return;
    const shouldStart = await confirmAsync({
      title: "Start live quiz?",
      message:
        "Have all participants joined the room? Players cannot join after the quiz starts.",
      confirmLabel: "Start Quiz",
      cancelLabel: "Wait",
      variant: "info",
      confirmRole: "primary",
    });
    if (shouldStart) {
      void startQuiz();
    }
  }, [rawRoomId, startQuiz, starting]);

  const handleCopyRoomCode = useCallback(async () => {
    if (!displayedJoinCode || copyingRoomCode) return;

    setCopyingRoomCode(true);
    try {
      await Clipboard.setStringAsync(displayedJoinCode);
      setRoomCodeCopied(true);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setRoomCodeCopied(false);
        copyResetTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      alertInfo(
        "Live Quiz",
        error instanceof Error
          ? error.message
          : "Could not copy the room code.",
      );
    } finally {
      setCopyingRoomCode(false);
    }
  }, [copyingRoomCode, displayedJoinCode]);

  const handleSubmit = async (selectedOptionIndex: number) => {
    if (!rawRoomId || submittingIndex !== null || !currentQuestion?.canAnswer) {
      return;
    }
    setSubmittingIndex(selectedOptionIndex);
    try {
      await submitAnswer({ roomId, selectedOptionIndex });
    } catch (error) {
      alertInfo(
        "Live Quiz",
        error instanceof Error ? error.message : "Could not submit answer.",
      );
    } finally {
      setSubmittingIndex(null);
    }
  };

  if (token && deferAuthRedirect) return <LoadingScreen />;
  if (!user) return <AuthRequired />;

  const isLoading =
    room === undefined ||
    currentQuestion === undefined ||
    leaderboard === undefined;
  const phaseKey = room
    ? `${room.status}-${room.currentQuestionIndex}-${room.phaseStartedAt}`
    : "loading";
  const leaderboardAdvanceLabel =
    room && room.currentQuestionIndex + 1 >= room.questionCount
      ? "Final leaderboard coming up"
      : "Next question coming up";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.16)",
              }}
            >
              <ArrowLeft size={22} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
                Live Quiz
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                {room ? `Room ${room.joinCode}` : "Room"}
              </Text>
            </View>
            {room?.status === "question" && remainingSeconds !== null ? (
              <View
                style={{
                  minWidth: 54,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: "rgba(255,255,255,0.16)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>
                  {remainingSeconds}s
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: tabBarHeight + 20,
        }}
      >
        {isLoading ? (
          <View style={{ paddingTop: 72, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : room.status === "lobby" ? (
          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                style={{ color: "#64748B", fontWeight: "800", fontSize: 12 }}
              >
                ROOM CODE
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{ color: "#0F172A", fontSize: 32, fontWeight: "900" }}
                >
                  {room.joinCode}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={`Copy room code ${room.joinCode}`}
                  accessibilityRole="button"
                  disabled={copyingRoomCode}
                  hitSlop={8}
                  onPress={handleCopyRoomCode}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: roomCodeCopied ? "#DCFCE7" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: roomCodeCopied ? "#BBF7D0" : "#E2E8F0",
                    opacity: copyingRoomCode ? 0.68 : 1,
                  }}
                >
                  {roomCodeCopied ? (
                    <CheckCircle2 size={22} color="#16A34A" />
                  ) : (
                    <Copy size={22} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
              {roomCodeCopied ? (
                <Text
                  style={{ color: "#16A34A", marginTop: 6, fontWeight: "800" }}
                >
                  Code copied
                </Text>
              ) : null}
              <Text style={{ color: "#64748B", marginTop: 8, lineHeight: 21 }}>
                Share this code with friends. Players can join until the host
                starts.
              </Text>
              {room.error ? (
                <View
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 14,
                    borderWidth: 1,
                    borderColor: "#FECACA",
                  }}
                >
                  <Text style={{ color: "#B91C1C", fontWeight: "800" }}>
                    {room.error}
                  </Text>
                </View>
              ) : null}
            </View>

            <LeaderboardCard
              title="Players"
              leaderboard={leaderboard.leaderboard}
              emptyText="Waiting for players to join."
            />

            {room.isHost ? (
              <TouchableOpacity
                disabled={starting}
                onPress={handleStartPress}
                style={{
                  borderRadius: 16,
                  paddingVertical: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: starting ? "#A5B4FC" : "#4F46E5",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {starting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Play size={19} color="white" />
                )}
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 15 }}
                >
                  Start Quiz
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: "#EEF2FF",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#C7D2FE",
                }}
              >
                <Text style={{ color: "#4F46E5", fontWeight: "800" }}>
                  Waiting for the host to start.
                </Text>
              </View>
            )}
          </View>
        ) : room.status === "generating" ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 28,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
            }}
          >
            <GeneratingProgressIndicator />
            <Text
              style={{
                color: "#0F172A",
                fontSize: 18,
                fontWeight: "900",
                marginTop: 14,
              }}
            >
              {room.startedAt
                ? "Preparing next question"
                : "Generating first question"}
            </Text>
            <Text
              style={{ color: "#64748B", textAlign: "center", marginTop: 8 }}
            >
              {room.startedAt
                ? "The quiz will continue automatically when the next question is ready."
                : "The quiz will begin as soon as the first question is ready."}
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 10,
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {room.generatedQuestionCount}/{room.questionCount} ready
            </Text>
            {room.error ? (
              <View
                style={{
                  backgroundColor: "#FFFBEB",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                }}
              >
                <Text
                  style={{
                    color: "#92400E",
                    textAlign: "center",
                    fontWeight: "800",
                  }}
                >
                  Still generating. Retrying automatically.
                </Text>
              </View>
            ) : null}
          </View>
        ) : room.status === "leaderboard" || room.status === "finished" ? (
          <LeaderboardCard
            title={
              room.status === "finished" ? "Final Leaderboard" : "Leaderboard"
            }
            leaderboard={leaderboard.leaderboard}
            emptyText="No scores yet."
            final={room.status === "finished"}
            transitionRail={
              room.status === "finished" ? (
                <PhaseAdvanceRail
                  label="Opening quiz review"
                  phaseKey={phaseKey}
                  phaseStartedAt={room.phaseStartedAt}
                  durationMs={REVIEW_REDIRECT_MS}
                  clockOffset={clockOffset}
                  accentColor="#F59E0B"
                />
              ) : (
                <PhaseAdvanceRail
                  label={leaderboardAdvanceLabel}
                  phaseKey={phaseKey}
                  phaseStartedAt={room.phaseStartedAt}
                  durationMs={LEADERBOARD_TRANSITION_MS}
                  clockOffset={clockOffset}
                />
              )
            }
          />
        ) : currentQuestion ? (
          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#94A3B8",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#64748B", fontWeight: "900" }}>
                  Question {currentQuestion.questionIndex + 1}/
                  {currentQuestion.totalQuestions}
                </Text>
                {room.status === "question" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Clock3 size={16} color="#4F46E5" />
                    <Text style={{ color: "#4F46E5", fontWeight: "900" }}>
                      {remainingSeconds ?? 0}s
                    </Text>
                  </View>
                ) : null}
              </View>

              <ReadableMarkdown style={aiMarkdownStyles}>
                {currentQuestion.question}
              </ReadableMarkdown>

              <View style={{ gap: 9, marginTop: 12 }}>
                {currentQuestion.options.map((option, index) => {
                  const selectedIndex =
                    currentQuestion.myAnswer?.selectedOptionIndex ??
                    submittingIndex;
                  const isSelected = selectedIndex === index;
                  const isReveal = room.status === "answer_reveal";
                  const isCorrect =
                    isReveal && currentQuestion.correctOptionIndex === index;
                  const isWrongSelection = isReveal && isSelected && !isCorrect;
                  return (
                    <TouchableOpacity
                      key={`${currentQuestion.questionIndex}-${option}`}
                      disabled={
                        !currentQuestion.canAnswer || submittingIndex !== null
                      }
                      onPress={() => handleSubmit(index)}
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: isCorrect
                          ? "#16A34A"
                          : isWrongSelection
                            ? "#DC2626"
                            : isSelected
                              ? "#4F46E5"
                              : "#E2E8F0",
                        backgroundColor: isCorrect
                          ? "#DCFCE7"
                          : isWrongSelection
                            ? "#FEE2E2"
                            : isSelected
                              ? "#EEF2FF"
                              : "#F8FAFC",
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: "#0F172A",
                          fontSize: 14,
                          lineHeight: 20,
                          fontWeight: isSelected || isCorrect ? "800" : "500",
                        }}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {room.status === "question" && currentQuestion.myAnswer ? (
                <View
                  style={{
                    backgroundColor: "#EEF2FF",
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "#C7D2FE",
                  }}
                >
                  <Text style={{ color: "#4F46E5", fontWeight: "800" }}>
                    Answer locked. Results appear when the timer ends.
                  </Text>
                </View>
              ) : null}

              {room.status === "answer_reveal" ? (
                <PhaseAdvanceRail
                  label="Leaderboard coming up"
                  phaseKey={phaseKey}
                  phaseStartedAt={room.phaseStartedAt}
                  durationMs={ANSWER_REVEAL_TRANSITION_MS}
                  clockOffset={clockOffset}
                />
              ) : null}

              {room.status === "answer_reveal" &&
              currentQuestion.explanation ? (
                <View
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {currentQuestion.myAnswer?.isCorrect ? (
                      <CheckCircle2 size={20} color="#16A34A" />
                    ) : (
                      <XCircle size={20} color="#DC2626" />
                    )}
                    <Text style={{ color: "#0F172A", fontWeight: "900" }}>
                      {currentQuestion.myAnswer?.isCorrect
                        ? "Correct"
                        : "Wrong"}
                    </Text>
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <ReadableMarkdown style={aiMarkdownStyles}>
                      {currentQuestion.explanation}
                    </ReadableMarkdown>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ paddingTop: 72, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type LeaderboardRow = {
  rank: number;
  userId: Id<"users">;
  name: string;
  image: string;
  class: string;
  score: number;
  correctCount: number;
  lastScoreDelta: number;
  isMe: boolean;
};

function LeaderboardCard({
  title,
  leaderboard,
  emptyText,
  final = false,
  transitionRail,
}: {
  title: string;
  leaderboard: LeaderboardRow[];
  emptyText: string;
  final?: boolean;
  transitionRail?: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Trophy size={20} color={final ? "#F59E0B" : "#4F46E5"} />
        <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}>
          {title}
        </Text>
      </View>

      {transitionRail}

      {leaderboard.length === 0 ? (
        <Text style={{ color: "#64748B", marginTop: 12 }}>{emptyText}</Text>
      ) : (
        <View style={{ gap: 10, marginTop: 14 }}>
          {leaderboard.map((row) => (
            <View
              key={row.userId}
              style={{
                borderRadius: 14,
                padding: 12,
                backgroundColor: row.isMe ? "#EEF2FF" : "#F8FAFC",
                borderWidth: 1,
                borderColor: row.isMe ? "#C7D2FE" : "#E2E8F0",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  backgroundColor: row.rank <= 3 ? "#E0E7FF" : "white",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#4F46E5", fontWeight: "900" }}>
                  #{row.rank}
                </Text>
              </View>
              {row.image ? (
                <Image
                  source={{ uri: row.image }}
                  style={{ width: 38, height: 38, borderRadius: 19 }}
                />
              ) : (
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#E0E7FF",
                  }}
                >
                  <Text style={{ color: "#4F46E5", fontWeight: "900" }}>
                    {avatarInitials(row.name)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: "#0F172A", fontWeight: "900" }}
                >
                  {row.name}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                  {row.correctCount} correct
                  {row.lastScoreDelta > 0 ? ` - +${row.lastScoreDelta}` : ""}
                </Text>
              </View>
              <Text
                style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}
              >
                {row.score}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
