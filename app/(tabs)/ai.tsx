import { Bot, Sparkles, Zap } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AIScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Indigo Background */}
        <View className="bg-indigo-600 px-6 pt-16 pb-8">
          <View className="items-center">
            {/* Icon Container */}
            <View className="bg-white rounded-full p-6 mb-6">
              <Bot size={48} color="#4F46E5" />
            </View>

            {/* Title */}
            <Text className="text-white text-3xl font-bold text-center mb-3">
              AI Support
            </Text>
            
            {/* Subtitle */}
            <Text className="text-indigo-200 text-base text-center mb-6 leading-6">
              Intelligent tutoring and personalized learning assistance
            </Text>

            {/* Coming Soon Badge */}
            <View className="bg-white rounded-full px-6 py-3">
              <View className="flex-row items-center">
                <Sparkles size={18} color="#4F46E5" />
                <Text className="text-indigo-600 text-base font-semibold ml-2">Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section with White Background */}
        <View className="flex-1 bg-white px-6 py-8">
          <Text className="text-slate-900 text-xl font-bold mb-6 text-center">
            What to Expect
          </Text>

          {/* Feature Preview Cards */}
          <View className="space-y-4">
            <View className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 rounded-full p-3 mr-4">
                  <Zap size={20} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 text-base font-semibold mb-1">
                    Instant Doubt Solving
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    Get immediate explanations for any concept or problem
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 rounded-full p-3 mr-4">
                  <Bot size={20} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 text-base font-semibold mb-1">
                    Personalized Learning
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    AI-powered recommendations based on your learning style
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 rounded-full p-3 mr-4">
                  <Sparkles size={20} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 text-base font-semibold mb-1">
                    Smart Practice
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    Adaptive questions and tests tailored to your progress
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Info */}
          <View className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-200">
            <Text className="text-indigo-800 text-base font-semibold mb-2 text-center">
              Stay Tuned!
            </Text>
            <Text className="text-indigo-600 text-sm text-center">
              We're working hard to bring you the most advanced AI learning assistant. 
              This feature will be available soon.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}