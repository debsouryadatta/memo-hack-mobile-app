import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  Modal,
  ActivityIndicator
} from 'react-native';
import { useApp } from '@/components/ContextProvider';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Play, 
  Clock, 
  AlertCircle,
  Save,
  X
} from 'lucide-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface VideoForm {
  id: string;
  title: string;
  duration: string;
  description: string;
  notes?: string;
}

interface ChapterForm {
  chapterId: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  class: string;
  subject: string;
  videos: VideoForm[];
}

const CLASSES = ['9', '10', '11', '12'];
const SUBJECTS = ['physics', 'biology'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function AdminScreen() {
  const router = useRouter();
  const { user, token } = useApp();
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const [selectedClass, setSelectedClass] = useState('9');
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [chapterForm, setChapterForm] = useState<ChapterForm>({
    chapterId: '',
    title: '',
    description: '',
    estimatedTime: '',
    difficulty: 'Beginner',
    class: '9',
    subject: 'physics',
    videos: []
  });

  // Check if user is admin
  const isAdmin = user?.email === 'deb@gmail.com';

  // Convex queries and mutations
  const allChapters = useQuery(api.chapter.getAllChapters);
  const createChapter = useMutation(api.chapter.createChapter);
  const updateChapter = useMutation(api.chapter.updateChapter);
  const deleteChapter = useMutation(api.chapter.deleteChapter);

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">
        <View className="bg-red-100 border border-red-200 rounded-2xl p-8 mx-6">
          <AlertCircle size={48} color="#DC2626" className="self-center mb-4" />
          <Text className="text-red-800 text-xl font-bold text-center mb-2">Access Denied</Text>
          <Text className="text-red-600 text-center mb-6">
            You don't have permission to access this admin panel.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-red-600 rounded-xl py-3 px-6"
          >
            <Text className="text-white font-semibold text-center">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const resetForm = () => {
    setChapterForm({
      chapterId: '',
      title: '',
      description: '',
      estimatedTime: '',
      difficulty: 'Beginner',
      class: selectedClass,
      subject: selectedSubject,
      videos: []
    });
    setEditingChapter(null);
  };

  const openEditModal = (chapter: any) => {
    setEditingChapter(chapter);
    setChapterForm({
      chapterId: chapter.chapterId,
      title: chapter.title,
      description: chapter.description,
      estimatedTime: chapter.estimatedTime,
      difficulty: chapter.difficulty,
      class: chapter.class,
      subject: chapter.subject,
      videos: chapter.videos || []
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addVideo = () => {
    setChapterForm(prev => ({
      ...prev,
      videos: [...prev.videos, {
        id: '',
        title: '',
        duration: '',
        description: '',
        notes: ''
      }]
    }));
  };

  const updateVideo = (index: number, field: keyof VideoForm, value: string) => {
    setChapterForm(prev => ({
      ...prev,
      videos: prev.videos.map((video, i) => 
        i === index ? { ...video, [field]: value } : video
      )
    }));
  };

  const removeVideo = (index: number) => {
    setChapterForm(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Error', 'No authentication token found');
      return;
    }

    if (!chapterForm.chapterId || !chapterForm.title) {
      Alert.alert('Error', 'Chapter ID and title are required');
      return;
    }

    setLoading(true);
    try {
      if (editingChapter) {
        await updateChapter({
          token,
          chapterId: chapterForm.chapterId,
          title: chapterForm.title,
          description: chapterForm.description,
          estimatedTime: chapterForm.estimatedTime,
          difficulty: chapterForm.difficulty,
          videos: chapterForm.videos.filter(v => v.id && v.title)
        });
        Alert.alert('Success', 'Chapter updated successfully');
      } else {
        await createChapter({
          token,
          ...chapterForm,
          videos: chapterForm.videos.filter(v => v.id && v.title)
        });
        Alert.alert('Success', 'Chapter created successfully');
      }
      closeModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (chapter: any) => {
    Alert.alert(
      'Delete Chapter',
      `Are you sure you want to delete "${chapter.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteChapter({
                token,
                chapterId: chapter.chapterId
              });
              Alert.alert('Success', 'Chapter deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete chapter');
            }
          }
        }
      ]
    );
  };

  const getFilteredChapters = () => {
    if (!allChapters) return [];
    return allChapters[selectedSubject]?.[`class${selectedClass}`] || [];
  };

  // Show loading spinner while chapters are loading
  if (allChapters === undefined) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={['#6366F1', '#4F46E5', '#4338CA']}
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
            <Text className="text-white text-xl font-bold">Admin Panel</Text>
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
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#6366F1', '#4F46E5', '#4338CA']}
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
          <Text className="text-white text-xl font-bold">Admin Panel</Text>
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="bg-slate-50 rounded-t-[32px] flex-1 px-6 pt-8">
        {/* Subject and Class Filters */}
        <View className="mb-6">
          <Text className="text-slate-900 text-lg font-bold mb-4">Filter Content</Text>
          
          <View className="flex-row mb-4">
            <Text className="text-slate-700 font-medium mb-2 w-20">Subject:</Text>
            <View className="flex-row flex-1 -mt-2">
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  onPress={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-xl mr-2 ${
                    selectedSubject === subject
                      ? 'bg-indigo-500'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text className={`font-medium capitalize ${
                    selectedSubject === subject ? 'text-white' : 'text-slate-700'
                  }`}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row">
            <Text className="text-slate-700 font-medium mb-2 w-20 mt-3">Class:</Text>
            <View className="flex-row flex-1 flex-wrap">
              {CLASSES.map((classNum) => (
                <TouchableOpacity
                  key={classNum}
                  onPress={() => setSelectedClass(classNum)}
                  className={`px-4 py-2 rounded-xl mr-2 mb-2 ${
                    selectedClass === classNum
                      ? 'bg-indigo-500'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedClass === classNum ? 'text-white' : 'text-slate-700'
                  }`}>
                    {classNum}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Chapters List */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-lg font-bold">
              {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)} - Class {selectedClass}
            </Text>
            <Text className="text-slate-500 text-sm">
              {getFilteredChapters().length} chapters
            </Text>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {getFilteredChapters().map((chapter) => (
              <View
                key={chapter.chapterId}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-slate-900 text-base font-semibold mb-1">
                      {chapter.title}
                    </Text>
                    <Text className="text-slate-500 text-sm mb-2">
                      {chapter.description}
                    </Text>
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <Play size={14} color="#64748B" />
                        <Text className="text-slate-500 text-xs ml-1">
                          {chapter.videos?.length || 0} videos
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#64748B" />
                        <Text className="text-slate-500 text-xs ml-1">
                          {chapter.estimatedTime}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${
                        chapter.difficulty === 'Beginner' ? 'bg-green-100' :
                        chapter.difficulty === 'Intermediate' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          chapter.difficulty === 'Beginner' ? 'text-green-600' :
                          chapter.difficulty === 'Intermediate' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {chapter.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row ml-2">
                    <TouchableOpacity
                      onPress={() => openEditModal(chapter)}
                      className="bg-blue-100 p-2 rounded-lg mr-2"
                    >
                      <Edit3 size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(chapter)}
                      className="bg-red-100 p-2 rounded-lg"
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {getFilteredChapters().length === 0 && (
              <View className="bg-white rounded-2xl p-8 items-center">
                <BookOpen size={48} color="#64748B" className="mb-4" />
                <Text className="text-slate-900 text-lg font-semibold mb-2">No Chapters Found</Text>
                <Text className="text-slate-500 text-center text-sm mb-4">
                  No chapters exist for {selectedSubject} Class {selectedClass} yet.
                </Text>
                <TouchableOpacity
                  onPress={openCreateModal}
                  className="bg-indigo-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Create First Chapter</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-200">
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-slate-900 text-lg font-bold">
              {editingChapter ? 'Edit Chapter' : 'Create Chapter'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="bg-indigo-500 px-4 py-2 rounded-lg"
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Save size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Basic Chapter Info */}
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-slate-900 text-lg font-bold mb-4">Chapter Information</Text>
              
              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Chapter ID *</Text>
                <TextInput
                  value={chapterForm.chapterId}
                  onChangeText={(text) => setChapterForm(prev => ({ ...prev, chapterId: text }))}
                  placeholder="e.g., physics-class9-motion"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  editable={!editingChapter}
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Title *</Text>
                <TextInput
                  value={chapterForm.title}
                  onChangeText={(text) => setChapterForm(prev => ({ ...prev, title: text }))}
                  placeholder="Chapter title"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Description</Text>
                <TextInput
                  value={chapterForm.description}
                  onChangeText={(text) => setChapterForm(prev => ({ ...prev, description: text }))}
                  placeholder="Chapter description"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Estimated Time</Text>
                <TextInput
                  value={chapterForm.estimatedTime}
                  onChangeText={(text) => setChapterForm(prev => ({ ...prev, estimatedTime: text }))}
                  placeholder="e.g., 2 hours"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </View>

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1">
                  <Text className="text-slate-700 font-medium mb-2">Subject</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <Text className="text-slate-900 capitalize">{chapterForm.subject}</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-700 font-medium mb-2">Class</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <Text className="text-slate-900">Class {chapterForm.class}</Text>
                  </View>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Difficulty</Text>
                <View className="flex-row space-x-2">
                  {DIFFICULTIES.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      onPress={() => setChapterForm(prev => ({ 
                        ...prev, 
                        difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced' 
                      }))}
                      className={`px-4 py-2 rounded-xl ${
                        chapterForm.difficulty === difficulty
                          ? 'bg-indigo-500'
                          : 'bg-slate-100'
                      }`}
                    >
                      <Text className={`font-medium ${
                        chapterForm.difficulty === difficulty ? 'text-white' : 'text-slate-700'
                      }`}>
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Videos Section */}
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 text-lg font-bold">Videos</Text>
                <TouchableOpacity
                  onPress={addVideo}
                  className="bg-indigo-500 px-3 py-1 rounded-lg"
                >
                  <Text className="text-white font-semibold text-sm">Add Video</Text>
                </TouchableOpacity>
              </View>

              {chapterForm.videos.map((video, index) => (
                <View key={index} className="border border-slate-200 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-700 font-medium">Video {index + 1}</Text>
                    <TouchableOpacity
                      onPress={() => removeVideo(index)}
                      className="bg-red-100 p-1 rounded"
                    >
                      <Trash2 size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    value={video.id}
                    onChangeText={(text) => updateVideo(index, 'id', text)}
                    placeholder="YouTube Video ID"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 mb-2"
                  />

                  <TextInput
                    value={video.title}
                    onChangeText={(text) => updateVideo(index, 'title', text)}
                    placeholder="Video title"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 mb-2"
                  />

                  <TextInput
                    value={video.duration}
                    onChangeText={(text) => updateVideo(index, 'duration', text)}
                    placeholder="Duration (e.g., 15 min)"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 mb-2"
                  />

                  <TextInput
                    value={video.description}
                    onChangeText={(text) => updateVideo(index, 'description', text)}
                    placeholder="Video description"
                    multiline
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 mb-2"
                  />

                  <TextInput
                    value={video.notes || ''}
                    onChangeText={(text) => updateVideo(index, 'notes', text)}
                    placeholder="Notes URL (optional)"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </View>
              ))}

              {chapterForm.videos.length === 0 && (
                <View className="items-center py-8">
                  <Play size={32} color="#64748B" className="mb-2" />
                  <Text className="text-slate-500 text-sm">No videos added yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}