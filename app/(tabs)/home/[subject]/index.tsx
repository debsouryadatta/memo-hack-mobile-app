import { cbseSyllabusChapters2025 } from "@/constants/constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ClassKey = "class9" | "class10" | "class11" | "class12";
type SubjectKey = "physics" | "biology";

const classes: ClassKey[] = ["class9", "class10", "class11", "class12"];

export default function SubjectScreen() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const router = useRouter();
  const [openClass, setOpenClass] = React.useState<string | null>(null);

  const subjectName = subject as SubjectKey;

  const toggleClass = (classKey: string) => {
    setOpenClass(openClass === classKey ? null : classKey);
  };

  const getChapters = (classKey: ClassKey, subject: SubjectKey): string[] => {
    try {
      const classData = cbseSyllabusChapters2025[classKey];
      const subjectData = classData?.[subject];
      return subjectData?.chapters || [];
    } catch (error) {
      console.log(`Error getting chapters for ${classKey} ${subject}:`, error);
      return [];
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-12">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white p-3 rounded-full shadow-md"
            >
              <ArrowLeft size={24} />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-slate-900 capitalize">
              {subjectName}
            </Text>
            <View className="w-12 h-12" />
          </View>
        </View>

        <View className="m-6 mt-8 shadow-lg rounded-2xl bg-white">
          <Image
            source={{
              uri: "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750922769/projects/20944341-Photoroom_uv2zlq.png",
            }}
            className="w-full h-64 rounded-2xl"
            resizeMode="contain"
          />
        </View>

        <View className="px-6 mt-2">
          <Text className="text-2xl font-bold text-slate-900">Class</Text>

          <View className="mt-4 space-y-5">
            {classes.map((classKey) => {
              const chapters = getChapters(classKey, subjectName);
              const isOpen = openClass === classKey;

              if (chapters.length === 0) {
                return null;
              }

              return (
                <View
                  key={classKey}
                  className="bg-white rounded-2xl shadow-md my-2"
                >
                  <TouchableOpacity
                    onPress={() => toggleClass(classKey)}
                    className="p-4 flex-row justify-between items-center"
                  >
                    <Text className="text-lg font-bold text-slate-800 capitalize">
                      {classKey.replace("class", "Class ")}
                    </Text>
                    <ChevronDown
                      size={24}
                      color={"#475569"}
                      style={{
                        transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                      }}
                    />
                  </TouchableOpacity>

                  {isOpen && (
                    <View className="px-4 pb-2">
                      <View className="border-t border-slate-200/80" />
                      {chapters.map((chapter: string, index: number) => (
                        <Text
                          key={index}
                          className="text-slate-700 text-base py-3"
                        >
                          {index + 1}. {chapter}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
