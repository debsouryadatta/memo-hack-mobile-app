import { useApp } from "@/components/ContextProvider";
import { ReadableMarkdown } from "@/components/ai/ReadableMarkdown";
import { aiMarkdownStyles } from "@/lib/aiChatShared";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Atom,
  CheckCircle2,
  Dna,
  FlaskConical,
  Medal,
  Trophy,
  User,
  XCircle,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QuizSubject = "physics" | "chemistry" | "biology";
type QuizQuestion = {
  _id: Id<"dailyQuizQuestions">;
  dayKey: string;
  subject: QuizSubject;
  question: string;
  options: string[];
  explanation: string | null;
  correctOptionIndex: number | null;
  attempt: {
    selectedOptionIndex: number;
    isCorrect: boolean;
    score: number;
    submittedAt: number;
  } | null;
};

const subjectMeta: Record<
  QuizSubject,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
  }
> = {
  physics: {
    label: "Physics",
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: Atom,
  },
  chemistry: {
    label: "Chemistry",
    color: "#059669",
    bg: "#D1FAE5",
    icon: FlaskConical,
  },
  biology: {
    label: "Biology",
    color: "#16A34A",
    bg: "#DCFCE7",
    icon: Dna,
  },
};

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
              {"Sign in to attempt today's quiz and join the leaderboard."}
            </Text>
            <TouchableOpacity
              style={{
                width: "100%",
                backgroundColor: "white",
                borderRadius: 18,
                paddingVertical: 16,
                paddingHorizontal: 24,
                marginBottom: 16,
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
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={{ color: "white", fontWeight: "700" }}>
                Create an account
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

export default function DailyQuizScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard">("quiz");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [submittingId, setSubmittingId] =
    useState<Id<"dailyQuizQuestions"> | null>(null);

  const queryArgs = user && !deferAuthRedirect ? {} : "skip";
  const quiz = useQuery(api.dailyQuiz.getTodayQuiz, queryArgs);
  const leaderboard = useQuery(api.dailyQuiz.getOverallLeaderboard, queryArgs);
  const submitAnswer = useMutation(api.dailyQuiz.submitAnswer);

  const questions = useMemo(
    () => ((quiz?.questions ?? []) as QuizQuestion[]),
    [quiz?.questions],
  );
  const attemptedCount = useMemo(
    () => questions.filter((question) => question.attempt).length,
    [questions],
  );
  const score = useMemo(
    () =>
      questions.reduce(
        (sum, question) => sum + (question.attempt?.score ?? 0),
        0,
      ),
    [questions],
  );

  const handleSubmit = async (question: QuizQuestion) => {
    const selected = selectedAnswers[question._id];
    if (selected === undefined || question.attempt || submittingId) return;

    setSubmittingId(question._id);
    try {
      await submitAnswer({
        questionId: question._id,
        selectedOptionIndex: selected,
      });
    } catch (error) {
      Alert.alert(
        "Quiz",
        error instanceof Error ? error.message : "Could not submit your answer.",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  if (token && deferAuthRedirect) return <LoadingScreen />;
  if (!user) return <AuthRequired />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Trophy size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>
                Daily Quiz
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              marginTop: 18,
              padding: 4,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          >
            {(["quiz", "leaderboard"] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    paddingVertical: 11,
                    alignItems: "center",
                    backgroundColor: active ? "white" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#4F46E5" : "rgba(255,255,255,0.76)",
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    {tab === "quiz" ? "Quiz" : "Leaderboards"}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
        {activeTab === "quiz" ? (
          quiz === undefined ? (
            <View style={{ paddingTop: 72, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : !quiz.isReady ? (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                style={{
                  color: "#0F172A",
                  fontWeight: "800",
                  fontSize: 18,
                  marginBottom: 8,
                }}
              >
                {"Today's quiz is being prepared"}
              </Text>
              <Text style={{ color: "#64748B", lineHeight: 21 }}>
                The daily questions are generated at 12:01 AM IST. Please
                check back in a bit.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 11,
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {"Today's Quiz"}
                  </Text>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontSize: 15,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
                    {quiz.dayKey}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: "#4F46E5",
                      fontSize: 15,
                      fontWeight: "900",
                    }}
                  >
                    {score}/3 points
                  </Text>
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 12,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {attemptedCount}/3 attempted
                  </Text>
                </View>
              </View>

              {questions.map((question) => {
                const meta = subjectMeta[question.subject];
                const Icon = meta.icon;
                const selected = selectedAnswers[question._id];
                const attempted = question.attempt != null;
                const canSubmit = selected !== undefined && !attempted;

                return (
                  <View
                    key={question._id}
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
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            backgroundColor: meta.bg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={18} color={meta.color} />
                        </View>
                        <Text
                          style={{
                            color: "#0F172A",
                            fontSize: 17,
                            fontWeight: "800",
                          }}
                        >
                          {meta.label}
                        </Text>
                      </View>
                      {attempted ? (
                        question.attempt?.isCorrect ? (
                          <CheckCircle2 size={22} color="#16A34A" />
                        ) : (
                          <XCircle size={22} color="#DC2626" />
                        )
                      ) : null}
                    </View>

                    <ReadableMarkdown style={aiMarkdownStyles}>
                      {question.question}
                    </ReadableMarkdown>

                    <View style={{ gap: 9, marginTop: 6 }}>
                      {question.options.map((option, index) => {
                        const isSelected =
                          (attempted
                            ? question.attempt?.selectedOptionIndex
                            : selected) === index;
                        const isCorrect =
                          attempted && question.correctOptionIndex === index;
                        const isWrongSelection =
                          attempted && isSelected && !isCorrect;

                        return (
                          <TouchableOpacity
                            key={`${question._id}-${option}`}
                            disabled={attempted}
                            onPress={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [question._id]: index,
                              }))
                            }
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
                                fontWeight: isSelected || isCorrect ? "700" : "500",
                              }}
                            >
                              {String.fromCharCode(65 + index)}. {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {attempted && question.explanation ? (
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
                        <Text
                          style={{
                            color: "#0F172A",
                            fontWeight: "800",
                            marginBottom: 4,
                          }}
                        >
                          Explanation
                        </Text>
                        <ReadableMarkdown style={aiMarkdownStyles}>
                          {question.explanation}
                        </ReadableMarkdown>
                      </View>
                    ) : (
                      <TouchableOpacity
                        disabled={!canSubmit || submittingId === question._id}
                        onPress={() => handleSubmit(question)}
                        style={{
                          marginTop: 12,
                          borderRadius: 14,
                          paddingVertical: 13,
                          alignItems: "center",
                          backgroundColor: canSubmit ? "#4F46E5" : "#E2E8F0",
                          opacity: submittingId === question._id ? 0.72 : 1,
                        }}
                      >
                        {submittingId === question._id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text
                            style={{
                              color: canSubmit ? "white" : "#94A3B8",
                              fontWeight: "800",
                              fontSize: 15,
                            }}
                          >
                            Submit Answer
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )
        ) : leaderboard === undefined ? (
          <View style={{ paddingTop: 72, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : leaderboard.leaderboard.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
            }}
          >
            <Medal size={42} color="#94A3B8" />
            <Text
              style={{
                color: "#0F172A",
                fontWeight: "800",
                fontSize: 18,
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              No attempts yet
            </Text>
            <Text style={{ color: "#64748B", textAlign: "center" }}>
              {"Be the first to put points on the overall leaderboard."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {leaderboard.leaderboard.map((row) => (
              <View
                key={row.userId}
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: row.rank <= 3 ? "#C7D2FE" : "#E2E8F0",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    backgroundColor: row.rank <= 3 ? "#EEF2FF" : "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: row.rank <= 3 ? "#4F46E5" : "#64748B",
                      fontWeight: "900",
                    }}
                  >
                    #{row.rank}
                  </Text>
                </View>
                {row.image ? (
                  <Image
                    source={{ uri: row.image }}
                    style={{ width: 42, height: 42, borderRadius: 21 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
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
                    style={{
                      color: "#0F172A",
                      fontWeight: "800",
                      fontSize: 15,
                    }}
                  >
                    {row.name}
                  </Text>
                  <Text style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                    Class {row.class} · {row.attemptedCount} attempted ·{" "}
                    {row.correctCount} correct
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}
                  >
                    {row.score}
                  </Text>
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
