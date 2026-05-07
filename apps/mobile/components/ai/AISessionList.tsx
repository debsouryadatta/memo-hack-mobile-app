import { api, type Doc, type Id } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bot,
  MessageSquarePlus,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getUsageLimitMessage,
  isAuthRequiredError,
  MEMO_AI_NAME,
} from "@/lib/aiChatShared";
import { alertInfo } from "@/lib/confirm";

export function AISessionList({
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
  }, [fadeAnim, slideAnim]);

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
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#c7d2fe", fontSize: 15, fontWeight: "500" }}>
              Your study partner
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 28,
                lineHeight: 34,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              {MEMO_AI_NAME}
            </Text>
          </View>
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
          <MessageSquarePlus size={18} color="#4F46E5" />
          <Text
            style={{
              color: "#4F46E5",
              fontWeight: "700",
              fontSize: 14,
              marginLeft: 10,
            }}
          >
            Start Memo AI Chat
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
                  fontSize: 22,
                  lineHeight: 26,
                  fontWeight: "800",
                  color: "#0F172A",
                }}
              >
                Memo AI Chats
              </Text>
              <Text
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  fontWeight: "500",
                  marginTop: 2,
                }}
              >
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
                <Bot size={36} color="#4F46E5" />
              </View>
              <Text
                style={{
                  color: "#0F172A",
                  fontSize: 22,
                  lineHeight: 28,
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                No Memo AI chats yet
              </Text>
              <Text
                style={{
                  color: "#64748B",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 21,
                }}
              >
                Tap Start Memo AI Chat to ask your first JEE / NEET question.
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
                      fontSize: 16,
                      lineHeight: 22,
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
                            alertInfo("Limit reached", usageMessage);
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
