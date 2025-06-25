import { LinearGradient } from 'expo-linear-gradient'
import { Search } from 'lucide-react-native'
import React from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

const subjects = [
    {
        name: 'Physics',
        image: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884469/projects/blue-molecular-sphere-reveals-futuristic-genetic-research-data-generated-by-ai_patqst.jpg',
    },
    {
        name: 'Biology',
        image: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750884633/projects/14_agexsk.jpg',
    },
]

export default function HomeScreen() {
  return (
    <View className='flex-1 bg-slate-50'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 32 }}>
            <View className='px-6 pt-12'>
                {/* Header */}
                <View className='flex-row justify-between items-center'>
                    <View>
                        <Text className='text-lg text-slate-600'>Hello Guest</Text>
                        <Text className='text-3xl font-bold text-slate-900'>Find your course</Text>
                    </View>
                    <TouchableOpacity className='bg-white p-3 rounded-full shadow-md'>
                        <Search size={24} />
                    </TouchableOpacity>
                </View>

                {/* Banner */}
                <View className='mt-8 rounded-2xl overflow-hidden'>
                    <LinearGradient colors={['#4F46E5', '#818CF8']} className='p-6 flex-row items-center justify-between'>
                        <View className='flex-1'>
                            <Text className='text-3xl font-bold text-white'>60% off</Text>
                            <Text className='text-sm text-white/80 mt-1'>Feb 14 - Mar 20</Text>
                            <TouchableOpacity className='bg-yellow-400 w-28 py-2 rounded-full mt-4'>
                                <Text className='text-center font-bold text-slate-900'>Join Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Image source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750885008/projects/20944363-Photoroom_exvbcp.png' }} className='w-48 h-48' resizeMode='contain' />
                    </LinearGradient>
                </View>

                {/* Subjects */}
                <View className='mt-8 flex-row justify-between items-center'>
                    <Text className='text-2xl font-bold text-slate-900'>Subject</Text>
                </View>

                <View className='mt-4 flex-row flex-wrap justify-between'>
                    {subjects.map((subject, index) => (
                        <TouchableOpacity key={index} className='bg-white rounded-2xl p-4 w-[48%] mb-4 shadow-sm'>
                            <Image source={{ uri: subject.image }} className='w-full h-24 rounded-lg' resizeMode='cover'/>
                            <Text className='text-lg font-bold text-slate-900 mt-2 text-center'>{subject.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    </View>
  )
}