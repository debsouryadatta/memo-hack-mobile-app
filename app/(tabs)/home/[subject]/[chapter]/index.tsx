import { getChapterDataById } from "@/lib/utils";
import { VideoData } from "@/lib/types";
import { chapterVideosData } from "@/constants/chapterVideos";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, Clock, FileText, Play, Users } from "lucide-react-native";
import React from "react";
import { Animated, Dimensions, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

const { width: screenWidth } = Dimensions.get('window');

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' };
    case 'Intermediate':
      return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' };
    case 'Advanced':
      return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  }
};

export default function ChapterScreen() {
  const { subject, chapter } = useLocalSearchParams<{ subject: string; chapter: string }>();
  const router = useRouter();
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
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

  // Get chapter data using the unique ID
  const chapterResult = getChapterDataById(chapter || "", chapterVideosData);
  const chapterData = chapterResult?.data || null;
  const classKey = chapterResult?.classKey || null;
  const detectedSubject = chapterResult?.subject || subject;

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
  const safeActiveVideoIndex = hasVideos && activeVideoIndex < chapterData.videos.length ? activeVideoIndex : 0;
  const currentVideo = hasVideos ? chapterData.videos[safeActiveVideoIndex] : null;
  const difficultyColors = getDifficultyColor(chapterData.difficulty);

  const getYouTubeEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=0&rel=0`;
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
      console.error('Error opening PDF:', error);
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
          colors={['#6366F1', '#4F46E5', '#4338CA']}
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
              <View className={`${difficultyColors.bg} px-3 py-1 rounded-full border ${difficultyColors.border}`}>
                <Text className={`${difficultyColors.text} text-xs font-semibold`}>
                  {chapterData.difficulty}
                </Text>
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="text-white/80 text-sm font-medium capitalize mb-1">
                {detectedSubject} • {classKey ? classKey.replace('class', 'Class ') : 'Class'}
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
                  {hasVideos ? `${chapterData.videos.length} Videos` : 'No Videos'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-2 mr-2">
                  <Clock size={16} color="white" />
                </View>
                <Text className="text-white/90 text-sm font-medium">
                  {chapterData.estimatedTime}
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
        {/* Video Player Section or No Videos Message */}
        {hasVideos && currentVideo ? (
          <Animated.View 
            className="bg-white mx-4 -mt-4 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(10)) }],
            }}
          >
          <View className="p-4 pb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 text-lg font-bold">Now Playing</Text>
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-600 text-xs font-semibold">
                  {safeActiveVideoIndex + 1} of {chapterData.videos.length}
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
                <Text className="text-white text-sm">Loading video...</Text>
              </View>
            )}
            <WebView
              source={{ uri: getYouTubeEmbedUrl(currentVideo.id) }}
              className="flex-1"
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoadEnd={() => setIsVideoLoaded(true)}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
          </Animated.View>
        ) : (
          <Animated.View 
            className="bg-white mx-4 -mt-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(10)) }],
            }}
          >
            <View className="p-6 items-center">
              <View className="bg-slate-100 rounded-full p-6 mb-4">
                <Play size={32} color="#64748B" />
              </View>
              <Text className="text-slate-900 text-lg font-bold mb-2">No Videos Available</Text>
              <Text className="text-slate-500 text-sm text-center leading-5">
                This chapter doesn't have any video content yet. Check back later for updates or explore other learning materials.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Notes Section */}
        {currentVideo && currentVideo.notes && (
          <Animated.View 
            className="mx-4 mt-3"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(15)) }],
            }}
          >
            <TouchableOpacity
              className="bg-amber-50 border border-amber-200 rounded-xl p-3 active:bg-amber-100 shadow-sm"
              activeOpacity={0.8}
              onPress={() => {
                if (currentVideo.notes) {
                  handlePDFOpen(currentVideo.notes);
                }
              }}
            >
              <View className="flex-row items-center">
                <View className="bg-amber-500 rounded-lg p-2 mr-3">
                  <FileText size={16} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-amber-900 text-sm font-semibold mb-0.5">
                    Study Notes Available
                  </Text>
                  <Text className="text-amber-600 text-xs">
                    Tap to view PDF notes for this video
                  </Text>
                </View>
                <View className="bg-amber-200 rounded-full px-2.5 py-1">
                  <Text className="text-amber-800 text-xs font-semibold">PDF</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Video List */}
        {hasVideos && (
          <View className="px-4 mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 text-xl font-bold">Chapter Videos</Text>
              <Text className="text-slate-500 text-sm">
                {chapterData.videos.length} videos
              </Text>
            </View>

            <View className="space-y-3">
              {chapterData.videos.map((video: VideoData, index: number) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 5)) }],
                }}
              >
                <TouchableOpacity
                  className={`bg-white rounded-2xl p-4 border ${
                    activeVideoIndex === index 
                      ? 'border-indigo-200 bg-indigo-50' 
                      : 'border-slate-100'
                  } shadow-sm`}
                  onPress={() => {
                    setActiveVideoIndex(index);
                    setIsVideoLoaded(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <View className={`${
                      activeVideoIndex === index 
                        ? 'bg-indigo-500' 
                        : 'bg-slate-100'
                    } rounded-xl p-3 mr-4`}>
                      <Play 
                        size={20} 
                        color={activeVideoIndex === index ? 'white' : '#64748B'} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-base font-semibold mb-1 ${
                        activeVideoIndex === index ? 'text-indigo-900' : 'text-slate-900'
                      }`}>
                        {video.title}
                      </Text>
                      <Text className="text-slate-500 text-sm mb-2">
                        {video.description}
                      </Text>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#94A3B8" />
                        <Text className="text-slate-400 text-xs ml-1">
                          {video.duration}
                        </Text>
                        {video.notes && (
                          <View className="bg-amber-100 border border-amber-200 rounded-full px-2 py-1 ml-2">
                            <View className="flex-row items-center">
                              <FileText size={10} color="#92400e" />
                              <Text className="text-amber-700 text-xs font-semibold ml-1">Notes</Text>
                            </View>
                          </View>
                        )}
                        {activeVideoIndex === index && (
                          <View className="bg-indigo-500 rounded-full px-2 py-1 ml-2">
                            <Text className="text-white text-xs font-semibold">Playing</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Chapter Summary */}
        <View className="mx-4 mt-8">
          <View className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-3xl p-6 border border-indigo-200">
            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-500 rounded-2xl p-3 mr-4">
                <BookOpen size={24} color="white" />
              </View>
              <View>
                <Text className="text-indigo-900 text-lg font-bold">Chapter Summary</Text>
                <Text className="text-indigo-600 text-sm">Key learning outcomes</Text>
              </View>
            </View>
            
            <Text className="text-indigo-800 text-sm leading-6 mb-4">
              {chapterData.description}
            </Text>
            
            <View className="flex-row justify-between items-center pt-4 border-t border-indigo-200">
              <View className="flex-row items-center">
                <Users size={16} color="#6366F1" />
                <Text className="text-indigo-600 text-sm ml-2 font-medium">
                  Complete all videos to master this chapter
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}