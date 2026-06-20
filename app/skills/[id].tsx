import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Modal, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../../redux/api/authApi';
import { useGetWalletBalanceQuery } from '../../redux/api/walletApi';
import { useCreateBarterRequestMutation } from '../../redux/api/tradeApi';
import { showToast } from '../../redux/features/ui/uiSlice';
import { useGetSkillPostByIdQuery, useGetMySkillsQuery } from '../../redux/api/feedApi';

export default function SkillDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [imageError, setImageError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [localUnlockState, setLocalUnlockState] = useState(false);
  const [hasLocalPendingBarter, setHasLocalPendingBarter] = useState(false);
  
  const [isBarterModalOpen, setIsBarterModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [barterMessage, setBarterMessage] = useState("");

  const { data: user } = useGetMeQuery();
  const { data: walletBalance } = useGetWalletBalanceQuery(undefined);
  const activeTokenBalance = walletBalance || user?.tokenBalance || 0;

  const { data: mySkillsData, isLoading: isLoadingMySkills } = useGetMySkillsQuery(user?.id as string, {
    skip: !user?.id,
  });
  const [createBarterRequest, { isLoading: isSubmittingBarter }] = useCreateBarterRequestMutation();

  const { data: apiResponse, isLoading: isLoadingPost } = useGetSkillPostByIdQuery(id as string);
  const skillPost = apiResponse as any;

  const currentUserId = user?.id; // In our schema, user ID is often .id
  const postCreatorId = skillPost?.creator?.id || skillPost?.creatorId;
  const isOwner = !!(currentUserId && postCreatorId && currentUserId === postCreatorId);
  const hasUnlocked = skillPost?.isAccessible || localUnlockState;
  const canUnlock = isOwner || hasUnlocked || activeTokenBalance >= (skillPost?.tokenPrice || 0);
  const hasPendingBarter = skillPost?.hasPendingBarter || skillPost?.barterStatus === 'pending' || hasLocalPendingBarter;

  const handleSendBarter = async () => {
    if (!selectedSkillId || !skillPost?.id) return;
    const receiverId = skillPost?.creator?.id;
    if (!receiverId) {
      dispatch(showToast({ message: "Cannot identify skill creator.", type: "error" }));
      return;
    }
    try {
      await createBarterRequest({
        receiverId,
        skillOfferedId: selectedSkillId,
        skillRequestedId: skillPost.id,
      }).unwrap();
      dispatch(showToast({ message: "Barter request sent successfully!", type: "success" }));
      setIsBarterModalOpen(false);
      setBarterMessage("");
      setSelectedSkillId(null);
      setHasLocalPendingBarter(true);
    } catch (err) {
      dispatch(showToast({ message: "Failed to send barter request.", type: "error" }));
    }
  };

  if (isLoadingPost || !skillPost) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

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
            <Text style={styles.badgeText}>{skillPost?.category || 'General'}</Text>
          </View>
          <Text style={styles.title}>{skillPost?.title}</Text>
          
          {skillPost?.thumbnail && !thumbnailError && (
            <Image 
              source={{ uri: skillPost.thumbnail }} 
              style={styles.thumbnailImage} 
              onError={() => setThumbnailError(true)}
            />
          )}
          
          <View style={styles.creatorMeta}>
            {skillPost?.creator?.image && !imageError ? (
              <Image 
                source={{ uri: skillPost.creator.image }} 
                style={styles.avatarImage} 
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <Text style={styles.creatorName}>By {skillPost?.creator?.name || 'Anonymous'}</Text>
          </View>
          
          <Text style={styles.description}>{skillPost?.shortDescription || skillPost?.description || 'No description available.'}</Text>
        </View>

        {/* Inline Metric Card (Sidebar Equivalent on Web) */}
        <View style={styles.actionCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Access Price</Text>
            <Text style={styles.priceValue}>{skillPost?.tokenPrice || 0} KT</Text>
          </View>
          
          {isOwner ? (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>✓ Your Shared Skill</Text>
            </View>
          ) : (
            <>
              <Text style={styles.balanceText}>Your Balance: {activeTokenBalance} KT</Text>
              
              <TouchableOpacity 
                style={[styles.primaryButton, (!canUnlock || hasUnlocked || hasPendingBarter) && styles.primaryButtonDisabled]}
                onPress={() => canUnlock && setLocalUnlockState(true)}
                disabled={!canUnlock || hasUnlocked || hasPendingBarter}
              >
                <Text style={styles.primaryButtonText}>
                  {hasUnlocked ? "Vault Unlocked" : (hasPendingBarter ? "Request Pending" : "Unlock Strategy Vault")}
                </Text>
              </TouchableOpacity>
              
              {!hasUnlocked && !canUnlock && !hasPendingBarter && (
                <Text style={styles.insufficientAlert}>
                  Insufficient Tokens. You need {(skillPost?.tokenPrice || 0) - activeTokenBalance} more tokens to unlock this vault.
                </Text>
              )}
              
              {!hasUnlocked && canUnlock && !hasPendingBarter && <Text style={styles.secureText}>🔒 Secure AI-Verified Transaction</Text>}

              {!hasUnlocked && (
                hasPendingBarter ? (
                  <View style={styles.pendingCard}>
                    <Text style={styles.pendingIcon}>⏳</Text>
                    <Text style={styles.pendingDesc}>Barter request sent. Waiting for the author's response.</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.barterButton}
                    onPress={() => setIsBarterModalOpen(true)}
                  >
                    <Text style={styles.barterButtonText}>🤝 Propose Barter Request</Text>
                  </TouchableOpacity>
                )
              )}
            </>
          )}
        </View>

        {/* Learner Proof & AI Audit */}
        <View style={styles.auditSection}>
          <Text style={styles.sectionTitle}>Learner Proof & AI Audit</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Reviews</Text>
              <Text style={styles.metricValue}>{skillPost?._count?.reviews || 0}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Rating</Text>
              <Text style={styles.metricValue}>N/A</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Questions</Text>
              <Text style={styles.metricValue}>{skillPost?._count?.questions || 0}</Text>
            </View>
          </View>
          
          <View style={styles.prosConsContainer}>
            <View style={[styles.auditCard, styles.prosCard]}>
              <Text style={styles.auditCardTitle}>✅ Value Proposition</Text>
              <Text style={styles.auditItem}>• {skillPost?.valueProp || 'High quality material.'}</Text>
              <Text style={styles.auditItem}>• Detailed real-world examples</Text>
            </View>
            <View style={[styles.auditCard, styles.consCard]}>
              <Text style={styles.auditCardTitle}>⚠️ Target Audience</Text>
              <Text style={styles.auditItem}>• {skillPost?.targetAudience || 'Beginner to Advanced'}</Text>
            </View>
          </View>
        </View>

        {/* Curriculum & Locked Vault */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Strategy Vault</Text>
          
          <View style={styles.vaultContainer}>
            {(skillPost?.outcomes || ['Module 1: Market Fundamentals', 'Module 2: The Iron Condor Setup', 'Module 3: Risk Mitigation']).map((mod: string, index: number) => (
              <View key={index} style={styles.moduleItem}>
                <View style={styles.moduleIconPlaceholder} />
                <View style={styles.moduleTextContainer}>
                  <Text style={styles.moduleTitle}>{mod}</Text>
                </View>
              </View>
            ))}

            {(hasUnlocked || isOwner) && skillPost?.lockedContent?.vaultPdf && (
              <TouchableOpacity 
                style={styles.pdfButton}
                onPress={() => Linking.openURL(skillPost.lockedContent.vaultPdf)}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>📄</Text>
                <Text style={styles.pdfText}>Download Shared Asset (PDF)</Text>
              </TouchableOpacity>
            )}

            {!hasUnlocked && !isOwner && (
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

      {/* Barter Modal */}
      <Modal visible={isBarterModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Propose a Barter</Text>
              <TouchableOpacity onPress={() => setIsBarterModalOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingMySkills ? (
              <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
            ) : mySkillsData?.data?.length === 0 ? (
              <View style={styles.emptySkillsContainer}>
                <Text style={styles.emptySkillsText}>
                  You don't have any skills posted yet to offer for trade. Post a skill to unlock barter requests!
                </Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    setIsBarterModalOpen(false);
                    router.push('/skills/create' as any);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Create a Skill Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.barterScroll}>
                <Text style={styles.modalSubtitle}>Select a Skill to Offer</Text>
                {mySkillsData?.data?.map((mySkill) => {
                  const isValueTooLow = mySkill.tokenPrice < (skillPost?.tokenPrice || 0);
                  const isSelected = selectedSkillId === mySkill.id;
                  
                  return (
                    <TouchableOpacity 
                      key={mySkill.id}
                      style={[
                        styles.barterOption,
                        isSelected && styles.barterOptionSelected,
                        isValueTooLow && styles.barterOptionDisabled
                      ]}
                      disabled={isValueTooLow}
                      onPress={() => setSelectedSkillId(mySkill.id)}
                    >
                      <View style={styles.barterOptionInfo}>
                        <Text style={[styles.barterOptionTitle, isValueTooLow && styles.disabledText]}>
                          {mySkill.title}
                        </Text>
                        <Text style={[styles.barterOptionPrice, isValueTooLow && styles.disabledText]}>
                          Value: {mySkill.tokenPrice} KT
                        </Text>
                      </View>
                      {isValueTooLow ? (
                        <View style={styles.valueWarning}>
                          <Text style={styles.valueWarningText}>Value too low to trade</Text>
                        </View>
                      ) : (
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                
                <Text style={styles.modalSubtitle}>Message (Optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  multiline
                  placeholder="Explain why this is a fair trade..."
                  placeholderTextColor="#9CA3AF"
                  value={barterMessage}
                  onChangeText={setBarterMessage}
                />
                
                <TouchableOpacity 
                  style={[styles.primaryButton, (!selectedSkillId || isSubmittingBarter) && styles.primaryButtonDisabled]}
                  disabled={!selectedSkillId || isSubmittingBarter}
                  onPress={handleSendBarter}
                >
                  {isSubmittingBarter ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>Sending Request...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Trade Request</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  pendingCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  pendingDesc: {
    flex: 1,
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  ownerBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerBadgeText: {
    color: '#374151',
    fontSize: 16,
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
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 16,
    marginBottom: 8,
  },
  pdfText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySkillsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySkillsText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  barterScroll: {
    maxHeight: '100%',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  barterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  barterOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  barterOptionDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  barterOptionInfo: {
    flex: 1,
    marginRight: 12,
  },
  barterOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  barterOptionPrice: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  valueWarning: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  valueWarningText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
    borderWidth: 6,
  },
  messageInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#111827',
    marginBottom: 24,
  },
});
