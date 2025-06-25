import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignInScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    const handleSendOtp = () => {
        if (phoneNumber.length !== 10) {
            Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
            return;
        }
        // Mock sending OTP
        setIsOtpSent(true);
        Alert.alert('OTP Sent', `An OTP has been sent to ${phoneNumber}`);
    }

    const handleSignIn = () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
            return;
        }
        // Mock OTP verification
        console.log('Signing in with:', phoneNumber, otp);
        Alert.alert('Success', 'You have been signed in successfully!');
        router.replace('/(tabs)'); // Navigate to home screen after sign in
    }

  return (
    <View className='flex-1'>
      <LinearGradient
        colors={['#4F46E5', '#818CF8']}
        className='absolute top-0 left-0 right-0 bottom-0'
      />
      <View className="flex-1 justify-center items-center">
        {/* Image Container */}
        <View className="absolute top-16 w-full h-1/3 justify-center items-center">
          <Image
            source={{ uri: 'https://res.cloudinary.com/diyxwdtjd/image/upload/v1750880675/projects/8848692-removebg-preview_c63mem.png' }}
            className='w-[300px] h-[300px]'
            resizeMode='contain'
          />
        </View>

        {/* Form Container */}
        <View className='w-full items-center px-8' style={{top: 100}}>
          <Text className='text-4xl font-extrabold text-white text-center mb-8'>Sign In</Text>

          {!isOtpSent ? (
            <>
                <TextInput
                    className='w-full bg-white/20 text-white rounded-full px-6 py-4 text-lg text-center'
                    placeholder="Enter your phone number"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                />
                <TouchableOpacity className='w-full rounded-full py-4 bg-indigo-600 mt-4' onPress={handleSendOtp}>
                    <Text className='text-white text-center text-lg font-bold'>Send OTP</Text>
                </TouchableOpacity>
            </>
          ) : (
            <>
                <TextInput
                    className='w-full bg-white/20 text-white rounded-full px-6 py-4 text-lg text-center'
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                />
                <TouchableOpacity className='w-full rounded-full py-4 mt-4' onPress={handleSignIn}>
                    <LinearGradient
                        colors={['#FF8C00', '#FFA500']}
                        className='absolute top-0 bottom-0 left-0 right-0 rounded-full'
                    />
                    <Text className='text-white text-center text-lg font-bold'>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity className='w-full py-4 mt-2' onPress={() => setIsOtpSent(false)}>
                    <Text className='text-white/80 text-center text-base'>Entered wrong number?</Text>
                </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
