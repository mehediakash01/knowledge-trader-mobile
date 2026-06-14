import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateBarterRequestMutation } from '../../redux/api/tradeApi';
import { useGetMySkillsQuery } from '../../redux/api/feedApi';
import { useAssessTradeValueMutation } from '../../redux/api/aiApi';
import { showToast } from '../../redux/features/ui/uiSlice';

export default function TradeRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [proposal, setProposal] = useState('');
  const [offeredPostId, setOfferedPostId] = useState(''); 
  
  const { user } = useSelector((state: any) => state.auth);
  const { data: mySkills } = useGetMySkillsQuery(user?.id || '', { skip: !user?.id });
  const [assessTrade, { data: tradeValuation, isLoading: isAssessing }] = useAssessTradeValueMutation();
  const [createBarter, { isLoading }] = useCreateBarterRequestMutation();

  const handleSelectSkill = async (skillId: string) => {
    setOfferedPostId(skillId);
    if (skillId) {
      try {
        await assessTrade({ offeredPostId: skillId, targetPostId: id as string }).unwrap();
      } catch (e) {
        console.error(e);
      }
    }
  };

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsScroll}>
            <TouchableOpacity 
               style={[styles.skillCard, !offeredPostId && styles.skillCardActive]}
               onPress={() => handleSelectSkill('')}
            >
               <Text style={styles.skillCardText}>None</Text>
            </TouchableOpacity>
            {mySkills?.data?.map(skill => (
              <TouchableOpacity 
                 key={skill.id}
                 style={[styles.skillCard, offeredPostId === skill.id && styles.skillCardActive]}
                 onPress={() => handleSelectSkill(skill.id)}
              >
                 <Text style={styles.skillCardText}>{skill.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {offeredPostId ? (isAssessing ? (
            <ActivityIndicator color="#0ea5e9" />
          ) : tradeValuation ? (
            <View style={[styles.valuationBadge, tradeValuation.isBalanced ? styles.balancedBadge : styles.warningBadge]}>
              <Text style={tradeValuation.isBalanced ? styles.balancedText : styles.warningText}>
                {tradeValuation.isBalanced ? '✓ AI Verdict: Balanced Trade (Equal Worth)' : `⚠ AI Warning: ${tradeValuation.message}`}
              </Text>
            </View>
          ) : null) : null}
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
  skillsScroll: { flexDirection: 'row', paddingVertical: 8, maxHeight: 60 },
  skillCard: { 
    backgroundColor: '#1e1e1e', 
    borderWidth: 1, borderColor: '#333', 
    borderRadius: 8, padding: 12, marginRight: 8,
    minWidth: 80, alignItems: 'center', justifyContent: 'center'
  },
  skillCardActive: { borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)' },
  skillCardText: { color: '#fff', fontSize: 14 },
  valuationBadge: { padding: 12, borderRadius: 8, marginTop: 8 },
  balancedBadge: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderWidth: 1, borderColor: '#4ade80' },
  warningBadge: { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderWidth: 1, borderColor: '#f87171' },
  balancedText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold' },
  warningText: { color: '#f87171', fontSize: 12, fontWeight: 'bold' },
});
