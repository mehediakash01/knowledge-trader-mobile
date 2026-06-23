import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Gradient Canvas */}
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        className="flex-1 pt-24 px-8"
      >
        <SafeAreaView>
          <Text className="text-white text-5xl font-black tracking-tight leading-[56px] mt-8">
            Knowledge{'\n'}Trader
          </Text>
          <Text className="text-[#00C2E0] text-lg font-medium mt-4 tracking-wider">
            Welcome back
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Sliding White Overlap Card */}
      <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-12 absolute bottom-0 w-full shadow-lg">
        <View className="gap-4">
          <TouchableOpacity 
            className="bg-[#0D3A60] rounded-full py-4 items-center"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-lg">LOGIN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-transparent border border-[#0D3A60] rounded-full py-4 items-center"
            onPress={() => router.push('/signup')}
          >
            <Text className="text-[#0D3A60] font-bold text-lg">SIGN IN</Text>
          </TouchableOpacity>
        </View>

        {/* Social Auth Footer */}
        <View className="mt-12 items-center">
          <Text className="text-gray-400 text-xs tracking-widest uppercase mb-6 font-medium">
            Login with Social Media
          </Text>
          <View className="flex-row gap-6">
            <TouchableOpacity className="w-12 h-12 rounded-full border border-gray-200 items-center justify-center">
              <Text className="text-gray-600 font-bold text-lg">G</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 rounded-full border border-gray-200 items-center justify-center">
              <Text className="text-gray-600 font-bold text-sm">Git</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 rounded-full border border-gray-200 items-center justify-center">
              <Text className="text-gray-600 font-bold text-xl"></Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
