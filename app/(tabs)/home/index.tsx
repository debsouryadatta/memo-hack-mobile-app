import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BookOpen, Search, TrendingUp, Users } from "lucide-react-native";
import React from "react";
import { Animated, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get('window');

const subjectConfig = [
  {
    name: "Physics",
    image:
      "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884469/projects/blue-molecular-sphere-reveals-futuristic-genetic-research-data-generated-by-ai_patqst.jpg",
    icon: "⚡",
    description: "Mechanics, Waves & Energy",
    gradient: ['#6366F1', '#4F46E5']
  },
  {
    name: "Biology",
    image:
      "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884633/projects/14_agexsk.jpg",
    icon: "🧬",
    description: "Life Sciences & Genetics",
    gradient: ['#6366F1', '#4F46E5']
  },
];

const stats = [
  { label: "Total Chapters", value: "64+", icon: BookOpen },
  { label: "Active Learners", value: "1K+", icon: Users },
  { label: "Success Rate", value: "95%", icon: TrendingUp },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  
  // Responsive dimensions
  const isTablet = screenWidth > 768;
  const horizontalPadding = isTablet ? 32 : 24;

  // Fetch all chapters from database
  const allChapters = useQuery(api.chapter.getAllChapters);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate chapter counts dynamically
  const getChapterCount = (subjectName: string) => {
    if (!allChapters) return 0;
    const subjectKey = subjectName.toLowerCase();
    const chapters = allChapters[subjectKey];
    if (!chapters) return 0;
    // Sum chapters across all classes for this subject
    return Object.values(chapters).reduce((total, classChapters: any) => {
      return total + (Array.isArray(classChapters) ? classChapters.length : 0);
    }, 0);
  };

  // Enrich subjects with dynamic chapter counts
  const subjects = subjectConfig.map(subject => ({
    ...subject,
    chapters: getChapterCount(subject.name)
  }));

  // Calculate total chapters
  const totalChapters = subjects.reduce((sum, subject) => sum + subject.chapters, 0);

  return (
    <View className="flex-1">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5', '#4338CA']}
        className="absolute inset-0"
      />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          className="px-6 pt-16"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-1">
              <Text className="text-indigo-200 text-base font-medium">Welcome back!</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                Ready to learn?
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
              onPress={() => router.push('/(tabs)/home/search')}
            >
              <Search size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between mb-8">
            {stats.map((stat, index) => (
              <Animated.View
                key={index}
                className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex-1 mx-1"
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 10)) }],
                }}
              >
                <View className="bg-white/20 rounded-full p-2 w-10 h-10 items-center justify-center mb-2">
                  <stat.icon size={20} color="white" />
                </View>
                <Text className="text-white font-bold text-lg">
                  {stat.label === "Total Chapters" ? totalChapters : stat.value}
                </Text>
                <Text className="text-indigo-200 text-xs font-medium">{stat.label}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Hero Banner */}
          <Animated.View 
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/20"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(20)) }],
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <View className="bg-white/20 rounded-full h-1 w-20 mb-4" />
                <Text className="text-white text-xl font-bold mb-2">
                  Master CBSE Curriculum
                </Text>
                <Text className="text-indigo-200 text-sm font-medium mb-4">
                  Interactive chapters designed for Classes 9-12
                </Text>
                <TouchableOpacity className="bg-white rounded-2xl px-6 py-3 self-start">
                  <Text className="text-indigo-600 font-bold">Start Learning</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{
                  uri: "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750885008/projects/20944363-Photoroom_exvbcp.png",
                }}
                className="w-32 h-32"
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Subjects Section */}
        <View className="bg-slate-50 rounded-t-[32px] px-6 pt-8 pb-6 mt-4 min-h-full">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-slate-900 text-2xl font-bold">Explore Subjects</Text>
              <Text className="text-slate-500 text-sm font-medium mt-1">Choose your learning path</Text>
            </View>
            <View className="bg-indigo-100 rounded-2xl px-4 py-2">
              <Text className="text-indigo-600 text-sm font-bold">{subjects.length} Available</Text>
            </View>
          </View>

          <View className="space-y-4">
            {subjects.map((subject, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 15)) }],
                }}
              >
                <TouchableOpacity
                  className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                  onPress={() =>
                    router.push(`/(tabs)/home/${subject.name.toLowerCase()}`)
                  }
                  activeOpacity={0.9}
                >
                  <View className="flex-row">
                    <View className="flex-1 p-6">
                      <View className="flex-row items-center mb-3">
                        <View className="bg-indigo-100 rounded-2xl p-3 mr-4">
                          <Text className="text-2xl">{subject.icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 text-xl font-bold">{subject.name}</Text>
                          <Text className="text-slate-500 text-sm font-medium">{subject.description}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center justify-between mt-4">
                        <View className="flex-row items-center mr-2">
                          <View className="bg-slate-100 rounded-full p-2 mr-2">
                            <BookOpen size={16} color="#64748B" />
                          </View>
                          <Text className="text-slate-600 text-sm font-medium">{subject.chapters} Chapters</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View className="w-32 h-32 relative overflow-hidden">
                      <Image
                        source={{ uri: subject.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.1)']}
                        className="absolute inset-0"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          {/* Quick Actions */}
          <View className="mt-8 pt-6 border-t border-slate-200">
            <Text className="text-slate-900 text-lg font-bold mb-4">Quick Actions</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity className="bg-indigo-50 rounded-2xl p-4 flex-1 mr-2 items-center">
                <View className="bg-indigo-100 rounded-full p-3 mb-2">
                  <BookOpen size={24} color="#4F46E5" />
                </View>
                <Text className="text-indigo-600 font-semibold text-sm">Browse All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-slate-50 rounded-2xl p-4 flex-1 ml-2 items-center border border-slate-200"
                onPress={() => router.push('/(tabs)/home/search')}
              >
                <View className="bg-slate-100 rounded-full p-3 mb-2">
                  <Search size={24} color="#64748B" />
                </View>
                <Text className="text-slate-600 font-semibold text-sm">Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}