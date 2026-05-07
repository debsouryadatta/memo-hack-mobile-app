import { api, type Doc } from "@memo-hack/convex";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, GraduationCap } from "lucide-react-native";
import React from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ClassKey = "9" | "10" | "11" | "12";
type SubjectKey = "physics" | "biology";
type Chapter = Doc<"chapters">;
type ChaptersByClass = Partial<Record<ClassKey, Chapter[]>>;

const classes: ClassKey[] = ["9", "10", "11", "12"];

const getSubjectGradient = (subject: string): [string, string, string] => {
  switch (subject?.toLowerCase()) {
    case 'physics':
      return ['#6366F1', '#4F46E5', '#4338CA'];
    case 'biology':
      return ['#6366F1', '#4F46E5', '#4338CA'];
    default:
      return ['#6366F1', '#4F46E5', '#4338CA'];
  }
};

const getSubjectIcon = (subject: string) => {
  switch (subject?.toLowerCase()) {
    case 'physics':
      return '⚡';
    case 'biology':
      return '🧬';
    default:
      return '📚';
  }
};

export default function SubjectScreen() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [openClass, setOpenClass] = React.useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const subjectName = subject as SubjectKey;

  // Fetch all chapters for this subject from Convex
  const chaptersByClassQuery = useQuery(api.chapter.getAllChaptersBySubject, { 
    subject: subjectName 
  });
  const chaptersByClass = chaptersByClassQuery as ChaptersByClass | undefined;

  // Calculate stats on client side
  const stats = React.useMemo(() => {
    if (!chaptersByClass) return { totalChapters: 0, classesWithChapters: 0 };
    
    const totalChapters = Object.values(chaptersByClass).reduce(
      (sum, chapters) => sum + chapters.length,
      0,
    );
    const classesWithChapters = Object.keys(chaptersByClass).length;
    
    return { totalChapters, classesWithChapters };
  }, [chaptersByClass]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const toggleClass = (classKey: string) => {
    const newOpenClass = openClass === classKey ? null : classKey;
    setOpenClass(newOpenClass);
    
    // Scroll to the opened accordion after a short delay to allow for animation
    if (newOpenClass) {
      setTimeout(() => {
        // Calculate approximate position based on class index
        const classIndex = classes.findIndex(cls => cls === classKey);
        const estimatedPosition = 150 + classIndex * 78 + (classIndex > 0 ? 120 : 0);
        
        scrollViewRef.current?.scrollTo({ 
          y: estimatedPosition, 
          animated: true 
        });
      }, 400);
    }
  };

  const getChapters = (classKey: ClassKey): Chapter[] => {
    return chaptersByClass?.[classKey] || [];
  };

  // Loading state
  if (chaptersByClass === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <LinearGradient
          colors={getSubjectGradient(subjectName)}
          style={{ paddingTop: insets.top + 10, paddingBottom: 14 }}
        >
          <View className="px-5">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="items-center justify-center bg-white/20"
                style={{ width: 42, height: 42, borderRadius: 14 }}
              >
                <ArrowLeft size={21} color="white" />
              </TouchableOpacity>
              <Text className="flex-1 text-white text-xl font-bold capitalize" numberOfLines={1}>
                {subjectName}
              </Text>
              <View style={{ width: 42, height: 42 }} />
            </View>
          </View>
        </LinearGradient>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-slate-600 text-base mt-4">Loading chapters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={getSubjectGradient(subjectName)}
          style={{ paddingTop: insets.top + 10, paddingBottom: 18 }}
        >
          <View className="px-5">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="items-center justify-center bg-white/20"
                style={{ width: 42, height: 42, borderRadius: 14 }}
              >
                <ArrowLeft size={21} color="white" />
              </TouchableOpacity>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-2xl font-extrabold capitalize" numberOfLines={1}>
                  {subjectName}
                </Text>
                <Text className="text-white/70 text-sm mt-0.5">
                  Classes 9-12 • {stats.totalChapters} chapters
                </Text>
              </View>
              <View
                className="items-center justify-center bg-white/20"
                style={{ width: 42, height: 42, borderRadius: 16 }}
              >
                <Text className="text-2xl">{getSubjectIcon(subjectName)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexGrow: 1 }}>
          <View
            className="px-5 pt-5"
            style={{ flexGrow: 1, paddingBottom: tabBarHeight + 24 }}
          >
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Text className="text-slate-500 text-xs font-semibold">CLASSES</Text>
                <Text className="text-slate-900 text-xl font-bold mt-1">
                  {stats.classesWithChapters}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Text className="text-slate-500 text-xs font-semibold">CHAPTERS</Text>
                <Text className="text-slate-900 text-xl font-bold mt-1">
                  {stats.totalChapters}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 rounded-xl p-2 mr-3">
                  <GraduationCap size={20} color="#4F46E5" />
                </View>
                <View>
                  <Text className="text-slate-900 text-xl font-bold">Classes</Text>
                  <Text className="text-slate-500 text-sm mt-0.5">Select a class to view chapters</Text>
                </View>
              </View>
            </View>

            <View className="gap-3">
              {classes.map((classKey, index) => {
                const chapters = getChapters(classKey);
                const isOpen = openClass === classKey;

                if (chapters.length === 0) {
                  return null;
                }

                return (
                  <Animated.View
                    key={classKey}
                    style={{
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: Animated.add(slideAnim, new Animated.Value(index * 8)) 
                      }],
                    }}
                  >
                    <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <TouchableOpacity
                        onPress={() => toggleClass(classKey)}
                        className="p-4 flex-row justify-between items-center"
                        activeOpacity={0.8}
                        style={{ backgroundColor: isOpen ? "#F8FAFF" : "white" }}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className="bg-indigo-600 rounded-xl items-center justify-center mr-4"
                            style={{ width: 44, height: 44 }}
                          >
                            <Text className="text-white font-bold text-base text-center">
                              {classKey}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-900">
                              Class {classKey}
                            </Text>
                            <Text className="text-slate-500 text-sm font-medium">
                              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} available
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View className="bg-indigo-50 rounded-full px-3 py-1.5">
                            <Text className="text-indigo-600 text-xs font-bold">
                              {chapters.length}
                            </Text>
                          </View>
                          <Animated.View
                            style={{
                              transform: [{ 
                                rotate: isOpen ? '180deg' : '0deg' 
                              }],
                            }}
                            className="bg-slate-100 rounded-full p-1.5"
                          >
                            <ChevronDown size={18} color="#475569" />
                          </Animated.View>
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <Animated.View 
                          key={`${classKey}-expanded`}
                          className="bg-slate-50 mx-3 mb-3 rounded-2xl border border-slate-200"
                          style={{ opacity: fadeAnim }}
                        >
                          <View className="p-3">
                            <View className="flex-row items-center mb-3 pb-3 border-b border-slate-200">
                              <View className="bg-indigo-100 p-1.5 rounded-lg mr-2.5">
                                <BookOpen size={16} color="#4F46E5" />
                              </View>
                              <Text className="text-slate-700 text-sm font-semibold">
                                Available Chapters
                              </Text>
                            </View>
                            <View className="gap-2">
                              {chapters.map((chapter, chapterIndex: number) => (
                                <TouchableOpacity
                                  key={chapter._id}
                                  className="flex-row items-center p-3 bg-white rounded-xl border border-slate-100 active:bg-slate-50"
                                  activeOpacity={0.9}
                                  onPress={() => {
                                    router.push(`/(tabs)/home/${subjectName}/${chapter._id}`);
                                  }}
                                >
                                  <View
                                    className="bg-indigo-500 rounded-lg items-center justify-center mr-3"
                                    style={{ width: 32, height: 32 }}
                                  >
                                    <Text className="text-white font-bold text-xs text-center">
                                      {chapterIndex + 1}
                                    </Text>
                                  </View>
                                  <Text className="text-slate-800 text-sm flex-1 font-semibold leading-5" numberOfLines={2}>
                                    {chapter.title}
                                  </Text>
                                  <View className="bg-slate-100 rounded-full p-1.5 ml-2">
                                    <ChevronRight size={15} color="#64748B" />
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
