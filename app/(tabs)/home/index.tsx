import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const subjects = [
  {
    name: "Physics",
    image:
      "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884469/projects/blue-molecular-sphere-reveals-futuristic-genetic-research-data-generated-by-ai_patqst.jpg",
  },
  {
    name: "Biology",
    image:
      "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884633/projects/14_agexsk.jpg",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-12">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg text-slate-600">Hello Guest</Text>
              <Text className="text-3xl font-bold text-slate-900">
                Find your course
              </Text>
            </View>
            <TouchableOpacity className="bg-white p-3 rounded-full shadow-md">
              <Search size={24} />
            </TouchableOpacity>
          </View>

          {/* Banner */}
          <View className="mt-8 rounded-2xl overflow-hidden shadow-2xl shadow-black">
            <LinearGradient
              colors={["#4F46E5", "#818CF8"]}
              className="py-10 px-6 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <View className="h-1 bg-white rounded-full w-3/4 mb-4"></View>
                <Text className="text-2xl font-bold text-white">
                  Learn Anything,
                </Text>
                <Text className="text-2xl font-bold text-white">
                  Anytime, Anywhere
                </Text>
              </View>
              <Image
                source={{
                  uri: "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750885008/projects/20944363-Photoroom_exvbcp.png",
                }}
                className="w-48 h-48"
                resizeMode="contain"
              />
            </LinearGradient>
          </View>

          {/* Subjects */}
          <View className="mt-8 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-slate-900">Subject</Text>
          </View>

          <View className="mt-4 flex-row flex-wrap justify-between">
            {subjects.map((subject, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white rounded-2xl p-4 w-[48%] mb-4 shadow-xl"
                onPress={() =>
                  router.push(`/(tabs)/home/${subject.name.toLowerCase()}`)
                }
              >
                <Image
                  source={{ uri: subject.image }}
                  className="w-full h-24 rounded-lg"
                  resizeMode="cover"
                />
                <Text className="text-lg font-bold text-slate-900 mt-2 text-center">
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
