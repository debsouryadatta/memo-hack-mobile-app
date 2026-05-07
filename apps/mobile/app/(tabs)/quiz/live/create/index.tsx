import { useApp } from "@/components/ContextProvider";
import { alertInfo } from "@/lib/confirm";
import { api } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Atom,
  Check,
  ChevronDown,
  ChevronRight,
  Dna,
  FlaskConical,
  Plus,
  User,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QuizSubject = "physics" | "chemistry" | "biology";
type NcertClassLevel = "11" | "12";
type NcertChapter = {
  key: string;
  subject: QuizSubject;
  class: NcertClassLevel;
  title: string;
  examTags: ("neet" | "jee")[];
};
type ChaptersBySubject = Record<
  QuizSubject,
  Record<NcertClassLevel, NcertChapter[]>
>;

const subjects: {
  key: QuizSubject;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "physics", label: "Physics", icon: Atom },
  { key: "chemistry", label: "Chemistry", icon: FlaskConical },
  { key: "biology", label: "Biology", icon: Dna },
];

const questionCounts = [5, 10, 15];
const timers = [15, 30, 45];
const maxSelectedChapters = 24;

const emptyChaptersByClass: Record<NcertClassLevel, NcertChapter[]> = {
  "11": [],
  "12": [],
};

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
              Sign in to create a live quiz.
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

