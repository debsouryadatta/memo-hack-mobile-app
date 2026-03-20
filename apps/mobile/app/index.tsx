import { useApp } from "@/components/ContextProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";

const heroLanding = require('../assets/illustrations/hero-landing.png');

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View className='flex-1'>
        <LinearGradient
          colors={['#4F46E5', '#818CF8']}
          className='absolute top-0 left-0 right-0 bottom-0'
        />
        <View className="flex-1 justify-center items-center">
          <Image
            source={heroLanding}
            style={{ width: 120, height: 120, marginBottom: 32 }}
            resizeMode='contain'
          />
          <ActivityIndicator size="large" color="white" />
          <Text className='text-white text-lg mt-4 font-medium'>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1'>
      <LinearGradient
        colors={['#4F46E5', '#818CF8']}
        className='absolute top-0 left-0 right-0 bottom-0'
      />
      <View className="flex-1 justify-end items-center pb-16">
        {/* Image Container */}
        <View className="absolute top-0 w-full h-3/5 justify-center items-center">
          <Image
            source={heroLanding}
            style={{ width: 280, height: 280 }}
            resizeMode='contain'
          />
        </View>

        {/* Text and Buttons Container */}
        <View className='w-full items-center px-8'>
          <Text className='text-4xl font-extrabold text-white text-center'>MemoHack</Text>
          <Text className='text-lg text-white/80 text-center mt-4'>
            MemoHack is the one stop solution for your JEE NEET preparation.
          </Text>

          <View className='w-full mt-8'>
            <Link href="/(auth)/signin" asChild>
              <TouchableOpacity className='w-full rounded-full py-4 bg-indigo-600'>
                  <Text className='text-white text-center text-lg font-bold'>Sign In</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity className='w-full rounded-full py-4 mt-4 bg-white/20 border border-white/30'>
                  <Text className='text-white text-center text-lg font-bold'>Sign Up</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home')} className='w-full rounded-full py-4 mt-4 bg-white/10'>
                <Text className='text-white/80 text-center text-base font-medium'>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}