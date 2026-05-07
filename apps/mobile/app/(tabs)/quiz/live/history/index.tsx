import { useApp } from "@/components/ContextProvider";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  History,
  Trophy,
  User,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HistoryRow = {
  roomId: Id<"liveQuizRooms">;
  joinCode: string;
  subjectLabel: string;
  questionCount: number;
  participantCount: number;
  myScore: number | null;
  myCorrectCount: number | null;
  participated: boolean;
  endedAt: number | null;
  createdAt: number;
};

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "Finished";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
              Sign in to review previous live quizzes.
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

export default function LiveQuizHistoryScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryArgs = user && !deferAuthRedirect ? {} : "skip";
  const historyQuery = useQuery(api.liveQuiz.listLiveQuizHistory, queryArgs);
  const rows = (historyQuery?.history ?? []) as HistoryRow[];

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
                Previous Quizzes
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                Review finished live rooms
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
        {historyQuery === undefined ? (
          <View style={{ paddingTop: 72, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : rows.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 24,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
            }}
          >
            <History size={42} color="#94A3B8" />
            <Text
              style={{
                color: "#0F172A",
                fontWeight: "900",
                fontSize: 18,
                marginTop: 12,
              }}
            >
              No finished quizzes yet
            </Text>
            <Text
              style={{ color: "#64748B", textAlign: "center", marginTop: 6 }}
            >
              Finished live rooms will appear here for review.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {rows.map((row) => (
              <TouchableOpacity
                key={row.roomId}
                onPress={() =>
                  router.push(`/(tabs)/quiz/live/history/${row.roomId}`)
                }
                style={{
                  backgroundColor: "white",
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: row.participated ? "#C7D2FE" : "#E2E8F0",
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
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: row.participated ? "#EEF2FF" : "#F1F5F9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trophy
                      size={22}
                      color={row.participated ? "#4F46E5" : "#64748B"}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        color: "#0F172A",
                        fontWeight: "900",
                        fontSize: 17,
                      }}
                    >
                      Room {row.joinCode}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: "#64748B", marginTop: 3 }}
                    >
                      {row.subjectLabel} - {row.questionCount} questions -{" "}
                      {row.participantCount} players
                    </Text>
                  </View>
                  <ChevronRight size={22} color="#94A3B8" />
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#F8FAFC",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CalendarDays size={14} color="#64748B" />
                      <Text
                        style={{
                          color: "#64748B",
                          fontWeight: "800",
                          fontSize: 11,
                        }}
                      >
                        ENDED
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#0F172A",
                        fontWeight: "900",
                        marginTop: 4,
                      }}
                    >
                      {formatDate(row.endedAt)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#F8FAFC",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#64748B",
                        fontWeight: "800",
                        fontSize: 11,
                      }}
                    >
                      YOUR SCORE
                    </Text>
                    <Text
                      style={{
                        color: "#0F172A",
                        fontWeight: "900",
                        marginTop: 4,
                      }}
                    >
                      {row.participated
                        ? `${row.myScore ?? 0} pts`
                        : "Not played"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
