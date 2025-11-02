import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, ChevronDown, GraduationCap } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ClassKey = "9" | "10" | "11" | "12";
type SubjectKey = "physics" | "biology";

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
  const [openClass, setOpenClass] = React.useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const subjectName = subject as SubjectKey;

  // Fetch all chapters for this subject from Convex
  const chaptersByClass = useQuery(api.chapter.getAllChaptersBySubject, { 
    subject: subjectName 
  });

  // Calculate stats on client side
  const stats = React.useMemo(() => {
    if (!chaptersByClass) return { totalChapters: 0, classesWithChapters: 0 };
    
    const totalChapters = Object.values(chaptersByClass).reduce((sum, chapters) => sum + chapters.length, 0);
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
        const estimatedPosition = 200 + (classIndex * 100) + (classIndex > 0 ? 200 : 0);
        
        scrollViewRef.current?.scrollTo({ 
          y: estimatedPosition, 
          animated: true 
        });
      }, 400);
    }
  };

  const getChapters = (classKey: ClassKey) => {
    return chaptersByClass?.[classKey] || [];
  };

  // Loading state
  if (chaptersByClass === undefined) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={getSubjectGradient(subjectName)}
          className='absolute top-0 left-0 right-0 bottom-0'
        />
        
        {/* Header */}
        <View className="pt-12 pb-6 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold capitalize">
              {subjectName}
            </Text>
            <View className="w-12" />
          </View>
        </View>

        <View className="bg-slate-50 rounded-t-[32px] flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-slate-600 text-base mt-4">Loading chapters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-indigo-50">
      {/* Animated Header with Gradient */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={getSubjectGradient(subjectName)}
          className="pt-12 pb-8"
        >
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
              >
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-white capitalize flex-1 text-center">
                {subjectName}
              </Text>
              <View className="w-12 h-12" />
            </View>
            
            {/* Subject Icon and Stats */}
            <View className="items-center mb-4">
              <View className="bg-white/20 rounded-full p-6 mb-4">
                <Text className="text-4xl">{getSubjectIcon(subjectName)}</Text>
              </View>
              <View className="flex-row space-x-6">
                <View className="items-center">
                  <Text className="text-white/80 text-sm">Classes</Text>
                  <Text className="text-white font-bold text-lg">
                    {stats?.classesWithChapters || 0}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white/80 text-sm">Total Chapters</Text>
                  <Text className="text-white font-bold text-lg">
                    {stats?.totalChapters || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="-mt-8" style={{ minHeight: '100%' }}>
          {/* Classes Section */}
          <View className="bg-white rounded-t-[32px] px-6 pt-10 pb-8 shadow-2xl shadow-indigo-500/10 flex-1">
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 p-3 rounded-2xl mr-4">
                  <GraduationCap size={28} color="#4F46E5" />
                </View>
                <View>
                  <Text className="text-2xl font-bold text-slate-900">Classes</Text>
                  <Text className="text-slate-500 text-sm">Select your class to explore chapters</Text>
                </View>
              </View>
            </View>

            <View className="space-y-3">
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
                    <View className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                      <TouchableOpacity
                        onPress={() => toggleClass(classKey)}
                        className="p-6 flex-row justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50"
                        activeOpacity={0.8}
                        style={{ elevation: 0 }}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="bg-indigo-600 rounded-2xl p-4 mr-5 shadow-lg shadow-indigo-600/25">
                            <Text className="text-white font-bold text-lg min-w-[24px] text-center">
                              {classKey}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-800 mb-1">
                              {classKey} Class
                            </Text>
                            <Text className="text-slate-500 text-sm font-medium">
                              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} available
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center space-x-3">
                          <View className="bg-indigo-500 rounded-xl px-4 py-2 shadow-sm">
                            <Text className="text-white text-sm font-bold">
                              {chapters.length}
                            </Text>
                          </View>
                          <Animated.View
                            style={{
                              transform: [{ 
                                rotate: isOpen ? '180deg' : '0deg' 
                              }],
                            }}
                            className="bg-slate-100 rounded-full p-2"
                          >
                            <ChevronDown size={20} color="#475569" />
                          </Animated.View>
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <Animated.View 
                          key={`${classKey}-expanded`}
                          className="bg-slate-50/80 mx-4 mb-4 rounded-2xl border border-slate-200/50"
                          style={{ opacity: fadeAnim }}
                        >
                          <View className="p-5">
                            <View className="flex-row items-center mb-4 pb-3 border-b border-slate-200">
                              <View className="bg-indigo-100 p-2 rounded-xl mr-3">
                                <BookOpen size={18} color="#4F46E5" />
                              </View>
                              <Text className="text-slate-700 text-base font-semibold">
                                Available Chapters
                              </Text>
                            </View>
                            <View className="space-y-2">
                              {chapters.map((chapter, chapterIndex: number) => (
                                <TouchableOpacity
                                  key={chapter._id}
                                  className="flex-row items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm active:bg-slate-50"
                                  activeOpacity={0.9}
                                  onPress={() => {
                                    router.push(`/(tabs)/home/${subjectName}/${chapter._id}`);
                                  }}
                                >
                                  <View className="bg-indigo-500 rounded-xl p-3 mr-4 shadow-sm">
                                    <Text className="text-white font-bold text-sm min-w-[16px] text-center">
                                      {chapterIndex + 1}
                                    </Text>
                                  </View>
                                  <Text className="text-slate-800 text-base flex-1 font-medium leading-5">
                                    {chapter.title}
                                  </Text>
                                  <View className="bg-slate-100 rounded-full p-2 ml-2">
                                    <ChevronDown 
                                      size={16} 
                                      color="#64748B" 
                                      style={{ transform: [{ rotate: '-90deg' }] }}
                                    />
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
