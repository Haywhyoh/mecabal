import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface SafetyContribution {
  id: string;
  type: 'incident_report' | 'security_tip' | 'emergency_response' | 'patrol_volunteer' | 'safety_meeting';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'verified';
  pointsEarned: number;
  timestamp: string;
  impact: number; // Number of neighbors affected/helped
  location?: string;
  followUpRequired?: boolean;
}

interface SafetyContributionTrackerProps {
  userId?: string;
  compactMode?: boolean;
  maxDisplay?: number;
}

const SAFETY_TYPES = {
  incident_report: { name: 'Incident Report', icon: 'alert-circle', color: '#E74C3C' },
  security_tip: { name: 'Security Tip', icon: 'lightbulb', color: '#FFC107' },
  emergency_response: { name: 'Emergency Response', icon: 'medical-bag', color: '#E74C3C' },
  patrol_volunteer: { name: 'Patrol Volunteer', icon: 'walk', color: '#0066CC' },
  safety_meeting: { name: 'Safety Meeting', icon: 'account-group', color: '#00A651' }
};

const SEVERITY_COLORS = {
  low: '#00A651',
  medium: '#FFC107',
  high: '#FF6B35',
  critical: '#E74C3C'
};

export default function SafetyContributionTracker({ 
  userId = 'default',
  compactMode = false,
  maxDisplay = 5 
}: SafetyContributionTrackerProps) {
  // Mock data
  const [safetyContributions] = useState<SafetyContribution[]>([
    {
      id: '1',
      type: 'incident_report',
      title: 'Suspicious Activity Near Gate 2',
      description: 'Reported unknown individuals attempting to gain access',
      severity: 'high',
      status: 'investigating',
      pointsEarned: 25,
      timestamp: '2 hours ago',
      impact: 45,
      location: 'Main Gate Area',
      followUpRequired: true
    },
    {
      id: '2',
      type: 'security_tip',
      title: 'Generator Security Reminder',
      description: 'Shared tips on securing generators during power outages',
      severity: 'medium',
      status: 'verified',
      pointsEarned: 15,
      timestamp: '1 day ago',
      impact: 23
    },
    {
      id: '3',
      type: 'patrol_volunteer',
      title: 'Night Patrol Volunteer',
      description: 'Volunteered for 3-hour night patrol shift',
      severity: 'medium',
      status: 'resolved',
      pointsEarned: 40,
      timestamp: '3 days ago',
      impact: 120
    }
  ]);

  const getSafetyStats = () => ({
    totalContributions: safetyContributions.length,
    totalPoints: safetyContributions.reduce((sum, contrib) => sum + contrib.pointsEarned, 0),
    peopleHelped: safetyContributions.reduce((sum, contrib) => sum + contrib.impact, 0),
    criticalReports: safetyContributions.filter(c => c.severity === 'critical' || c.severity === 'high').length,
    safetyRating: 4.8 // Mock safety rating
  });

  const renderContributionItem = (contribution: SafetyContribution) => {
    const safetyType = SAFETY_TYPES[contribution.type];
    const severityColor = SEVERITY_COLORS[contribution.severity];
    
    return (
      <View key={contribution.id} style={styles.contributionItem}>
        <View style={[styles.contributionIcon, { backgroundColor: safetyType.color + '20' }]}>
          <MaterialCommunityIcons name={safetyType.icon as any} size={20} color={safetyType.color} />
        </View>
        <View style={styles.contributionDetails}>
          <Text style={styles.contributionTitle}>{contribution.title}</Text>
          <Text style={styles.contributionDesc} numberOfLines={2}>{contribution.description}</Text>
          <View style={styles.contributionMeta}>
            <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {contribution.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.contributionTime}>{contribution.timestamp}</Text>
          </View>
          <View style={styles.contributionStats}>
            <Text style={styles.impactText}>{contribution.impact} neighbors helped</Text>
            <Text style={styles.pointsEarned}>+{contribution.pointsEarned} pts</Text>
          </View>
        </View>
        <View style={styles.statusIndicator}>
          <MaterialCommunityIcons 
            name={
              contribution.status === 'resolved' ? 'check-circle' :
              contribution.status === 'investigating' ? 'clock' :
              contribution.status === 'verified' ? 'shield-check' : 'circle'
            } 
            size={16} 
            color={
              contribution.status === 'resolved' ? '#00A651' :
              contribution.status === 'investigating' ? '#FFC107' :
              contribution.status === 'verified' ? '#0066CC' : '#8E8E8E'
            } 
          />
        </View>
      </View>
    );
  };

  if (compactMode) {
    const stats = getSafetyStats();
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons name="shield-star" size={20} color="#E74C3C" />
          <Text style={styles.compactTitle}>Safety Contributions</Text>
        </View>
        <View style={styles.compactStats}>
          <View style={styles.compactStat}>
            <Text style={styles.compactNumber}>{stats.totalContributions}</Text>
            <Text style={styles.compactLabel}>Reports</Text>
          </View>
          <View style={styles.compactStat}>
            <Text style={styles.compactNumber}>{stats.safetyRating}</Text>
            <Text style={styles.compactLabel}>Rating</Text>
          </View>
        </View>
      </View>
    );
  }

  const stats = getSafetyStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <MaterialCommunityIcons name="shield-star" size={24} color="#E74C3C" />
          <Text style={styles.title}>Safety Contributions</Text>
        </View>
        <TouchableOpacity style={styles.reportButton}>
          <MaterialCommunityIcons name="alert-plus" size={16} color="#FFFFFF" />
          <Text style={styles.reportButtonText}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.totalContributions}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.peopleHelped}</Text>
          <Text style={styles.statLabel}>People Helped</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.safetyRating}</Text>
          <Text style={styles.statLabel}>Safety Rating</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent Contributions</Text>
        {safetyContributions.slice(0, maxDisplay).map(renderContributionItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactStat: {
    alignItems: 'center',
  },
  compactNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
  },
  compactLabel: {
    fontSize: 11,
    color: '#8E8E8E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  stat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E74C3C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  contributionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contributionDetails: {
    flex: 1,
  },
  contributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  contributionDesc: {
    fontSize: 12,
    color: '#8E8E8E',
    lineHeight: 16,
    marginBottom: 6,
  },
  contributionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  contributionTime: {
    fontSize: 11,
    color: '#8E8E8E',
  },
  contributionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactText: {
    fontSize: 11,
    color: '#00A651',
  },
  pointsEarned: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  statusIndicator: {
    marginLeft: 8,
    paddingTop: 4,
  },
});