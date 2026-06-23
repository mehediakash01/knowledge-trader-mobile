import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegisterMutation } from '../redux/api/authApi';
import { showToast } from '../redux/features/ui/uiSlice';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const router = useRouter();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || password !== confirmPassword) {
      dispatch(showToast({ message: 'Please fill all fields correctly', type: 'error' }));
      return;
    }
    
    try {
      await register({ name, email, password }).unwrap();
      router.replace('/login');
      dispatch(showToast({ message: 'Account created successfully! Please log in.', type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err?.data?.message || 'Registration failed', type: 'error' }));
    }
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        className="flex-[0.4] pt-16 px-8"
      >
        <SafeAreaView className="flex-1 relative">
          <TouchableOpacity 
            className="absolute top-2 right-0 z-10"
            onPress={() => router.push('/welcome')}
          >
            <Text className="text-[#00C2E0] text-sm font-semibold tracking-wide">✕ Back</Text>
          </TouchableOpacity>
          
          <Text className="text-white text-5xl font-black tracking-tight leading-[56px] mt-8">
            Hello{'\n'}Create account!
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        className="flex-[0.7] bg-transparent absolute bottom-0 w-full"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} 
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl min-h-[480px]">
            <View className="gap-6 mb-8">
              <TextInput
                className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />

              <TextInput
                className="border-b border-slate-200 py-3 text-slate-800 text-lg font-medium"
                placeholder="Confirm Password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
            </View>

            <TouchableOpacity 
              className={`bg-[#0D3A60] rounded-full py-4 items-center mt-2 shadow-lg shadow-slate-400 ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-lg tracking-wide">Next</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
