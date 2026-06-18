import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../redux/api/authApi';
import { setAuthTokens, setAuthUser } from '../services/auth.service';
import { showToast } from '../redux/features/ui/uiSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const validate = () => {
    let isValid = true;
    let newErrors = { email: '', password: '' };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const response = await login({ email, password }).unwrap();
      await setAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      await setAuthUser(response.user);
      router.replace('/(tabs)');
      dispatch(showToast({ message: 'Welcome back!', type: 'success' }));
    } catch (err: any) {
      console.error('Login failed:', err);
      dispatch(showToast({ message: err?.data?.message || 'Login failed. Please check your credentials.', type: 'error' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputContainer}>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'email' && styles.inputFocused,
                    !!errors.email && styles.inputError
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setErrors(prev => ({...prev, email: ''})) }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'password' && styles.inputFocused,
                    !!errors.password && styles.inputError
                  ]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrors(prev => ({...prev, password: ''})) }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                />
                {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light grayish background
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    fontWeight: '500',
  },
  inputContainer: {
    gap: 20,
    marginBottom: 36,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 18,
    color: '#111827',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  footerLink: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
});
