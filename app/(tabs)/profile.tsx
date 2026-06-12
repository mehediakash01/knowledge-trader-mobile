import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../../redux/api/authApi';
import { useGetMySkillsQuery } from '../../redux/api/feedApi';
import { clearAuthStorage } from '../../services/auth.service';
import { logout } from '../../redux/features/auth/authSlice';
import type { ISkillPost } from '../../types';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery();
  const { data: mySkillsData, isLoading: isLoadingSkills, refetch, isFetching } = useGetMySkillsQuery(user?.id as string, {
    skip: !user?.id,
  });

  const handleLogout = async () => {
    await clearAuthStorage();
    dispatch(logout());
    router.replace('/login');
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

  if (isLoadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ade80" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.profileHeader}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Balance / Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={styles.statValue}>{user?.ktBalance || 0} KT</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Reputation</Text>
          <Text style={styles.statValue}>{user?.reputationScore || 0}</Text>
        </View>
      </View>

      {/* My Listings */}
      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>My Active Listings</Text>
        {isLoadingSkills ? (
          <ActivityIndicator color="#4ade80" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={mySkillsData?.data || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onRefresh={refetch}
            refreshing={isFetching}
            ListEmptyComponent={
              <Text style={styles.emptyText}>You haven't posted any skills yet.</Text>
            }
          />
        )}
      </View>
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
    backgroundColor: '#121212',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#4ade80',
    fontSize: 24,
    fontWeight: '900',
  },
  listingsSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  price: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  emptyText: {
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
