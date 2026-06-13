import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useGetMyTradesQuery, useUpdateBarterStatusMutation } from '../../redux/api/tradeApi';
import { showToast } from '../../redux/features/ui/uiSlice';
import EmptyState from '../../components/ui/EmptyState';
import type { IBarterRequest } from '../../types';

export default function TradesScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const { data, isLoading, refetch, isFetching } = useGetMyTradesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateBarterStatusMutation();

  const received = data?.receivedBarters || [];
  const sent = data?.sentBarters || [];
  const activeData = activeTab === 'RECEIVED' ? received : sent;

  const handleUpdateStatus = async (barterId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      await updateStatus({ barterId, action }).unwrap();
      dispatch(showToast({ message: `Trade ${action.toLowerCase()}ed successfully.`, type: 'success' }));
    } catch (err: any) {
      console.error('Failed to update status', err);
      dispatch(showToast({ message: err?.data?.message || 'Failed to update trade status.', type: 'error' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '#4ade80';
      case 'DECLINED': return '#ef4444';
      default: return '#fbbf24';
    }
  };

  const renderItem = ({ item }: { item: IBarterRequest }) => {
    const isReceived = activeTab === 'RECEIVED';
    const otherUser = isReceived ? item.sender : item.receiver;
    const proposedSkill = item.skillOffered?.title || 'Custom Proposal';
    const requestedSkill = item.skillRequested?.title || 'Unknown Skill';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{otherUser?.name || 'Anonymous User'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.tradeDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Requested:</Text> {requestedSkill}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Offered:</Text> {proposedSkill}
          </Text>
          {!!item.message && (
            <Text style={styles.messageText}>"{item.message}"</Text>
          )}
        </View>

        {isReceived && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={() => handleUpdateStatus(item.id, 'ACCEPT')}
              disabled={isUpdating}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.declineBtn]} 
              onPress={() => handleUpdateStatus(item.id, 'DECLINE')}
              disabled={isUpdating}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat CTA for accepted trades */}
        {item.status === 'ACCEPTED' && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() =>
              router.push(
                `/chat/${item.id}?partnerName=${encodeURIComponent(otherUser?.name ?? 'Trader')}&skillTitle=${encodeURIComponent(requestedSkill)}` as any,
              )
            }
            activeOpacity={0.8}
          >
            <Text style={styles.chatBtnText}>💬  Open Negotiation Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Trades</Text>

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'RECEIVED' && styles.activeTab]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Text style={[styles.tabText, activeTab === 'RECEIVED' && styles.activeTabText]}>Received ({received.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SENT' && styles.activeTab]}
          onPress={() => setActiveTab('SENT')}
        >
          <Text style={[styles.tabText, activeTab === 'SENT' && styles.activeTabText]}>Sent ({sent.length})</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4ade80" />
        </View>
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#4ade80"
              colors={['#4ade80']}
            />
          }
          ListEmptyComponent={
            <EmptyState 
              icon="🤝"
              title={`No ${activeTab.toLowerCase()} trades found`}
              subtitle="When you offer or receive a trade, it will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4ade80',
  },
  tabText: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tradeDetails: {
    marginBottom: 16,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },
  label: {
    color: '#a0a0a0',
  },
  messageText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#4ade80',
  },
  acceptBtnText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  declineBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  chatBtn: {
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.3)',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#0ea5e9',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
