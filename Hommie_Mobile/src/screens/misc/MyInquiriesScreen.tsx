import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScreenHeader } from '../../components/ui';
import { businessInquiryApi } from '../../services/api';
import { BusinessInquiry, InquiryStatus } from '../../services/types/business.types';

interface MyInquiriesScreenProps {
  navigation?: any;
}

export default function MyInquiriesScreen({ navigation }: MyInquiriesScreenProps) {
  const [inquiries, setInquiries] = useState<BusinessInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | 'all'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<BusinessInquiry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, [selectedStatus]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await businessInquiryApi.getMyInquiries({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'DESC' as const,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });

      setInquiries(response.inquiries);
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
      console.error('Error loading inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInquiries();
    setRefreshing(false);
  }, [selectedStatus]);

  const handleInquiryPress = (inquiry: BusinessInquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailModal(true);
  };

  const handleCloseInquiry = async (inquiry: BusinessInquiry) => {
    Alert.alert(
      'Close Inquiry',
      'Are you sure you want to close this inquiry? You can no longer receive responses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Inquiry',
          style: 'destructive',
          onPress: async () => {
            try {
              await businessInquiryApi.updateInquiryStatus(inquiry.id, InquiryStatus.CLOSED);
              Alert.alert('Success', 'Inquiry has been closed');
              setShowDetailModal(false);
              await loadInquiries();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to close inquiry');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case InquiryStatus.PENDING:
        return '#FFC107';
      case InquiryStatus.IN_PROGRESS:
        return '#0066CC';
      case InquiryStatus.RESPONDED:
        return '#00A651';
      case InquiryStatus.CLOSED:
        return '#8E8E8E';
      default:
        return '#8E8E8E';
    }
  };

  const getStatusIcon = (status: InquiryStatus) => {
    switch (status) {
      case InquiryStatus.PENDING:
        return 'clock-outline';
      case InquiryStatus.IN_PROGRESS:
        return 'progress-clock';
      case InquiryStatus.RESPONDED:
        return 'check-circle';
      case InquiryStatus.CLOSED:
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatLabel = (value: string) => {
    return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getInquiryCounts = () => {
    return {
      all: inquiries.length,
      pending: inquiries.filter(i => i.status === InquiryStatus.PENDING).length,
      inProgress: inquiries.filter(i => i.status === InquiryStatus.IN_PROGRESS).length,
      responded: inquiries.filter(i => i.status === InquiryStatus.RESPONDED).length,
      closed: inquiries.filter(i => i.status === InquiryStatus.CLOSED).length,
    };
  };

  const renderInquiryCard = (inquiry: BusinessInquiry) => {
    const hasResponse = inquiry.response && inquiry.respondedAt;

    return (
      <TouchableOpacity
        key={inquiry.id}
        style={styles.inquiryCard}
        onPress={() => handleInquiryPress(inquiry)}
      >
        <View style={styles.inquiryHeader}>
          <View style={styles.inquiryHeaderLeft}>
            <View style={styles.businessIcon}>
              <MaterialCommunityIcons name="store" size={24} color="#00A651" />
            </View>
            <View style={styles.inquiryHeaderText}>
              <Text style={styles.businessName}>Business Inquiry</Text>
              <Text style={styles.inquiryDate}>
                Sent {new Date(inquiry.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inquiry.status) + '20' }]}>
            <MaterialCommunityIcons
              name={getStatusIcon(inquiry.status) as any}
              size={14}
              color={getStatusColor(inquiry.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(inquiry.status) }]}>
              {formatLabel(inquiry.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.inquirySubject}>{inquiry.subject}</Text>
        <Text style={styles.inquiryMessage} numberOfLines={2}>
          {inquiry.message}
        </Text>

        {hasResponse && (
          <View style={styles.responsePreview}>
            <MaterialCommunityIcons name="reply" size={16} color="#00A651" />
            <Text style={styles.responsePreviewText} numberOfLines={1}>
              {inquiry.response}
            </Text>
          </View>
        )}

        <View style={styles.inquiryFooter}>
          <Text style={styles.footerText}>
            {hasResponse
              ? `Responded ${new Date(inquiry.respondedAt!).toLocaleDateString()}`
              : 'Awaiting response'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
        </View>
      </TouchableOpacity>
    );
  };

  const counts = getInquiryCounts();

  if (loading && inquiries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Inquiries" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading inquiries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && inquiries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Inquiries" navigation={navigation} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInquiries}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Inquiries" navigation={navigation} />

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'all' && styles.filterTabTextActive]}>
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === InquiryStatus.PENDING && styles.filterTabActive]}
            onPress={() => setSelectedStatus(InquiryStatus.PENDING)}
          >
            <Text style={[styles.filterTabText, selectedStatus === InquiryStatus.PENDING && styles.filterTabTextActive]}>
              Pending ({counts.pending})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === InquiryStatus.IN_PROGRESS && styles.filterTabActive]}
            onPress={() => setSelectedStatus(InquiryStatus.IN_PROGRESS)}
          >
            <Text style={[styles.filterTabText, selectedStatus === InquiryStatus.IN_PROGRESS && styles.filterTabTextActive]}>
              In Progress ({counts.inProgress})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === InquiryStatus.RESPONDED && styles.filterTabActive]}
            onPress={() => setSelectedStatus(InquiryStatus.RESPONDED)}
          >
            <Text style={[styles.filterTabText, selectedStatus === InquiryStatus.RESPONDED && styles.filterTabTextActive]}>
              Responded ({counts.responded})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === InquiryStatus.CLOSED && styles.filterTabActive]}
            onPress={() => setSelectedStatus(InquiryStatus.CLOSED)}
          >
            <Text style={[styles.filterTabText, selectedStatus === InquiryStatus.CLOSED && styles.filterTabTextActive]}>
              Closed ({counts.closed})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Inquiries List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {inquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="email-outline" size={64} color="#8E8E8E" />
            <Text style={styles.emptyTitle}>No Inquiries</Text>
            <Text style={styles.emptyMessage}>
              {selectedStatus === 'all'
                ? "You haven't sent any inquiries yet"
                : `No ${formatLabel(selectedStatus)} inquiries`}
            </Text>
          </View>
        ) : (
          inquiries.map(renderInquiryCard)
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedInquiry && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inquiry Details</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInquiry.status) + '20' }]}>
                  <MaterialCommunityIcons
                    name={getStatusIcon(selectedInquiry.status) as any}
                    size={16}
                    color={getStatusColor(selectedInquiry.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedInquiry.status) }]}>
                    {formatLabel(selectedInquiry.status)}
                  </Text>
                </View>

                <Text style={styles.modalSectionTitle}>Your Inquiry</Text>
                <Text style={styles.modalSubject}>{selectedInquiry.subject}</Text>
                <Text style={styles.modalMessage}>{selectedInquiry.message}</Text>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailItem}>
                    <MaterialCommunityIcons name="calendar" size={18} color="#8E8E8E" />
                    <Text style={styles.modalDetailText}>
                      Sent on {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {selectedInquiry.phone && (
                    <View style={styles.modalDetailItem}>
                      <MaterialCommunityIcons name="phone" size={18} color="#8E8E8E" />
                      <Text style={styles.modalDetailText}>{selectedInquiry.phone}</Text>
                    </View>
                  )}
                  {selectedInquiry.email && (
                    <View style={styles.modalDetailItem}>
                      <MaterialCommunityIcons name="email" size={18} color="#8E8E8E" />
                      <Text style={styles.modalDetailText}>{selectedInquiry.email}</Text>
                    </View>
                  )}
                </View>

                {selectedInquiry.response && selectedInquiry.respondedAt && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseSectionTitle}>Business Response</Text>
                    <Text style={styles.responseText}>{selectedInquiry.response}</Text>
                    <Text style={styles.responseDate}>
                      Received on {new Date(selectedInquiry.respondedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                {selectedInquiry.status !== InquiryStatus.CLOSED && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => handleCloseInquiry(selectedInquiry)}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Close Inquiry</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#00A651',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  inquiryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inquiryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  inquiryDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inquirySubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  inquiryMessage: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 12,
  },
  responsePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FFF9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    gap: 8,
  },
  responsePreviewText: {
    fontSize: 14,
    color: '#00A651',
    flex: 1,
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  modalBody: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalDetails: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#2C2C2C',
  },
  responseSection: {
    backgroundColor: '#F9FFF9',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  responseSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 8,
  },
  responseDate: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#00A651',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
