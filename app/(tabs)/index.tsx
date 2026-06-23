import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetAllSkillPostsQuery, useGetCategoriesQuery } from '../../redux/api/feedApi';
import { useGetMeQuery } from '../../redux/api/authApi';
import { useListUsersQuery, useListBazaarPostsQuery, useUpdateUserMutation, useModeratePostMutation } from '../../redux/api/adminApi';
import EmptyState from '../../components/ui/EmptyState';
import type { ISkillPost, IUser } from '../../types';

const BAZAAR_MAX_PRICE = 5000;
const BAZAAR_DEFAULT_LIMIT = 10;
const DEFAULT_CATEGORIES = ["Development", "Design", "Business", "Marketing", "Data", "AI"];

export default function FeedScreen() {
  const router = useRouter();
  const { data: user } = useGetMeQuery();
  const isAdmin = user?.role === 'ADMIN';

  // Admin state
  const [adminTab, setAdminTab] = useState<'USERS' | 'POSTS'>('USERS');
  const { data: adminUsers, isLoading: loadingUsers, refetch: refetchUsers, isFetching: fetchingUsers } = useListUsersQuery(undefined, { skip: !isAdmin });
  const { data: adminPosts, isLoading: loadingPosts, refetch: refetchPosts, isFetching: fetchingPosts } = useListBazaarPostsQuery(undefined, { skip: !isAdmin });
  const [updateUser] = useUpdateUserMutation();
  const [moderatePost] = useModeratePostMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(BAZAAR_MAX_PRICE);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = useMemo(() => ({
    searchTerm: debouncedSearch || undefined,
    category: categories.length ? categories.join(",") : undefined,
    minPrice,
    maxPrice,
    page,
    limit: BAZAAR_DEFAULT_LIMIT,
  }), [debouncedSearch, categories, minPrice, maxPrice, page]);

  const { data, isLoading, isFetching, refetch } = useGetAllSkillPostsQuery(queryParams);
  const { data: categoryData } = useGetCategoriesQuery();

  const activeCategories = categoryData?.length ? categoryData : DEFAULT_CATEGORIES;

  const handlePageChange = (newPage: number) => setPage(newPage);

  const toggleCategory = (category: string) => {
    setCategories((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]);
    setPage(1);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setCategories([]);
    setMinPrice(0);
    setMaxPrice(BAZAAR_MAX_PRICE);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((data?.meta?.total ?? 0) / BAZAAR_DEFAULT_LIMIT));

  const renderItem = ({ item }: { item: ISkillPost }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/skills/${item._id || item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
      </View>
      
      {item.thumbnail ? (
        <Image 
          source={{ uri: item.thumbnail }} 
          style={styles.feedThumbnail} 
          onError={(e) => {
            // handle error if needed
          }}
        />
      ) : null}
      
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      
      {item.description && (
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.creatorInfo}>
          {item.creator?.image || item.creator?.avatar ? (
            <Image 
              source={{ uri: item.creator.image || item.creator.avatar }} 
              style={styles.avatarImage} 
              defaultSource={require('../../assets/images/favicon.png')} // Or simply a View fallback if defaultSource isn't enough, but React Native Image supports onError.
              onError={(e) => {
                // To properly handle broken link without state, we can rely on standard RN fallback or just styling.
              }}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <Text style={styles.userInfo}>{item.creator?.name || 'Anonymous'}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{item.tokenPrice} KT</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>View Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Skill Bazaar</Text>
        <TouchableOpacity
          style={styles.matchmakerBtn}
          onPress={() => router.push('/matchmaker' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.matchmakerBtnText}> 🧠 AI Match</Text>
        </TouchableOpacity>
      </View>

      {/* â”€â”€ Inline Admin Panel (ADMIN role only) â”€â”€ */}
      {isAdmin && (
        <View style={styles.adminPanel}>
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle}>ðŸ›¡ï¸ System Management</Text>
          </View>
          <View style={styles.adminTabs}>
            <TouchableOpacity
              style={[styles.adminTab, adminTab === 'USERS' && styles.adminTabActive]}
              onPress={() => setAdminTab('USERS')}
            >
              <Text style={[styles.adminTabText, adminTab === 'USERS' && styles.adminTabTextActive]}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminTab, adminTab === 'POSTS' && styles.adminTabActive]}
              onPress={() => setAdminTab('POSTS')}
            >
              <Text style={[styles.adminTabText, adminTab === 'POSTS' && styles.adminTabTextActive]}>Bazaar Posts</Text>
            </TouchableOpacity>
          </View>

          {adminTab === 'USERS' ? (
            loadingUsers ? (
              <ActivityIndicator color="#3B82F6" style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={adminUsers?.data || []}
                keyExtractor={(item) => item.id}
                horizontal={false}
                style={styles.adminList}
                scrollEnabled={false}
                refreshControl={<RefreshControl refreshing={fetchingUsers} onRefresh={refetchUsers} tintColor="#3B82F6" />}
                ListEmptyComponent={<Text style={styles.adminEmpty}>No users found.</Text>}
                renderItem={({ item }: { item: IUser }) => (
                  <View style={styles.adminCard}>
                    <View style={styles.adminCardRow}>
                      <Text style={styles.adminCardTitle} numberOfLines={1}>{item.name || 'Unknown'}</Text>
                      <View style={[
                        styles.adminBadge,
                        item.status === 'BANNED' ? styles.badgeRed
                          : item.status === 'SUSPENDED' ? styles.badgeYellow
                          : styles.badgeGreen
                      ]}>
                        <Text style={styles.adminBadgeText}>{item.status || 'ACTIVE'}</Text>
                      </View>
                    </View>
                    <Text style={styles.adminCardSub}>{item.email || 'â€”'} Â· {item.role} Â· {item.tokenBalance ?? 0} KT</Text>
                    <View style={styles.adminActions}>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnGreen]} onPress={() => updateUser({ userId: item.id, status: 'ACTIVE' })}>
                        <Text style={styles.adminBtnText}>Active</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnYellow]} onPress={() => updateUser({ userId: item.id, status: 'SUSPENDED' })}>
                        <Text style={styles.adminBtnText}>Suspend</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnRed]} onPress={() => updateUser({ userId: item.id, status: 'BANNED' })}>
                        <Text style={styles.adminBtnText}>Ban</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          ) : (
            loadingPosts ? (
              <ActivityIndicator color="#3B82F6" style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={adminPosts?.data || []}
                keyExtractor={(item) => item.id}
                style={styles.adminList}
                scrollEnabled={false}
                refreshControl={<RefreshControl refreshing={fetchingPosts} onRefresh={refetchPosts} tintColor="#3B82F6" />}
                ListEmptyComponent={<Text style={styles.adminEmpty}>No posts found.</Text>}
                renderItem={({ item }: { item: ISkillPost }) => (
                  <View style={styles.adminCard}>
                    <View style={styles.adminCardRow}>
                      <Text style={styles.adminCardTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={[
                        styles.adminBadge,
                        item.status === 'REJECTED' ? styles.badgeRed
                          : item.status === 'FLAGGED' ? styles.badgeYellow
                          : styles.badgeGreen
                      ]}>
                        <Text style={styles.adminBadgeText}>{item.status || 'PENDING'}</Text>
                      </View>
                    </View>
                    <Text style={styles.adminCardSub}>By: {item.creator?.name || 'â€”'} Â· {item.category} Â· {item.tokenPrice ?? 0} KT</Text>
                    <View style={styles.adminActions}>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnGreen]} onPress={() => moderatePost({ postId: item.id, action: 'APPROVE' })}>
                        <Text style={styles.adminBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnYellow]} onPress={() => moderatePost({ postId: item.id, action: 'FLAG' })}>
                        <Text style={styles.adminBtnText}>Flag</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adminBtn, styles.btnRed]} onPress={() => moderatePost({ postId: item.id, action: 'REJECT' })}>
                        <Text style={styles.adminBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          )}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity 
          style={styles.filterToggleBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>Filters {categories.length > 0 ? `(${categories.length})` : ''}</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Filters */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {activeCategories.map((cat) => {
              const isSelected = categories.includes(cat);
              return (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.priceRow}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.filterTitle}>Min Price</Text>
              <TextInput 
                style={styles.priceInput}
                keyboardType="numeric"
                value={minPrice.toString()}
                onChangeText={(val) => setMinPrice(Number(val) || 0)}
              />
            </View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.filterTitle}>Max Price</Text>
              <TextInput 
                style={styles.priceInput}
                keyboardType="numeric"
                value={maxPrice.toString()}
                onChangeText={(val) => setMaxPrice(Number(val) || BAZAAR_MAX_PRICE)}
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearAll}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Listing Content */}
      <View style={styles.listWrapper}>
        {isLoading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color="#2563EB" size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.data || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor="#2563EB"
              />
            }
            ListEmptyComponent={
              <EmptyState 
                icon="ðŸ”"
                title="No results found"
                subtitle="Try adjusting your filters or search terms."
              />
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity 
                    disabled={page === 1}
                    style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                    onPress={() => handlePageChange(page - 1)}
                  >
                     <Text style={styles.pageBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageText}>Page {page} of {totalPages}</Text>
                  <TouchableOpacity 
                    disabled={page === totalPages}
                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                    onPress={() => handlePageChange(page + 1)}
                  >
                     <Text style={styles.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/skills/create' as any)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // slate-50
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A', // slate-900
    letterSpacing: -0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', // slate-200
  },
  matchmakerBtn: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)', // cyan-400 tint
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchmakerBtnText: {
    color: '#22D3EE', // cyan-400
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9', // slate-100
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterToggleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterToggleText: {
    color: '#22D3EE',
    fontWeight: '600',
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTitle: {
    color: '#64748B', // slate-500
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: '#22D3EE',
  },
  categoryPillText: {
    color: '#64748B', // slate-500
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    color: '#0F172A',
    paddingHorizontal: 12,
    height: 40,
  },
  clearFiltersBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#F87171', // red-400
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#22D3EE', // cyan-400 accent
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  feedThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A', // slate-900
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: '#64748B', // slate-500
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  avatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  userInfo: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceContainer: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  price: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#22D3EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  pageText: {
    color: '#64748B',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22D3EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  // â”€â”€ Admin Panel Styles â”€â”€
  adminPanel: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  adminHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  adminTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adminTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  adminTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#22D3EE',
  },
  adminTabText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  adminTabTextActive: {
    color: '#22D3EE',
  },
  adminList: {
    maxHeight: 420,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminCardTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  adminCardSub: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
  },
  adminBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adminBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
  },
  adminBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  adminEmpty: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.2)' },
  badgeYellow: { backgroundColor: 'rgba(245,158,11,0.2)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.2)' },
  btnGreen: { backgroundColor: '#059669' },
  btnYellow: { backgroundColor: '#D97706' },
  btnRed: { backgroundColor: '#DC2626' },
});

