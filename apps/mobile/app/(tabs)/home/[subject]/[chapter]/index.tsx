import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { VideoData } from "@/lib/types";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText, Loader2, Play } from "lucide-react-native";
import React from "react";
import {
    Animated,
    Dimensions,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

const { width: screenWidth } = Dimensions.get("window");

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner":
      return {
        bg: "bg-green-100",
        text: "text-green-600",
        border: "border-green-200",
      };
    case "Intermediate":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        border: "border-yellow-200",
      };
    case "Advanced":
      return {
        bg: "bg-red-100",
        text: "text-red-600",
        border: "border-red-200",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
      };
  }
};

export default function ChapterScreen() {
  const { subject, chapter } = useLocalSearchParams<{
    subject: string;
    chapter: string;
  }>();
  const router = useRouter();
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"video" | "notes">("video");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

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

  // Get chapter data using Convex
  const chapterData = useQuery(api.chapter.getChapterById, {
    chapterId: chapter as Id<"chapters">,
  });

  // Loading state
  if (chapterData === undefined) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Animated.View
          style={{
            transform: [
              {
                rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <Loader2 size={48} color="#4F46E5" />
        </Animated.View>
      </View>
    );
  }

  if (!chapterData) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Text className="text-slate-600 text-lg">Chapter not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-indigo-500 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasVideos = chapterData.videos && chapterData.videos.length > 0;
  const safeActiveVideoIndex =
    hasVideos &&
    chapterData.videos &&
    activeVideoIndex < chapterData.videos.length
      ? activeVideoIndex
      : 0;
  const currentVideo =
    hasVideos && chapterData.videos
      ? chapterData.videos[safeActiveVideoIndex]
      : null;
  const difficultyColors = getDifficultyColor(chapterData.difficulty);

  const getVideoId = (youtubeUrl: string) => {
    // Extract just the video ID
    if (youtubeUrl.includes("youtu.be/")) {
      return youtubeUrl.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (youtubeUrl.includes("youtube.com")) {
      return youtubeUrl.split("v=")[1]?.split("&")[0] || "";
    } else if (youtubeUrl.includes("youtube.com/embed/")) {
      return youtubeUrl.split("embed/")[1]?.split("?")[0] || "";
    } else {
      return youtubeUrl;
    }
  };

  const handlePDFOpen = async (pdfUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        console.log("Don't know how to open URI: " + pdfUrl);
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
    }
  };

  return (
    <View className="flex-1">
      {/* Header with Gradient */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={["#6366F1", "#4F46E5", "#4338CA"]}
          className="pt-16 pb-6"
        >
          <View className="px-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
              >
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <View
                className={`${difficultyColors.bg} px-3 py-1 rounded-full border ${difficultyColors.border}`}
              >
                <Text
                  className={`${difficultyColors.text} text-xs font-semibold`}
                >
                  {chapterData.difficulty}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-white/80 text-sm font-medium capitalize mb-1">
                {chapterData.subject} • Class {chapterData.class}
              </Text>
              <Text className="text-white text-2xl font-bold mb-2">
                {chapterData.title}
              </Text>
              <Text className="text-white/90 text-sm leading-5">
                {chapterData.description}
              </Text>
            </View>

            {/* Chapter Stats */}
            <View className="flex-row items-center space-x-6">
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-2 mr-2">
                  <Play size={16} color="white" />
                </View>
                <Text className="text-white/90 text-sm font-medium">
                  {hasVideos
                    ? `${chapterData.videos?.length || 0} Videos`
                    : "No Videos"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        className="flex-1 bg-slate-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Tab Navigation */}
        <View className="bg-white border-b border-slate-200 px-4 pt-2">
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setActiveTab("video")}
              className={`flex-1 py-4 px-4 rounded-t-2xl border-b-2 flex-row items-center justify-center ${
                activeTab === "video"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-transparent bg-slate-50"
              }`}
            >
              <Play
                size={18}
                color={activeTab === "video" ? "#6366F1" : "#94A3B8"}
              />
              <Text
                className={`ml-2 font-semibold ${
                  activeTab === "video" ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("notes")}
              className={`flex-1 py-4 px-4 rounded-t-2xl border-b-2 flex-row items-center justify-center ${
                activeTab === "notes"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-transparent bg-slate-50"
              }`}
            >
              <FileText
                size={18}
                color={activeTab === "notes" ? "#6366F1" : "#94A3B8"}
              />
              <Text
                className={`ml-2 font-semibold ${
                  activeTab === "notes" ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                Notes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === "video" && (
          <>
            {/* Video Player Section or No Videos Message */}
            {hasVideos && currentVideo ? (
              <Animated.View
                className="bg-white mx-4 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: Animated.add(
                        slideAnim,
                        new Animated.Value(10),
                      ),
                    },
                  ],
                }}
              >
                <View className="p-4 pb-2">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-900 text-lg font-bold">
                      Now Playing
                    </Text>
                    <View className="bg-indigo-100 px-3 py-1 rounded-full">
                      <Text className="text-indigo-600 text-xs font-semibold">
                        {safeActiveVideoIndex + 1} of{" "}
                        {chapterData.videos?.length || 0}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-900 text-base font-semibold mb-2">
                    {currentVideo.title}
                  </Text>
                  <Text className="text-slate-500 text-sm mb-4">
                    {currentVideo.description}
                  </Text>
                </View>

                {/* Video Player */}
                <View
                  className="bg-black rounded-2xl mx-4 mb-4 overflow-hidden"
                  style={{ height: (screenWidth - 32) * 0.56 }} // 16:9 aspect ratio
                >
                  {!isVideoLoaded && (
                    <View className="flex-1 justify-center items-center bg-slate-900">
                      <View className="bg-white/20 rounded-full p-4 mb-4">
                        <Play size={32} color="white" />
                      </View>
                      <Text className="text-white text-sm">
                        Loading video...
                      </Text>
                    </View>
                  )}
                  <YoutubePlayer
                    height={200}
                    videoId={getVideoId(currentVideo.youtubeUrl)}
                    play={false}
                    onError={(error: string) => {
                      console.error("YoutubePlayer Error:", error);
                    }}
                    onReady={() => {
                      setIsVideoLoaded(true);
                    }}
                  />
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                className="bg-white mx-4 -mt-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: Animated.add(
                        slideAnim,
                        new Animated.Value(10),
                      ),
                    },
                  ],
                }}
              >
                <View className="p-6 items-center">
                  <View className="bg-slate-100 rounded-full p-6 mb-4">
                    <Play size={32} color="#64748B" />
                  </View>
                  <Text className="text-slate-900 text-lg font-bold mb-2">
                    No Videos Available
                  </Text>
                  <Text className="text-slate-500 text-sm text-center leading-5">
                    This chapter doesn't have any video content yet. Check back
                    later for updates or explore other learning materials.
                  </Text>
                </View>
              </Animated.View>
            )}
          </>
        )}

        {activeTab === "notes" && (
          <Animated.View
            className="mx-4 mt-3"
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.add(slideAnim, new Animated.Value(15)) },
              ],
            }}
          >
            {chapterData.notes && chapterData.notes.length > 0 ? (
              chapterData.notes.map((note: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-3 active:bg-amber-100 shadow-sm mb-2"
                  activeOpacity={0.8}
                  onPress={() => handlePDFOpen(note.url)}
                >
                  <View className="flex-row items-center">
                    <View className="bg-amber-500 rounded-lg p-2 mr-3">
                      <FileText size={16} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-amber-900 text-sm font-semibold mb-0.5">
                        {note.name}
                      </Text>
                      <Text className="text-amber-600 text-xs">
                        Tap to view document
                      </Text>
                    </View>
                    <View className="bg-amber-200 rounded-full px-2.5 py-1">
                      <Text className="text-amber-800 text-xs font-semibold">
                        PDF
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="p-6 items-center">
                <View className="bg-slate-100 rounded-full p-6 mb-4">
                  <FileText size={32} color="#64748B" />
                </View>
                <Text className="text-slate-900 text-lg font-bold mb-2">
                  No Notes Available
                </Text>
                <Text className="text-slate-500 text-sm text-center leading-5">
                  This chapter doesn't have any study notes yet. Check back
                  later for updates or explore other learning materials.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Video List */}
        {hasVideos && activeTab === "video" && (
          <View className="px-4 mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 text-xl font-bold">
                Chapter Videos
              </Text>
              <Text className="text-slate-500 text-sm">
                {chapterData.videos?.length || 0} videos
              </Text>
            </View>

            <View className="space-y-3">
              {chapterData.videos?.map((video: VideoData, index: number) => (
                <Animated.View
                  key={index}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: Animated.add(
                          slideAnim,
                          new Animated.Value(index * 5),
                        ),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    className={`bg-white rounded-2xl p-4 border ${
                      activeVideoIndex === index
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-100"
                    } shadow-sm`}
                    onPress={() => {
                      setActiveVideoIndex(index);
                      setIsVideoLoaded(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`${
                          activeVideoIndex === index
                            ? "bg-indigo-500"
                            : "bg-slate-100"
                        } rounded-xl p-3 mr-4`}
                      >
                        <Play
                          size={20}
                          color={
                            activeVideoIndex === index ? "white" : "#64748B"
                          }
                        />
                      </View>

                      <View className="flex-1">
                        <Text
                          className={`text-base font-semibold ${
                            video.description ? "mb-1" : ""
                          } ${
                            activeVideoIndex === index
                              ? "text-indigo-900"
                              : "text-slate-900"
                          }`}
                        >
                          {video.title}
                        </Text>
                        {video.description && (
                          <Text className="text-slate-500 text-sm mb-2">
                            {video.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
