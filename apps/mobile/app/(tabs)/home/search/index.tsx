import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, BookOpen, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Animated,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Chapter {
  _id: Id<"chapters">;
  title: string;
  description: string;
  difficulty: string;
  class: string;
  subject: string;
  videos?: Array<{
    title: string;
    description?: string;
    youtubeUrl: string;
  }>;
  notes?: Array<{
    name: string;
    url: string;
  }>;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const groupedChapters = useQuery(api.chapter.getAllChapters);

  // Flatten all chapters for searching
  const allChapters = useMemo(() => {
    if (!groupedChapters) return [];

    const chapters: Chapter[] = [];
    Object.keys(groupedChapters).forEach((subject) => {
      Object.keys(groupedChapters[subject]).forEach((classNum) => {
        chapters.push(...groupedChapters[subject][classNum]);
      });
    });

    return chapters;
  }, [groupedChapters]);

  // Filter chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return allChapters;

    const query = searchQuery.toLowerCase().trim();
    return allChapters.filter(
      (chapter) =>
        chapter.title.toLowerCase().includes(query) ||
        chapter.description.toLowerCase().includes(query) ||
        chapter.subject.toLowerCase().includes(query) ||
        chapter.class.toLowerCase().includes(query) ||
        chapter.difficulty.toLowerCase().includes(query),
    );
  }, [allChapters, searchQuery]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100"
      onPress={() =>
        router.push(`/(tabs)/home/${item.subject.toLowerCase()}/${item._id}`)
      }
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-slate-900 text-lg font-bold" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-slate-600 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View className="bg-indigo-50 rounded-full px-3 py-1">
          <Text className="text-indigo-600 text-xs font-medium">
            Class {item.class}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <View className="bg-slate-100 rounded-full p-2 mr-3">
            <BookOpen size={14} color="#64748B" />
          </View>
          <Text className="text-slate-500 text-sm font-medium capitalize">
            {item.subject}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <View className="bg-orange-50 rounded-full px-2 py-1">
            <Text className="text-orange-600 text-xs font-medium capitalize">
              {item.difficulty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-20">
      <View className="bg-slate-100 rounded-full p-6 mb-4">
        <Search size={32} color="#94A3B8" />
      </View>
      <Text className="text-slate-900 text-xl font-bold mb-2">
        {searchQuery ? "No chapters found" : "Start searching"}
      </Text>
      <Text className="text-slate-500 text-center text-sm max-w-xs">
        {searchQuery
          ? `No chapters match "${searchQuery}". Try different keywords.`
          : "Search for chapters by title, subject, class, or difficulty level"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#4F46E5"]}
        className="pt-12 pb-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between px-6 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 rounded-full p-2"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-bold flex-1 text-center mr-10">
            Search Chapters
          </Text>
        </View>

        {/* Search Input */}
        <Animated.View className="mx-6" style={{ opacity: fadeAnim }}>
          <View className="bg-white rounded-2xl flex-row items-center px-4 py-3 shadow-lg">
            <Search size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-slate-900 text-base"
              placeholder="Search chapters, subjects, or topics..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="ml-2"
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Results */}
      <Animated.View className="flex-1 px-6 pt-6" style={{ opacity: fadeAnim }}>
        {/* Results Header */}
        {searchQuery && (
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-lg font-bold">
              Search Results
            </Text>
            <View className="bg-indigo-50 rounded-full px-3 py-1">
              <Text className="text-indigo-600 text-sm font-medium">
                {filteredChapters.length} found
              </Text>
            </View>
          </View>
        )}

        <FlatList
          data={filteredChapters}
          renderItem={renderChapterItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmptyState}
        />
      </Animated.View>
    </View>
  );
}
