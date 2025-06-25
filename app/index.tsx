import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function LandingScreen() {
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
            source={{ uri: 'https://ouch-cdn2.icons8.com/En1tOOZQ5p4ePZItYy-YJb25ltvpr5frH5i4Y4-M1DQ/rs:fit:1024:768/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvNzEx/L2VkZDA2Y2YxLWU3/ZTctNDBlOC1iN2Y1/LTgxYjY5Y2EyM2E4/My5wbmc.png' }}
            className='w-[400px] h-[400px]'
            resizeMode='contain'
          />
        </View>

        {/* Text and Buttons Container */}
        <View className='w-full items-center px-8'>
          <Text className='text-4xl font-bold text-white text-center'>Learn anything{'\n'}Anytime anywhere</Text>
          <Text className='text-lg text-white/80 text-center mt-4'>
            Online learning is education that takes place over the Internet.
          </Text>

          <View className='w-full mt-8'>
            <TouchableOpacity className='w-full rounded-full py-4'>
                <LinearGradient
                    colors={['#FF8C00', '#FFA500']}
                    className='absolute top-0 bottom-0 left-0 right-0 rounded-full'
                />
                <Text className='text-white text-center text-lg font-bold'>Sign in with OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity className='w-full rounded-full py-4 mt-4 bg-white/20'>
                <Text className='text-white text-center text-lg font-bold'>Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}