import { useApp } from "@/components/ContextProvider";
import { api, type Id } from "@memo-hack/convex";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AISessionList } from "@/components/ai/AISessionList";
import { getUsageLimitMessage, isAuthRequiredError } from "@/lib/aiChatShared";

export default function AIScreen() {
  const { isAuthenticated, deferAuthRedirect } = useApp();
  const createSession = useMutation(api.aiChat.createSession);
  const currentUser = useQuery(api.user.getCurrentUser, {});
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const canCreateChat =
    isAuthenticated && currentUser !== undefined && currentUser !== null;

  const openChat = (id: Id<"aiChatSessions">, title: string) => {
    router.push({
      pathname: "/(tabs)/ai/[sessionId]",
      params: { sessionId: id, title },
    });
  };

  const handleNewChat = async () => {
    if (!canCreateChat || creating) return;
    setCreating(true);
    try {
      const session = await createSession({ title: "New Chat" });
      if (session) {
        openChat(session._id, session.title);
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
    } finally {
      setCreating(false);
    }
  };

  if (
    isAuthenticated &&
    (currentUser === undefined || deferAuthRedirect)
  ) {
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
                    {"Don't have an account? "}
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

  return (
    <AISessionList
      onSelect={openChat}
      onNew={handleNewChat}
    />
  );
}
