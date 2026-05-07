import { useApp } from "@/components/ContextProvider";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

const heroLanding = require('../assets/illustrations/hero-landing.png');

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useApp();
  const { height, width } = useWindowDimensions();
  const compact = height < 760;
  const heroSize = Math.min(width * 0.58, compact ? 210 : 240);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#4F46E5", "#6366F1", "#818CF8"]}
          className="absolute top-0 left-0 right-0 bottom-0"
        />
        <View className="flex-1 justify-center items-center">
          <Image
            source={heroLanding}
            style={{ width: 104, height: 104, marginBottom: 24 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white/80 text-sm mt-4 font-semibold">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={["#4F46E5", "#6366F1", "#818CF8"]}
        className="absolute top-0 left-0 right-0 bottom-0"
      />
      <View
        className="flex-1 items-center px-7"
        style={{
          justifyContent: "center",
          paddingTop: compact ? 18 : 32,
          paddingBottom: compact ? 20 : 36,
        }}
      >
        <View className="w-full items-center" style={{ marginBottom: compact ? 28 : 38 }}>
          <Image
            source={heroLanding}
            style={{ width: heroSize, height: heroSize }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        <View className="w-full items-center">
          <Text className="text-white text-center font-extrabold" style={{ fontSize: compact ? 38 : 44, lineHeight: compact ? 44 : 50 }}>
            MemoHack
          </Text>
          <Text className="text-white/78 text-center mt-3 leading-6" style={{ fontSize: compact ? 16 : 17 }}>
            Your focused JEE & NEET preparation companion.
          </Text>

          <View className="w-full mt-8">
            <Link href="/(auth)/signin" asChild>
              <TouchableOpacity className="w-full rounded-2xl py-3.5 bg-indigo-700">
                <Text className="text-white text-center text-base font-bold">Sign In</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity className="w-full rounded-2xl py-3.5 mt-3 bg-white/20 border border-white/30">
                <Text className="text-white text-center text-base font-bold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity onPress={() => router.push("/(tabs)/home")} className="w-full rounded-2xl py-3.5 mt-3 bg-white/10">
              <Text className="text-white/80 text-center text-sm font-semibold">Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
