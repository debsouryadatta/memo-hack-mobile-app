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
  },
  {
    name: "Biology",
    image:
      "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884633/projects/14_agexsk.jpg",
    icon: "🧬",
    description: "Life Sciences & Genetics",
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

  const allChapters = useQuery(api.chapter.getAllChapters);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const getChapterCount = (subjectName: string): number => {
    if (!allChapters) return 0;
    const chapters = allChapters[subjectName.toLowerCase()];
    if (!chapters) return 0;
    return Object.values(chapters).reduce((total: number, classChapters) => {
      return total + (Array.isArray(classChapters) ? classChapters.length : 0);
    }, 0);
  };

  const subjects = subjectConfig.map(subject => ({
    ...subject,
    chapters: getChapterCount(subject.name),
  }));

  const totalChapters = subjects.reduce((sum, s) => sum + s.chapters, 0);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#6366F1', '#4F46E5', '#4338CA']} style={{ position: 'absolute', inset: 0 }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#c7d2fe', fontSize: 15, fontWeight: '500' }}>Welcome back!</Text>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginTop: 2 }}>Ready to learn?</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: 16 }}
              onPress={() => router.push('/(tabs)/home/search')}
            >
              <Search size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={{ flexDirection: 'row', marginBottom: 28, gap: 8 }}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  padding: 14,
                }}
              >
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <stat.icon size={18} color="white" />
                </View>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 20, lineHeight: 24 }}>
                  {stat.label === "Total Chapters" ? (totalChapters || stat.value) : stat.value}
                </Text>
                <Text style={{ color: '#c7d2fe', fontSize: 11, fontWeight: '500', marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Hero Banner */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 28,
            padding: 20,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 99, height: 3, width: 40, marginBottom: 12 }} />
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
                Master CBSE Curriculum
              </Text>
              <Text style={{ color: '#c7d2fe', fontSize: 13, fontWeight: '500', marginBottom: 16, lineHeight: 19 }}>
                Interactive chapters designed for Classes 9–12
              </Text>
              <TouchableOpacity style={{
                backgroundColor: 'white',
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 10,
                alignSelf: 'flex-start',
              }}>
                <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 14 }}>Start Learning</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: "https://res.cloudinary.com/diyxwdtjd/image/upload/v1750885008/projects/20944363-Photoroom_exvbcp.png" }}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Subjects Section */}
        <View style={{
          backgroundColor: '#f8fafc',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: 24,
          marginTop: 4,
          minHeight: 400,
        }}>
          {/* Section Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: '800' }}>Explore Subjects</Text>
              <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', marginTop: 2 }}>Choose your learning path</Text>
            </View>
            <View style={{ backgroundColor: '#e0e7ff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ color: '#4F46E5', fontSize: 13, fontWeight: '700' }}>{subjects.length} Available</Text>
            </View>
          </View>

          {/* Subject Cards */}
          <View style={{ gap: 16 }}>
            {subjects.map((subject, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 15)) }],
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#f1f5f9',
                    shadowColor: '#94a3b8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                    flexDirection: 'row',
                  }}
                  onPress={() => router.push(`/(tabs)/home/${subject.name.toLowerCase()}`)}
                  activeOpacity={0.88}
                >
                  {/* Content */}
                  <View style={{ flex: 1, padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <View style={{
                        backgroundColor: '#eef2ff',
                        borderRadius: 16,
                        padding: 12,
                        marginRight: 14,
                      }}>
                        <Text style={{ fontSize: 22 }}>{subject.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#0f172a', fontSize: 19, fontWeight: '800' }}>{subject.name}</Text>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', marginTop: 2 }}>{subject.description}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 99, padding: 6, marginRight: 8 }}>
                        <BookOpen size={14} color="#64748B" />
                      </View>
                      <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                        {subject.chapters} {subject.chapters === 1 ? 'Chapter' : 'Chapters'}
                      </Text>
                    </View>
                  </View>

                  {/* Image — self-stretch to fill full card height */}
                  <View style={{ width: 120, alignSelf: 'stretch' }}>
                    <Image
                      source={{ uri: subject.image }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={{ marginTop: 28, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
            <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '700', marginBottom: 14 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{
                flex: 1,
                backgroundColor: '#eef2ff',
                borderRadius: 20,
                padding: 16,
                alignItems: 'center',
              }}>
                <View style={{ backgroundColor: '#e0e7ff', borderRadius: 99, padding: 10, marginBottom: 8 }}>
                  <BookOpen size={22} color="#4F46E5" />
                </View>
                <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>Browse All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderRadius: 20,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
                onPress={() => router.push('/(tabs)/home/search')}
              >
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 99, padding: 10, marginBottom: 8 }}>
                  <Search size={22} color="#64748B" />
                </View>
                <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

