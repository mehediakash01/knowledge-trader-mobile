import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useCreateBarterRequestMutation } from '../../redux/api/tradeApi';
import { showToast } from '../../redux/features/ui/uiSlice';

export default function TradeRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [proposal, setProposal] = useState('');
  // In a real app, you'd fetch the user's active skills and let them pick one.
  const [offeredPostId, setOfferedPostId] = useState(''); 
  
  const [createBarter, { isLoading }] = useCreateBarterRequestMutation();

  const handleSubmit = async () => {
    if (!proposal.trim()) {
      dispatch(showToast({ message: 'Please enter a proposal message.', type: 'warning' }));
      return;
    }

    try {
      await createBarter({
        targetPostId: id as string,
        proposal,
        offeredPostId: offeredPostId || undefined,
      }).unwrap();
      
      dispatch(showToast({ message: 'Your trade request has been sent!', type: 'success' }));
      router.push('/(tabs)');
    } catch (error: any) {
      console.error('Failed to create trade request:', error);
      dispatch(showToast({ message: error?.data?.message || 'Failed to send request. Please try again.', type: 'error' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Propose a Trade</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Explain why this is a fair trade and what you bring to the table.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Your Proposal</Text>
          <TextInput
            style={styles.textArea}
            placeholder="I can offer 2 hours of React Native coaching in exchange for your backend expertise..."
            placeholderTextColor="#888888"
            value={proposal}
            onChangeText={setProposal}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Offer a specific skill (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Listing ID to link it..."
            placeholderTextColor="#888888"
            value={offeredPostId}
            onChangeText={setOfferedPostId}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.buttonText}>Send Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  cancelText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    flex: 1,
    gap: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: -8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 120,
  },
  button: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
