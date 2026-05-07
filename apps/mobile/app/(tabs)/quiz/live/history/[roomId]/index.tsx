import { useApp } from "@/components/ContextProvider";
import { ReadableMarkdown } from "@/components/ai/ReadableMarkdown";
import { aiMarkdownStyles } from "@/lib/aiChatShared";
import { api, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Medal,
  Trophy,
  User,
  XCircle,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReviewAnswer = {
  userId: Id<"users">;
  name: string;
  image: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  responseMs: number | null;
  scoreDelta: number;
  isMe: boolean;
};

type ReviewQuestion = {
  questionIndex: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  myAnswer: {
    selectedOptionIndex: number;
    isCorrect: boolean;
    responseMs: number;
    scoreDelta: number;
  } | null;
  optionStats: { optionIndex: number; count: number }[];
  answers: ReviewAnswer[];
};

type LeaderboardRow = {
  rank: number;
  userId: Id<"users">;
  name: string;
  image: string;
  class: string;
  score: number;
  correctCount: number;
  isMe: boolean;
};

type ReviewData = {
  room: {
    joinCode: string;
    subjectLabel: string;
    questionCount: number;
    participantCount: number;
    endedAt: number | null;
  };
  participated: boolean;
  myScore: number | null;
  myCorrectCount: number | null;
  leaderboard: LeaderboardRow[];
  questions: ReviewQuestion[];
};

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function optionLabel(index: number | null): string {
  return index === null ? "No answer" : String.fromCharCode(65 + index);
}

function formatMs(ms: number | null): string {
  if (ms === null) return "";
  return `${(ms / 1000).toFixed(1)}s`;
}

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
              Sign in to view live quiz reviews.
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

export default function LiveQuizReviewScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId: string }>();
  const rawRoomId = Array.isArray(params.roomId)
    ? params.roomId[0]
    : params.roomId;
  const roomId = rawRoomId as Id<"liveQuizRooms">;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryArgs =
    user && !deferAuthRedirect && rawRoomId ? { roomId } : "skip";
  const review = useQuery(api.liveQuiz.getLiveQuizReview, queryArgs) as
    | ReviewData
    | undefined;

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
              onPress={() => router.replace("/(tabs)/quiz/live/history")}
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
                Quiz Review
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                {review ? `Room ${review.room.joinCode}` : "Room"}
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
        {review === undefined ? (
          <View style={{ paddingTop: 72, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <SummaryCard review={review} />
            <LeaderboardCard leaderboard={review.leaderboard} />
            {review.questions.map((question) => (
              <QuestionReviewCard
                key={question.questionIndex}
                question={question}
                participantCount={review.room.participantCount}
                participated={review.participated}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ review }: { review: ReviewData }) {
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: "#EEF2FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy size={21} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}>
            Room {review.room.joinCode}
          </Text>
          <Text style={{ color: "#64748B", marginTop: 3 }}>
            {review.room.subjectLabel} - {formatDate(review.room.endedAt)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <SummaryTile label="Questions" value={`${review.room.questionCount}`} />
        <SummaryTile
          label="Players"
          value={`${review.room.participantCount}`}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <SummaryTile
          label="Your Score"
          value={review.participated ? `${review.myScore ?? 0}` : "Not played"}
        />
        <SummaryTile
          label="Correct"
          value={
            review.participated
              ? `${review.myCorrectCount ?? 0}/${review.room.questionCount}`
              : "-"
          }
        />
      </View>
    </View>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "900" }}>
        {label.toUpperCase()}
      </Text>
      <Text
        numberOfLines={1}
        style={{ color: "#0F172A", fontWeight: "900", marginTop: 4 }}
      >
        {value}
      </Text>
    </View>
  );
}

function LeaderboardCard({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
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
        <Medal size={20} color="#4F46E5" />
        <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}>
          Final Leaderboard
        </Text>
      </View>

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
            <Text
              style={{
                width: 34,
                color: row.rank <= 3 ? "#4F46E5" : "#64748B",
                fontWeight: "900",
              }}
            >
              #{row.rank}
            </Text>
            <Avatar name={row.name} image={row.image} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{ color: "#0F172A", fontWeight: "900" }}
              >
                {row.name}
              </Text>
              <Text style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                {row.correctCount} correct
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#0F172A", fontWeight: "900" }}>
                {row.score}
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 11 }}>pts</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function QuestionReviewCard({
  question,
  participantCount,
  participated,
}: {
  question: ReviewQuestion;
  participantCount: number;
  participated: boolean;
}) {
  const mySelected = question.myAnswer?.selectedOptionIndex ?? null;

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
      <Text style={{ color: "#64748B", fontWeight: "900", marginBottom: 10 }}>
        Question {question.questionIndex + 1}
      </Text>
      <ReadableMarkdown style={aiMarkdownStyles}>
        {question.question}
      </ReadableMarkdown>

      <View style={{ gap: 9, marginTop: 12 }}>
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctOptionIndex;
          const isMyWrong = participated && mySelected === index && !isCorrect;
          const stat =
            question.optionStats.find((row) => row.optionIndex === index)
              ?.count ?? 0;

          return (
            <View
              key={`${question.questionIndex}-${option}`}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isCorrect
                  ? "#16A34A"
                  : isMyWrong
                    ? "#DC2626"
                    : "#E2E8F0",
                backgroundColor: isCorrect
                  ? "#DCFCE7"
                  : isMyWrong
                    ? "#FEE2E2"
                    : "#F8FAFC",
                padding: 12,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{
                    color: "#0F172A",
                    fontWeight: isCorrect || isMyWrong ? "900" : "700",
                    flex: 1,
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
                {isCorrect ? <CheckCircle2 size={18} color="#16A34A" /> : null}
                {isMyWrong ? <XCircle size={18} color="#DC2626" /> : null}
              </View>
              <Text style={{ color: "#64748B", fontSize: 12, marginTop: 6 }}>
                {stat}/{participantCount} selected
                {participated && mySelected === index ? " - Your answer" : ""}
              </Text>
            </View>
          );
        })}
      </View>

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
        <Text style={{ color: "#0F172A", fontWeight: "900", marginBottom: 6 }}>
          Explanation
        </Text>
        <ReadableMarkdown style={aiMarkdownStyles}>
          {question.explanation}
        </ReadableMarkdown>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ color: "#0F172A", fontWeight: "900", marginBottom: 10 }}>
          Player Answers
        </Text>
        <View style={{ gap: 8 }}>
          {question.answers.map((answer) => (
            <View
              key={answer.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: answer.isMe ? "#EEF2FF" : "#F8FAFC",
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: answer.isMe ? "#C7D2FE" : "#E2E8F0",
              }}
            >
              <Avatar name={answer.name} image={answer.image} size={34} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: "#0F172A", fontWeight: "900" }}
                >
                  {answer.name}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                  {optionLabel(answer.selectedOptionIndex)}
                  {answer.responseMs !== null
                    ? ` - ${formatMs(answer.responseMs)}`
                    : ""}
                </Text>
              </View>
              <Text
                style={{
                  color:
                    answer.selectedOptionIndex === null
                      ? "#64748B"
                      : answer.isCorrect
                        ? "#16A34A"
                        : "#DC2626",
                  fontWeight: "900",
                }}
              >
                {answer.selectedOptionIndex === null
                  ? "Missed"
                  : answer.isCorrect
                    ? `+${answer.scoreDelta}`
                    : "0"}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Avatar({
  name,
  image,
  size = 38,
}: {
  name: string;
  image: string;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E0E7FF",
      }}
    >
      <Text style={{ color: "#4F46E5", fontWeight: "900", fontSize: 12 }}>
        {avatarInitials(name)}
      </Text>
    </View>
  );
}
