import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetMeQuery } from '../../redux/api/authApi';
import { useGetWalletBalanceQuery } from '../../redux/api/walletApi';

// Mock data fallback structure for the details page if not connected to a live query
const MOCK_DATA = {
  title: 'Advanced Options Trading Strategy',
  category: 'Finance',
  creator: {
    name: 'Alex Trader',
    image: '',
  },
  description: 'Learn the exact options trading framework I use to navigate volatile markets safely while maximizing potential upside. Complete with risk management rules and real trade breakdowns.',
  tokenPrice: 50,
  metrics: {
    feedbackScore: '4.9/5',
    sentiment: 'Highly Positive',
    students: 128,
  },
  aiAudit: {
    pros: ['Excellent risk management', 'Clear real-world examples'],
    cons: ['Requires basic options knowledge', 'Pacing is fast'],
  },
  modules: [
    { title: 'Module 1: Market Fundamentals', duration: '15m' },
    { title: 'Module 2: The Iron Condor Setup', duration: '22m' },
    { title: 'Module 3: Risk Mitigation', duration: '18m' },
  ]
};

export default function SkillDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const { data: user } = useGetMeQuery();
  const { data: walletBalance } = useGetWalletBalanceQuery(undefined);
  const activeTokenBalance = walletBalance || user?.tokenBalance || 0;

  // Fallback to MOCK_DATA for the dynamic UI demonstration
  const skill = { ...MOCK_DATA, thumbnail: 'https://via.placeholder.com/800x400' };
  
  const canUnlock = activeTokenBalance >= skill.tokenPrice;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Navigation / Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Bazaar</Text>
        </TouchableOpacity>

        {/* Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{skill.category}</Text>
          </View>
          <Text style={styles.title}>{skill.title}</Text>
          
          {skill.thumbnail && !thumbnailError && (
            <Image 
              source={{ uri: skill.thumbnail }} 
              style={styles.thumbnailImage} 
              onError={() => setThumbnailError(true)}
            />
          )}
          
          <View style={styles.creatorMeta}>
            {skill.creator.image && !imageError ? (
              <Image 
                source={{ uri: skill.creator.image }} 
                style={styles.avatarImage} 
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <Text style={styles.creatorName}>By {skill.creator.name}</Text>
          </View>
          
          <Text style={styles.description}>{skill.description}</Text>
        </View>

        {/* Inline Metric Card (Sidebar Equivalent on Web) */}
        <View style={styles.actionCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Access Price</Text>
            <Text style={styles.priceValue}>{skill.tokenPrice} KT</Text>
          </View>
          <Text style={styles.balanceText}>Your Balance: {activeTokenBalance} KT</Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, (!canUnlock || hasUnlocked) && styles.primaryButtonDisabled]}
            onPress={() => canUnlock && setHasUnlocked(true)}
            disabled={!canUnlock || hasUnlocked}
          >
            <Text style={styles.primaryButtonText}>
              {hasUnlocked ? "Vault Unlocked" : "Unlock Strategy Vault"}
            </Text>
          </TouchableOpacity>
          
          {!hasUnlocked && !canUnlock && (
            <Text style={styles.insufficientAlert}>
              Insufficient Tokens. You need {skill.tokenPrice - activeTokenBalance} more tokens to unlock this vault.
            </Text>
          )}
          
          {!hasUnlocked && canUnlock && <Text style={styles.secureText}>🔒 Secure AI-Verified Transaction</Text>}

          {!hasUnlocked && (
            <TouchableOpacity 
              style={styles.barterButton}
              onPress={() => router.push(`/chat/${id}` as any)}
            >
              <Text style={styles.barterButtonText}>🤝 Propose Barter Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Learner Proof & AI Audit */}
        <View style={styles.auditSection}>
          <Text style={styles.sectionTitle}>Learner Proof & AI Audit</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Rating</Text>
              <Text style={styles.metricValue}>{skill.metrics.feedbackScore}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Sentiment</Text>
              <Text style={styles.metricValue}>{skill.metrics.sentiment}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Students</Text>
              <Text style={styles.metricValue}>{skill.metrics.students}</Text>
            </View>
          </View>
          
          <View style={styles.prosConsContainer}>
            <View style={[styles.auditCard, styles.prosCard]}>
              <Text style={styles.auditCardTitle}>✅ Pros</Text>
              {skill.aiAudit.pros.map((pro, index) => (
                <Text key={index} style={styles.auditItem}>• {pro}</Text>
              ))}
            </View>
            <View style={[styles.auditCard, styles.consCard]}>
              <Text style={styles.auditCardTitle}>⚠️ Cons</Text>
              {skill.aiAudit.cons.map((con, index) => (
                <Text key={index} style={styles.auditItem}>• {con}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Curriculum & Locked Vault */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Strategy Vault</Text>
          
          <View style={styles.vaultContainer}>
            {skill.modules.map((mod, index) => (
              <View key={index} style={styles.moduleItem}>
                <View style={styles.moduleIconPlaceholder} />
                <View style={styles.moduleTextContainer}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleDuration}>{mod.duration}</Text>
                </View>
              </View>
            ))}

            {!hasUnlocked && (
              <View style={styles.lockedOverlay}>
                <View style={styles.lockIconContainer}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                </View>
                <Text style={styles.lockedTitle}>Strategy Vault Locked</Text>
                <Text style={styles.lockedSubText}>Unlock to access the full curriculum and resources.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeContainer: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 16,
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  creatorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    marginRight: 10,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  balanceText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  insufficientAlert: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  secureText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  barterButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  barterButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  auditSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  prosConsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  auditCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  prosCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  consCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  auditCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  auditItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  curriculumSection: {
    marginBottom: 20,
  },
  vaultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  moduleIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    marginRight: 12,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  moduleDuration: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockEmoji: {
    fontSize: 24,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  lockedSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
