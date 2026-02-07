import { useApp } from '@/components/ContextProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Edit2, GraduationCap, LogOut, Mail, Phone, Settings, Shield, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Dimensions, Image, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  
  // Add safety check for context
  let user, signout, isLoading;
  try {
    const appContext = useApp();
    user = appContext.user;
    signout = appContext.signout;
    isLoading = appContext.isLoading;
  } catch (error) {
    console.warn('App context not available:', error);
    // Fallback values
    user = null;
    isLoading = false;
    signout = async () => {
      console.warn('Signout not available');
      router.replace('/');
    };
  }
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signout();
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update.');
  };

  const isAdmin = user?.admin === true;

  if (!user) {
    return (
      <SafeAreaView className="flex-1">
        <LinearGradient
          colors={['#6366F1', '#4F46E5', '#4338CA']}
          className='absolute top-0 left-0 right-0 bottom-0'
        />
        
        <View className="flex-1 justify-center items-center px-8">
          {/* Illustration Image */}
          <View className="items-center mb-8">
            <Image
              source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750880675/projects/8848692-removebg-preview_c63mem.png' }}
              className='w-[250px] h-[250px]'
              resizeMode='contain'
            />
          </View>
          
          {/* Content Card */}
          <View className='w-full max-w-sm'>
            <View className='bg-white/15 rounded-3xl p-8 backdrop-blur-md border border-white/20'>
              <View className="items-center">
                <View className="bg-white/20 rounded-full p-4 mb-4">
                  <User size={32} color="rgba(255,255,255,0.8)" />
                </View>
                
                <Text className='text-2xl font-bold text-white text-center mb-3'>
                  Sign In Required
                </Text>
                
                <Text className='text-white/70 text-center text-base mb-8 leading-6'>
                  Please sign in to your account to view and manage your profile information
                </Text>
                
                {/* Sign In Button */}
                <TouchableOpacity 
                  className='w-full bg-white rounded-2xl py-4 px-6 mb-4'
                  onPress={() => router.push('/(auth)/signin')}
                  style={{ 
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  <Text className='text-indigo-600 text-center text-lg font-bold'>
                    Sign In
                  </Text>
                </TouchableOpacity>
                
                {/* Sign Up Link */}
                <View className='flex-row justify-center items-center'>
                  <Text className='text-white/70 text-sm'>Don't have an account? </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/(auth)/signup')}
                    className='px-2 py-1'
                  >
                    <Text className='text-white font-bold text-sm'>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          {/* Guest Option */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')}
            className='mt-6 px-6 py-3 bg-white/10 rounded-full border border-white/20'
          >
            <Text className='text-white/80 text-center text-base font-medium'>
              Continue as Guest
            </Text>
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
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: Platform.OS === 'ios' ? 100 : 80,
          minHeight: '100%'
        }}
      >
        {/* Enhanced Header with floating effect */}
        <View className="pt-12 pb-6 px-4" style={{ minHeight: screenWidth * 0.7 }}>
          <View className="items-center">
            {/* Profile Image with enhanced shadow and border */}
            <View className="relative mb-4">
              <View 
                className="rounded-full bg-white/30 p-1"
                style={{
                  width: screenWidth * 0.35,
                  height: screenWidth * 0.35,
                  maxWidth: 140,
                  maxHeight: 140,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12
                }}
              >
                <Image
                  source={{ uri: user.image }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              </View>
              <TouchableOpacity 
                className="absolute -bottom-2 -right-2 bg-white rounded-full p-3"
                onPress={handleEditProfile}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Edit2 size={18} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            {/* Enhanced User Info */}
            <View className="items-center">
              <Text 
                className="text-white font-bold text-center mb-1"
                style={{ fontSize: Math.min(screenWidth * 0.07, 28) }}
              >
                {user.name}
              </Text>
              <View className="flex-row items-center mb-3">
                <View className="bg-white/20 rounded-full px-3 py-1">
                  <Text className="text-white/90 text-sm font-medium">Class {user.class}</Text>
                </View>
              </View>
              <Text className="text-white/70 text-base">{user.email}</Text>
              <Text className="text-white/50 text-sm mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* White Background Content Section */}
        <View className="bg-slate-50 rounded-t-[32px] px-6 pt-8 pb-6 mt-4 min-h-full">
          <View>
              {/* Enhanced Profile Details */}
              <View className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 mb-6 border border-slate-100">
                <Text className="text-slate-900 text-xl font-bold mb-6">Personal Information</Text>
                
                <View className="space-y-5">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-full p-3 mr-4">
                      <Mail size={22} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 text-sm font-medium">Email Address</Text>
                      <Text className="text-slate-900 text-base font-semibold mt-1">{user.email}</Text>
                    </View>
                  </View>

                  <View className="h-px bg-slate-200" />

                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-full p-3 mr-4">
                      <Phone size={22} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 text-sm font-medium">Phone Number</Text>
                      <Text className="text-slate-900 text-base font-semibold mt-1">{user.phone}</Text>
                    </View>
                  </View>

                  <View className="h-px bg-slate-200" />

                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-full p-3 mr-4">
                      <GraduationCap size={22} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 text-sm font-medium">Academic Level</Text>
                      <Text className="text-slate-900 text-base font-semibold mt-1">Class {user.class}</Text>
                    </View>
                  </View>

                  <View className="h-px bg-slate-200" />

                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 rounded-full p-3 mr-4">
                      <Calendar size={22} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 text-sm font-medium">Joined</Text>
                      <Text className="text-slate-900 text-base font-semibold mt-1">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>

                  {user.memohackStudent !== null && user.memohackStudent !== undefined && (
                    <>
                      <View className="h-px bg-slate-200" />

                      <View className="flex-row items-center">
                        <View className="bg-indigo-100 rounded-full p-3 mr-4">
                          <GraduationCap size={22} color="#4F46E5" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-500 text-sm font-medium">MemoHack Student</Text>
                          <Text className="text-slate-900 text-base font-semibold mt-1">
                            {user.memohackStudent ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Action Menu */}
              <View className="mb-6">
                <Text className="text-slate-900 text-xl font-bold mb-4">Account Settings</Text>
                
                <View className="space-y-3">
                  <TouchableOpacity 
                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100"
                    onPress={handleEditProfile}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-indigo-100 rounded-full p-3 mr-4">
                        <Settings size={22} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 text-base font-semibold">Edit Profile</Text>
                        <Text className="text-slate-500 text-sm">Update your personal information</Text>
                      </View>
                      <ChevronRight size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100"
                    onPress={() => Alert.alert('Coming Soon', 'Account settings will be available soon')}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-indigo-100 rounded-full p-3 mr-4">
                        <User size={22} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 text-base font-semibold">Account Settings</Text>
                        <Text className="text-slate-500 text-sm">Manage your account preferences</Text>
                      </View>
                      <ChevronRight size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>

                  {/* Admin Panel - Only visible for admin users */}
                  {isAdmin && (
                    <TouchableOpacity 
                      className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-indigo-200"
                      onPress={() => router.push('/(tabs)/profile/admin')}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-indigo-100 rounded-full p-3 mr-4">
                          <Shield size={22} color="#4F46E5" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 text-base font-semibold">Admin Panel</Text>
                          <Text className="text-slate-500 text-sm">Manage chapters and content</Text>
                        </View>
                        <ChevronRight size={20} color="#94A3B8" />
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-red-200"
                    onPress={handleSignOut}
                    disabled={isLoading}
                    style={{
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-red-100 rounded-full p-3 mr-4">
                        <LogOut size={22} color="#DC2626" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-red-600 text-base font-semibold">Sign Out</Text>
                        <Text className="text-slate-500 text-sm">Sign out of your account</Text>
                      </View>
                      <ChevronRight size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          {/* Enhanced Footer */}
          <View className="mt-4">
            <View className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
              <View className="items-center">
                <Text className="text-slate-900 font-bold text-lg mb-2">MemoHack</Text>
                <Text className="text-slate-600 text-center text-sm leading-5">
                  Version 1.0.0{'\n'}
                  Your complete JEE & NEET preparation companion
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}