import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetAllSkillPostsQuery, useGetCategoriesQuery } from '../../redux/api/feedApi';
import EmptyState from '../../components/ui/EmptyState';
import type { ISkillPost } from '../../types';

const BAZAAR_MAX_PRICE = 5000;
const BAZAAR_DEFAULT_LIMIT = 10;
const DEFAULT_CATEGORIES = ["Development", "Design", "Business", "Marketing", "Data", "AI"];

export default function FeedScreen() {
  const router = useRouter();

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
          <Text style={styles.matchmakerBtnText}>🧠 AI Match</Text>
        </TouchableOpacity>
      </View>

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
                icon="🔍"
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
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
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
    borderBottomColor: '#E5E7EB',
  },
  matchmakerBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchmakerBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterToggleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterToggleText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryPillText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    color: '#1A1A1A',
    paddingHorizontal: 12,
    height: 40,
  },
  clearFiltersBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#EF4444',
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
    paddingBottom: 100, // Space for FAB
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
  },
  feedThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#666666',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  userInfo: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceContainer: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  pageText: {
    color: '#666666',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
