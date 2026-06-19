import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, Modal, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../../redux/api/authApi';
import { useGetMySkillsQuery } from '../../redux/api/feedApi';
import { useGetTransactionHistoryQuery, usePurchaseTokensMutation, useGetWalletBalanceQuery } from '../../redux/api/walletApi';
import { clearAuthStorage } from '../../services/auth.service';
import { logout } from '../../redux/features/auth/authSlice';
import { showToast } from '../../redux/features/ui/uiSlice';
import EmptyState from '../../components/ui/EmptyState';
import type { ISkillPost } from '../../types';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery();
  const { data: walletBalance } = useGetWalletBalanceQuery(undefined);
  const { data: mySkillsData, isLoading: isLoadingSkills, refetch, isFetching } = useGetMySkillsQuery(user?.id as string, {
    skip: !user?.id,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactionHistoryQuery(undefined, {
    skip: !isWalletOpen,
  });
  
  const [purchaseTokens, { isLoading: isPurchasing }] = usePurchaseTokensMutation();

  const handleLogout = async () => {
    await clearAuthStorage();
    dispatch(logout());
    router.replace('/login');
  };

  const handlePurchase = async () => {
    try {
      await purchaseTokens({ amount: 100 }).unwrap();
      dispatch(showToast({ message: 'Tokens purchased successfully!', type: 'success' }));
    } catch (e: any) {
      dispatch(showToast({ message: 'Failed to purchase tokens.', type: 'error' }));
    }
  };

  const renderItem = ({ item }: { item: ISkillPost }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/listings/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.price}>{item.tokenPrice} KT</Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.txLeft}>
        <View style={[styles.txIconContainer, item.type === 'CREDIT' ? styles.txCreditIcon : styles.txDebitIcon]}>
          <Text style={styles.txIconText}>{item.type === 'CREDIT' ? '↓' : '↑'}</Text>
        </View>
        <View>
          <Text style={styles.txDesc}>{item.description || 'Token Transfer'}</Text>
          <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.txAmount, item.type === 'CREDIT' ? styles.txCreditText : styles.txDebitText]}>
        {item.type === 'CREDIT' ? '+' : '-'}{item.amount} KT
      </Text>
    </View>
  );

  const [imageError, setImageError] = useState(false);

  if (isLoadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        {user?.image && !imageError ? (
          <Image 
            source={{ uri: user.image }} 
            style={styles.avatar} 
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'Knowledge Trader'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email provided'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/profile/settings' as any)}>
            <Text style={styles.editProfileText}>⚙️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={[styles.statBox, styles.walletBox]} onPress={() => setIsWalletOpen(true)}>
          <Text style={styles.statLabel}>Token Wallet</Text>
          <Text style={styles.statValue}>{walletBalance || user?.tokenBalance || 0} KT</Text>
          <Text style={styles.walletHint}>Tap to view details</Text>
        </TouchableOpacity>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Reputation</Text>
          <Text style={styles.statValue}>{user?.reputationScore || 0}</Text>
        </View>
      </View>

      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>My Active Listings</Text>
        {isLoadingSkills ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={mySkillsData?.data || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onRefresh={refetch}
            refreshing={isFetching}
            ListEmptyComponent={
              <EmptyState icon="📝" title="No Active Listings" subtitle="You haven't posted any skills yet." />
            }
          />
        )}
      </View>

      <Modal visible={isWalletOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Token Wallet</Text>
              <TouchableOpacity onPress={() => setIsWalletOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.walletHero}>
              <Text style={styles.walletHeroLabel}>Current Balance</Text>
              <Text style={styles.walletHeroValue}>{walletBalance || user?.tokenBalance || 0} <Text style={styles.walletHeroCurrency}>KT</Text></Text>
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePurchase} disabled={isPurchasing}>
                {isPurchasing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnPrimaryText}>Buy Tokens</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Text style={styles.actionBtnSecondaryText}>Exchange</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.txSectionTitle}>Recent Transactions</Text>
            {isLoadingTransactions ? (
              <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={transactions || []}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={renderTransaction}
                contentContainerStyle={styles.txList}
                ListEmptyComponent={
                  <EmptyState icon="💸" title="No Transactions" subtitle="Your transaction history is empty." />
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#E5E7EB' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  avatarText: { color: '#6B7280', fontSize: 24, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  logoutButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  headerActions: { gap: 8, alignItems: 'flex-end' },
  editProfileBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  editProfileText: { color: '#111827', fontWeight: 'bold', fontSize: 12 },
  statsContainer: { flexDirection: 'row', padding: 24, gap: 16 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  walletBox: { borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.02)' },
  walletHint: { fontSize: 10, color: '#2563EB', marginTop: 6, opacity: 0.8 },
  statLabel: { color: '#4B5563', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  statValue: { color: '#111827', fontSize: 24, fontWeight: '900' },
  listingsSection: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  listContent: { paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  category: { color: '#2563EB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#6B7280', fontSize: 10, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  price: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  closeButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#111827', fontSize: 16, fontWeight: 'bold' },
  walletHero: { alignItems: 'center', backgroundColor: '#F9FAFB', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  walletHeroLabel: { color: '#4B5563', fontSize: 14, marginBottom: 8, textTransform: 'uppercase', fontWeight: '700' },
  walletHeroValue: { color: '#2563EB', fontSize: 48, fontWeight: '900' },
  walletHeroCurrency: { fontSize: 24, color: '#6B7280', fontWeight: 'normal' },
  walletActions: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  actionBtnPrimary: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  actionBtnSecondary: { flex: 1, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnSecondaryText: { color: '#111827', fontSize: 16, fontWeight: 'bold' },
  txSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  txList: { paddingBottom: 40 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txCreditIcon: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  txDebitIcon: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  txIconText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  txDesc: { color: '#111827', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  txDate: { color: '#6B7280', fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  txCreditText: { color: '#10B981' },
  txDebitText: { color: '#EF4444' },
});
