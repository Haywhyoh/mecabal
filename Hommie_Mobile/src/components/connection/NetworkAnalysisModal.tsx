import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NetworkAnalysisModalProps } from '../../types/connectionTypes';

export default function NetworkAnalysisModal({
  visible,
  networkAnalysis,
  targetUserName,
  onClose
}: NetworkAnalysisModalProps) {
  
  if (!networkAnalysis) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Network Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Network Overview */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Network Overview</Text>
            <View style={styles.analysisGrid}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisNumber}>{networkAnalysis.totalMutualConnections}</Text>
                <Text style={styles.analysisLabel}>Mutual Connections</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisNumber}>{networkAnalysis.strongConnections}</Text>
                <Text style={styles.analysisLabel}>Strong Connections</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisNumber}>{networkAnalysis.averageConnectionStrength.toFixed(1)}</Text>
                <Text style={styles.analysisLabel}>Avg. Strength</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisNumber}>{networkAnalysis.trustabilityScore}</Text>
                <Text style={styles.analysisLabel}>Trust Score</Text>
              </View>
            </View>
          </View>

          {/* Network Density */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Network Density</Text>
            <View style={styles.densityCard}>
              <View style={styles.densityIndicator}>
                <View 
                  style={[
                    styles.densityBar, 
                    { width: `${networkAnalysis.sharedNetworkDensity * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.densityText}>
                {(networkAnalysis.sharedNetworkDensity * 100).toFixed(0)}% network overlap
              </Text>
            </View>
            <Text style={styles.densityDescription}>
              You and {targetUserName} share a significant portion of your social networks, 
              indicating strong community ties and potential for trustworthy relationship.
            </Text>
          </View>

          {/* Connection Paths */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Connection Paths</Text>
            {networkAnalysis.connectionPaths.map((path) => (
              <View key={path.id} style={styles.pathCard}>
                <View style={styles.pathHeader}>
                  <MaterialCommunityIcons 
                    name={path.pathType === 'through_mutual' ? 'account-group' : 'community'} 
                    size={16} 
                    color="#0066CC" 
                  />
                  <Text style={styles.pathStrength}>{path.strength}% strength</Text>
                </View>
                <Text style={styles.pathDescription}>{path.description}</Text>
                <View style={styles.pathInterests}>
                  {path.commonInterests.map((interest, idx) => (
                    <View key={idx} style={styles.pathInterestTag}>
                      <Text style={styles.pathInterestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Trust Recommendations */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Trust Recommendations</Text>
            <View style={styles.recommendationCard}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#00A651" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {networkAnalysis.trustabilityScore >= 80 ? 'High Trust Potential' : 
                   networkAnalysis.trustabilityScore >= 60 ? 'Moderate Trust Potential' : 
                   'Build More Connections'}
                </Text>
                <Text style={styles.recommendationText}>
                  {networkAnalysis.trustabilityScore >= 80 ? 
                    `Based on your shared connections and network analysis, ${targetUserName} shows high potential for a trustworthy relationship. Consider upgrading to a trusted connection.` :
                   networkAnalysis.trustabilityScore >= 60 ? 
                    `${targetUserName} has moderate trust indicators. Consider connecting and building the relationship over time.` :
                    `Limited shared connections with ${targetUserName}. Consider building more mutual connections first.`
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Network Insights */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisSectionTitle}>Network Insights</Text>
            <View style={styles.insightsList}>
              {networkAnalysis.sharedNetworkDensity > 0.5 && (
                <View style={styles.insightItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
                  <Text style={styles.insightText}>
                    High network overlap suggests you move in similar social circles
                  </Text>
                </View>
              )}
              
              {networkAnalysis.strongConnections >= 3 && (
                <View style={styles.insightItem}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#0066CC" />
                  <Text style={styles.insightText}>
                    Multiple strong mutual connections indicate community integration
                  </Text>
                </View>
              )}
              
              {networkAnalysis.averageConnectionStrength >= 80 && (
                <View style={styles.insightItem}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.insightText}>
                    High-quality connections suggest similar values and interests
                  </Text>
                </View>
              )}
              
              {networkAnalysis.connectionPaths.length > 2 && (
                <View style={styles.insightItem}>
                  <MaterialCommunityIcons name="source-branch" size={16} color="#7B68EE" />
                  <Text style={styles.insightText}>
                    Multiple connection paths provide redundant trust verification
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  analysisLabel: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: 2,
  },
  densityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  densityIndicator: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginBottom: 8,
  },
  densityBar: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 3,
  },
  densityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  densityDescription: {
    fontSize: 11,
    color: '#8E8E8E',
    lineHeight: 16,
  },
  pathCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pathStrength: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066CC',
  },
  pathDescription: {
    fontSize: 11,
    color: '#2C2C2C',
    marginBottom: 6,
  },
  pathInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pathInterestTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  pathInterestText: {
    fontSize: 9,
    color: '#0066CC',
    fontWeight: '600',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 8,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A651',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 11,
    color: '#2C2C2C',
    lineHeight: 16,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 8,
  },
  insightText: {
    fontSize: 11,
    color: '#2C2C2C',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});