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
    <View className="flex-1 bg-[#0D3A60]">
      {/* Upper Gradient Canvas */}
      <LinearGradient
        colors={['#0D3A60', '#00829A']}
        style={{ flex: 0.4 }}
        className="pt-24 px-8 justify-end pb-10"
      >
        <SafeAreaView className=" relative ">
          {/* Back button */}
          <TouchableOpacity
            className="absolute top-12 left-8 z-10"
            onPress={() => router.push('/welcome')}
            activeOpacity={0.7}
          >
            <Text className="text-[#00C2E0] text-xl my-4 font-bold tracking-wider">✕ Back</Text>
          </TouchableOpacity>

          <Text className=" ml-4 text-white text-5xl font-black tracking-tight leading-[58px] mt-24">
           Start Trading Knowledge
          </Text>
             <Text className=" ml-4  text-white text-xl font-black  mt-8">
                     our brain is your greatest asset. Claim your account in less than a minute.
                    </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* White Card — keyboard-aware */}
      <KeyboardAvoidingView
        style={{ flex: 0.6 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 bg-white rounded-t-[45px] px-8 pt-12 pb-10 shadow-2xl">

            {/* Full Name */}
            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Full Name
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="John Doe"
                placeholderTextColor="#CBD5E1"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Email Address
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="you@email.com"
                placeholderTextColor="#CBD5E1"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Password
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="••••••••"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-8">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Confirm Password
              </Text>
              <TextInput
                className="border-b border-slate-200 pb-2 text-slate-800 text-base font-medium"
                placeholder="••••••••"
                placeholderTextColor="#CBD5E1"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Next button */}
            <TouchableOpacity
              className={`bg-[#0D3A60] rounded-full py-4 items-center justify-center shadow-md ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base tracking-widest uppercase">
                  Next
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
