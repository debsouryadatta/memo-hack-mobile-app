import { useApp } from "@/components/ContextProvider";
import { alertInfo } from "@/lib/confirm";
import { api } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  History,
  LogIn,
  Plus,
  Radio,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
              Sign in to create or join live quiz rooms.
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

export default function LiveQuizHomeScreen() {
  const { user, token, deferAuthRedirect } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const joinLiveQuizRoom = useMutation(api.liveQuiz.joinLiveQuizRoom);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      alertInfo("Live Quiz", "Enter a room code.");
      return;
    }

    setJoining(true);
    try {
      const result = await joinLiveQuizRoom({ joinCode: code });
      router.push(`/(tabs)/quiz/live/${result.roomId}`);
    } catch (error) {
      alertInfo(
        "Live Quiz",
        error instanceof Error ? error.message : "Could not join this room.",
      );
    } finally {
      setJoining(false);
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
                Live Quiz
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                Create a room or join with a code
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
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/quiz/live/create")}
            style={{
              backgroundColor: "#111827",
              borderRadius: 18,
              padding: 18,
              shadowColor: "#111827",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 18 }}
                >
                  Create Live Quiz
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.68)", marginTop: 4 }}>
                  Pick chapters, start a lobby, and play as host.
                </Text>
              </View>
              <ChevronRight size={22} color="rgba(255,255,255,0.62)" />
            </View>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 18,
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
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Radio size={22} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}
                >
                  Join Live Quiz
                </Text>
                <Text style={{ color: "#64748B", marginTop: 4 }}>
                  Enter the code shared by the host.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TextInput
                value={joinCode}
                onChangeText={(value) => setJoinCode(value.toUpperCase())}
                placeholder="ROOM CODE"
                autoCapitalize="characters"
                maxLength={8}
                style={{
                  flex: 1,
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  color: "#0F172A",
                  fontWeight: "900",
                  letterSpacing: 1,
                }}
              />
              <TouchableOpacity
                disabled={joining}
                onPress={handleJoin}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: joining ? "#A5B4FC" : "#4F46E5",
                }}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <LogIn size={21} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/quiz/live/history")}
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 18,
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
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History size={22} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#0F172A", fontWeight: "900", fontSize: 18 }}
                >
                  Previous Live Quizzes
                </Text>
                <Text style={{ color: "#64748B", marginTop: 4 }}>
                  Review answers, explanations, and final rankings.
                </Text>
              </View>
              <ChevronRight size={22} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
