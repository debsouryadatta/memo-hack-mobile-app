import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function LandingScreen() {
  const router = useRouter();
  
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
            source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750876111/projects/8848682-removebg-preview_y6w1fz.png' }}
            className='w-[400px] h-[400px]'
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
                  <Text className='text-white text-center text-lg font-bold'>Sign in with OTP</Text>
              </TouchableOpacity>
            </Link>
              <TouchableOpacity onPress={() => router.push('/(tabs)')} className='w-full rounded-full py-4 mt-4 bg-white/20'>
                  <Text className='text-white text-center text-lg font-bold'>Guest</Text>
              </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}