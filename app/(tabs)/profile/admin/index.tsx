import { useApp } from '@/components/ContextProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ManageChapters from '../../../../components/ManageChapters';
import ManageUsers from '../../../../components/ManageUsers';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'chapters' | 'users'>('chapters');

  // Check if user is admin
  const isAdmin = user?.admin === true;

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

      {/* Content */}
      <View className="bg-slate-50 rounded-t-[32px] flex-1">
        {/* Tab Buttons */}
        <View className="flex-row border-b border-slate-200 px-6 pt-6">
          <TouchableOpacity
            onPress={() => setActiveTab('chapters')}
            className={`pb-4 px-4 mr-4 border-b-2 ${
              activeTab === 'chapters'
                ? 'border-indigo-500'
                : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                activeTab === 'chapters'
                  ? 'text-indigo-500'
                  : 'text-slate-600'
              }`}
            >
              Manage Chapters
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('users')}
            className={`pb-4 px-4 border-b-2 ${
              activeTab === 'users'
                ? 'border-indigo-500'
                : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                activeTab === 'users'
                  ? 'text-indigo-500'
                  : 'text-slate-600'
              }`}
            >
              Manage Users
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="flex-1">
          {activeTab === 'chapters' && <ManageChapters />}
          {activeTab === 'users' && <ManageUsers />}
        </View>
      </View>
    </SafeAreaView>
  );
}