export default function CreateLiveQuizScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const chaptersQuery = useQuery(api.liveQuiz.getNcertChapters, {});
  const createRoom = useMutation(api.liveQuiz.createLiveQuizRoom);
  const [selectedChapterKeys, setSelectedChapterKeys] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<QuizSubject, boolean>
  >({
    physics: false,
    chemistry: false,
    biology: false,
  });
  const [questionCount, setQuestionCount] = useState(5);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30);
  const [creating, setCreating] = useState(false);

  const chaptersBySubject = useMemo(
    () => chaptersQuery as ChaptersBySubject | undefined,
    [chaptersQuery],
  );

  const selectedSet = useMemo(
    () => new Set(selectedChapterKeys),
    [selectedChapterKeys],
  );

  const selectedCountsBySubject = useMemo(
    () =>
      subjects.reduce(
        (counts, item) => {
          const chaptersByClass =
            chaptersBySubject?.[item.key] ?? emptyChaptersByClass;
          counts[item.key] = (["11", "12"] as const).reduce(
            (sum, classLevel) =>
              sum +
              chaptersByClass[classLevel].filter((chapter) =>
                selectedSet.has(chapter.key),
              ).length,
            0,
          );
          return counts;
        },
        { physics: 0, chemistry: 0, biology: 0 } as Record<QuizSubject, number>,
      ),
    [chaptersBySubject, selectedSet],
  );

  const toggleChapter = (chapterKey: string) => {
    setSelectedChapterKeys((prev) => {
      if (prev.includes(chapterKey)) {
        return prev.filter((key) => key !== chapterKey);
      }
      if (prev.length >= maxSelectedChapters) {
        alertInfo(
          "Live Quiz",
          `Choose ${maxSelectedChapters} or fewer chapters for one room.`,
        );
        return prev;
      }
      return [...prev, chapterKey];
    });
  };

  const toggleSubject = (subject: QuizSubject) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  const handleCreate = async () => {
    if (selectedChapterKeys.length === 0) {
      alertInfo("Live Quiz", "Choose at least one chapter.");
      return;
    }

    setCreating(true);
    try {
      const result = await createRoom({
        chapterKeys: selectedChapterKeys,
        questionCount,
        secondsPerQuestion,
      });
      router.replace(`/(tabs)/quiz/live/${result.roomId}`);
    } catch (error) {
      alertInfo(
        "Live Quiz",
        error instanceof Error ? error.message : "Could not create live quiz.",
      );
    } finally {
      setCreating(false);
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
            <TouchableOpacity
              onPress={() => router.back()}
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
                Create Live Quiz
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                Pick chapters and room settings
              </Text>
            </View>
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
        <View style={{ gap: 14 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                style={{ color: "#0F172A", fontWeight: "900", fontSize: 17 }}
              >
                Chapters
              </Text>
              <Text
                style={{ color: "#64748B", fontWeight: "800", fontSize: 12 }}
              >
                {selectedChapterKeys.length} selected
              </Text>
            </View>

            {chaptersQuery === undefined ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            ) : (
              <View style={{ gap: 8, marginTop: 12 }}>
                {subjects.map((item) => {
                  const Icon = item.icon;
                  const expanded = expandedSubjects[item.key];
                  const SelectedChevron = expanded ? ChevronDown : ChevronRight;
                  const subjectChapters =
                    chaptersBySubject?.[item.key] ?? emptyChaptersByClass;
                  const selectedCount = selectedCountsBySubject[item.key];

                  return (
                    <View
                      key={item.key}
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: selectedCount > 0 ? "#C7D2FE" : "#E2E8F0",
                        backgroundColor: "#F8FAFC",
                        overflow: "hidden",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleSubject(item.key)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          padding: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            backgroundColor:
                              selectedCount > 0 ? "#EEF2FF" : "white",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: selectedCount > 0 ? 0 : 1,
                            borderColor: "#E2E8F0",
                          }}
                        >
                          <Icon
                            size={18}
                            color={selectedCount > 0 ? "#4F46E5" : "#64748B"}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#0F172A",
                              fontWeight: "900",
                              fontSize: 15,
                            }}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={{
                              color: "#64748B",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {selectedCount > 0
                              ? `${selectedCount} selected`
                              : "Tap to choose chapters"}
                          </Text>
                        </View>
                        <SelectedChevron size={20} color="#64748B" />
                      </TouchableOpacity>

                      {expanded ? (
                        <View
                          style={{
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingBottom: 12,
                          }}
                        >
                          {(["11", "12"] as const).map((classLevel) => (
                            <View key={classLevel} style={{ gap: 8 }}>
                              <Text
                                style={{
                                  color: "#64748B",
                                  fontSize: 12,
                                  fontWeight: "900",
                                  marginTop: classLevel === "12" ? 6 : 0,
                                }}
                              >
                                CLASS {classLevel}
                              </Text>
                              {subjectChapters[classLevel].map((chapter) => {
                                const active = selectedSet.has(chapter.key);
                                return (
                                  <TouchableOpacity
                                    key={chapter.key}
                                    onPress={() => toggleChapter(chapter.key)}
                                    style={{
                                      borderRadius: 12,
                                      padding: 12,
                                      borderWidth: 1,
                                      borderColor: active
                                        ? "#4F46E5"
                                        : "#E2E8F0",
                                      backgroundColor: active
                                        ? "#EEF2FF"
                                        : "white",
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 10,
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 8,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: active
                                          ? "#4F46E5"
                                          : "white",
                                        borderWidth: active ? 0 : 1,
                                        borderColor: "#CBD5E1",
                                      }}
                                    >
                                      {active ? (
                                        <Check size={15} color="white" />
                                      ) : null}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          color: "#0F172A",
                                          fontWeight: "800",
                                        }}
                                      >
                                        {chapter.title}
                                      </Text>
                                      <Text
                                        style={{
                                          color: "#64748B",
                                          fontSize: 12,
                                          marginTop: 2,
                                        }}
                                      >
                                        NCERT Class {chapter.class}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 17 }}>
              Quiz Setup
            </Text>

            <Text
              style={{
                color: "#64748B",
                fontWeight: "800",
                fontSize: 12,
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              QUESTIONS
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {questionCounts.map((count) => {
                const active = questionCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setQuestionCount(count)}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor: active ? "#EEF2FF" : "#F8FAFC",
                      borderWidth: 1,
                      borderColor: active ? "#4F46E5" : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#4F46E5" : "#64748B",
                        fontWeight: "900",
                      }}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text
              style={{
                color: "#64748B",
                fontWeight: "800",
                fontSize: 12,
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              TIME PER QUESTION
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {timers.map((seconds) => {
                const active = secondsPerQuestion === seconds;
                return (
                  <TouchableOpacity
                    key={seconds}
                    onPress={() => setSecondsPerQuestion(seconds)}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor: active ? "#EEF2FF" : "#F8FAFC",
                      borderWidth: 1,
                      borderColor: active ? "#4F46E5" : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#4F46E5" : "#64748B",
                        fontWeight: "900",
                      }}
                    >
                      {seconds}s
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            disabled={creating || selectedChapterKeys.length === 0}
            onPress={handleCreate}
            style={{
              borderRadius: 16,
              paddingVertical: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                creating || selectedChapterKeys.length === 0
                  ? "#CBD5E1"
                  : "#4F46E5",
              flexDirection: "row",
              gap: 8,
            }}
          >
            {creating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Plus size={19} color="white" />
            )}
            <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
              Create Room
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
