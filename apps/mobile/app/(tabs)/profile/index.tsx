import { useApp } from "@/components/ContextProvider";
import { alertInfo, confirmAsync } from "@/lib/confirm";
import { api } from "@memo-hack/convex";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Edit2,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  Phone,
  Settings,
  Trophy,
  User as UserIcon,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function quizActivityColor(attemptedCount: number, score: number): string {
  if (attemptedCount === 0) return "#E2E8F0";
  if (score === 0) return "#FCA5A5";
  if (score === 1) return "#BFDBFE";
  if (score === 2) return "#86EFAC";
  return "#22C55E";
}

export default function ProfileScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, signout, isLoading, deferAuthRedirect, token } = useApp();
  const quizStats = useQuery(
    api.dailyQuiz.getMyDailyQuizStats,
    user && !deferAuthRedirect ? { days: 35 } : "skip",
  );

  /** Explicit sizes: RN ignores %/className sizing on remote expo-image in many layouts (works on Web). */
  const avatarOuter = Math.min(screenWidth * 0.28, 112);
  const ringPadding = 4;
  const avatarInner = Math.max(0, avatarOuter - ringPadding * 2);

  const handleSignOut = async () => {
    const ok = await confirmAsync({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign Out",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    try {
      await signout();
      router.replace("/");
    } catch {
      alertInfo("Error", "Failed to sign out. Please try again.");
    }
  };

  if (token && deferAuthRedirect) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          className="absolute top-0 left-0 right-0 bottom-0"
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          className="absolute top-0 left-0 right-0 bottom-0"
        />

        <View className="flex-1 justify-center items-center px-8">
          {/* Illustration Image */}
          <View className="items-center mb-5">
            <Image
              source={require('../../../assets/illustrations/hero-auth.png')}
              style={{ width: 136, height: 136 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Content Card */}
          <View className="w-full max-w-sm">
            <View className="bg-white/15 rounded-2xl p-6 backdrop-blur-md border border-white/20">
              <View className="items-center">
                <View className="bg-white/20 rounded-full p-3 mb-4">
                  <UserIcon size={28} color="rgba(255,255,255,0.8)" />
                </View>

                <Text className="text-2xl font-bold text-white text-center mb-3">
                  Sign In Required
                </Text>

                <Text className="text-white/70 text-center text-sm mb-6 leading-5">
                  Please sign in to your account to view and manage your profile
                  information
                </Text>

                {/* Sign In Button */}
                <TouchableOpacity
                  className="w-full bg-white rounded-xl py-3.5 px-6 mb-4"
                  onPress={() => router.push("/(auth)/signin")}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-indigo-600 text-center text-base font-bold">
                    Sign In
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/70 text-sm">
                    {"Don't have an account? "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/signup")}
                    className="px-2 py-1"
                  >
                    <Text className="text-white font-bold text-sm">
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Guest Option */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            className="mt-6 px-6 py-3 bg-white/10 rounded-full border border-white/20"
          >
            <Text className="text-white/80 text-center text-base font-medium">
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={["#6366F1", "#4F46E5", "#4338CA"]}
        className="absolute top-0 left-0 right-0 bottom-0"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
      >
        {/* Enhanced Header with floating effect */}
        <View
          className="pt-8 pb-5 px-5"
          style={{ minHeight: Math.min(screenWidth * 0.52, 220) }}
        >
          <View className="items-center">
            {/* Profile Image with enhanced shadow and border */}
            <View className="relative mb-3">
              {/* Outer: same circular bounds as inner so Android elevation is not a square plate */}
              <View
                style={{
                  width: avatarOuter,
                  height: avatarOuter,
                  borderRadius: avatarOuter / 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <View
                  style={{
                    width: avatarOuter,
                    height: avatarOuter,
                    borderRadius: avatarOuter / 2,
                    overflow: "hidden",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    padding: ringPadding,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {user.image ? (
                    <Image
                      source={{ uri: user.image }}
                      style={{
                        width: avatarInner,
                        height: avatarInner,
                        borderRadius: avatarInner / 2,
                      }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={user.image}
                      transition={200}
                    />
                  ) : (
                    <View
                      className="items-center justify-center bg-white/50"
                      style={{
                        width: avatarInner,
                        height: avatarInner,
                        borderRadius: avatarInner / 2,
                      }}
                    >
                      <Text
                        className="font-bold text-slate-600"
                        style={{
                          fontSize: Math.min(screenWidth * 0.09, 36),
                        }}
                      >
                        {avatarInitials(user.name)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-2.5"
                onPress={() => router.push("/(tabs)/profile/edit")}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.16,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Edit2 size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Enhanced User Info */}
            <View className="items-center">
              <Text
                className="text-white font-bold text-center mb-1"
                style={{ fontSize: Math.min(screenWidth * 0.062, 24) }}
              >
                {user.name}
              </Text>
              <View className="flex-row items-center mb-2">
                <View className="bg-white/20 rounded-full px-3 py-1">
                  <Text className="text-white/90 text-xs font-semibold">
                    Class {user.class}
                  </Text>
                </View>
              </View>
              <Text className="text-white/70 text-sm">{user.email}</Text>
              <Text className="text-white/50 text-xs mt-1">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* White Background Content Section */}
        <View
          className="bg-slate-50 rounded-t-[28px] px-5 pt-6 mt-2"
          style={{ paddingBottom: tabBarHeight + 20 }}
        >
          <View>
            {/* Enhanced Profile Details */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-200">
              <Text className="text-slate-900 text-lg font-bold mb-4">
                Personal Information
              </Text>

              <View className="space-y-5">
                <View className="flex-row items-center">
                  <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                    <Mail size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs font-semibold">
                      Email Address
                    </Text>
                    <Text className="text-slate-900 text-sm font-semibold mt-1">
                      {user.email}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-slate-200" />

                <View className="flex-row items-center">
                  <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                    <Phone size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs font-semibold">
                      Phone Number
                    </Text>
                    <Text className="text-slate-900 text-sm font-semibold mt-1">
                      {user.phone}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-slate-200" />

                <View className="flex-row items-center">
                  <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                    <GraduationCap size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs font-semibold">
                      Academic Level
                    </Text>
                    <Text className="text-slate-900 text-sm font-semibold mt-1">
                      Class {user.class}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-slate-200" />

                <View className="flex-row items-center">
                  <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                    <Calendar size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs font-semibold">
                      Joined
                    </Text>
                    <Text className="text-slate-900 text-sm font-semibold mt-1">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {user.memohackStudent !== null &&
                  user.memohackStudent !== undefined && (
                    <>
                      <View className="h-px bg-slate-200" />

                      <View className="flex-row items-center">
                        <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                          <GraduationCap size={18} color="#4F46E5" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-500 text-xs font-semibold">
                            MemoHack Student
                          </Text>
                          <Text className="text-slate-900 text-sm font-semibold mt-1">
                            {user.memohackStudent ? "Yes" : "No"}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
              </View>
            </View>

            {/* Daily Quiz Consistency */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-200">
              <View className="flex-row items-center mb-4">
                <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                  <Trophy size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 text-lg font-bold">
                    Daily Quiz Consistency
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    Last 35 days of quiz activity
                  </Text>
                </View>
              </View>

              {quizStats === undefined ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              ) : (
                <>
                  <View className="flex-row mb-4">
                    <View className="flex-1 bg-slate-50 rounded-xl p-3 mr-2">
                      <Text className="text-slate-500 text-xs font-semibold">
                        Active days
                      </Text>
                      <Text className="text-slate-900 text-lg font-bold mt-1">
                        {quizStats.activeDays}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-xl p-3 mx-1">
                      <Text className="text-slate-500 text-xs font-semibold">
                        Streak
                      </Text>
                      <Text className="text-slate-900 text-lg font-bold mt-1">
                        {quizStats.currentStreak}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-50 rounded-xl p-3 ml-2">
                      <Text className="text-slate-500 text-xs font-semibold">
                        Points
                      </Text>
                      <Text className="text-slate-900 text-lg font-bold mt-1">
                        {quizStats.totalScore}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 5,
                    }}
                  >
                    {quizStats.days.map((day) => (
                      <View
                        key={day.dayKey}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 5,
                          backgroundColor: quizActivityColor(
                            day.attemptedCount,
                            day.score,
                          ),
                        }}
                      />
                    ))}
                  </View>

                  <View className="flex-row items-center justify-between mt-4">
                    <Text className="text-slate-500 text-xs">Less</Text>
                    <View className="flex-row items-center gap-1">
                      {[0, 1, 2, 3].map((score) => (
                        <View
                          key={score}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            backgroundColor: quizActivityColor(
                              score === 0 ? 0 : 1,
                              score,
                            ),
                          }}
                        />
                      ))}
                    </View>
                    <Text className="text-slate-500 text-xs">More</Text>
                  </View>
                </>
              )}
            </View>

            {/* Action Menu */}
            <View className="mb-5">
              <Text className="text-slate-900 text-lg font-bold mb-3">
                Account
              </Text>

              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-white rounded-2xl p-3.5 border border-slate-200"
                  onPress={() => router.push("/(tabs)/profile/edit")}
                >
                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                      <Settings size={18} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 text-sm font-semibold">
                        Edit profile settings
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Photo, name, phone, class, MemoHack student
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white rounded-2xl p-3.5 border border-slate-200"
                  onPress={() => router.push("/(tabs)/profile/change-password")}
                >
                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-xl p-2.5 mr-3">
                      <Lock size={18} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 text-sm font-semibold">
                        Change password
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Verify by email OTP before updating
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white rounded-2xl p-3.5 border border-red-200"
                  onPress={handleSignOut}
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-red-100 rounded-xl p-2.5 mr-3">
                      <LogOut size={18} color="#DC2626" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-red-600 text-sm font-semibold">
                        Sign Out
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        Sign out of your account
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Enhanced Footer */}
          <View className="mt-3">
            <View className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
              <View className="items-center">
                <Text className="text-slate-900 font-bold text-base mb-1.5">
                  MemoHack
                </Text>
                <Text className="text-slate-600 text-center text-xs leading-5">
                  Version 1.0.0{"\n"}
                  Your complete JEE & NEET preparation companion
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
