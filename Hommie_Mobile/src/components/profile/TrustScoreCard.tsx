import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrustScore } from '../contexts/ProfileContext';

const { width } = Dimensions.get('window');

interface TrustScoreCardProps {
  trustScore: TrustScore | null;
  loading?: boolean;
  onPress?: () => void;
  showBreakdown?: boolean;
  compact?: boolean;
}

export default function TrustScoreCard({
  trustScore,
  loading = false,
  onPress,
  showBreakdown = true,
  compact = false,
}: TrustScoreCardProps) {
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={24} color="#8E8E8E" />
          <Text style={styles.loadingText}>Loading trust score...</Text>
        </View>
      </View>
    );
  }

  if (!trustScore) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#E74C3C" />
          <Text style={styles.errorText}>Unable to load trust score</Text>
        </View>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00A651';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FF5722';
    return '#E74C3C';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return ['#00A651', '#4CAF50'];
    if (score >= 60) return ['#FF9800', '#FFC107'];
    if (score >= 40) return ['#FF5722', '#FF7043'];
    return ['#E74C3C', '#EF5350'];
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'excellent':
        return 'star';
      case 'very good':
        return 'shield-check';
      case 'good':
        return 'check-circle';
      case 'fair':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const scoreColor = getScoreColor(trustScore.score);
  const gradientColors = getScoreGradient(trustScore.score);
  const levelIcon = getLevelIcon(trustScore.level);

  const progressPercentage = (trustScore.score / 100) * 100;

  const TrustScoreContent = () => {
    if (compact) {
      return (
        <View style={[styles.container, styles.containerCompact]}>
          <View style={styles.compactRow}>
            {/* Left: Large circular score */}
            <LinearGradient
              colors={gradientColors}
              style={styles.compactScoreCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.scoreCircleInner}>
                <MaterialCommunityIcons name={levelIcon} size={40} color="#FFFFFF" />
                <Text style={styles.compactScoreText}>{trustScore.score}</Text>
              </View>
            </LinearGradient>

            {/* Right: Score info */}
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Trust Score</Text>
              <Text style={[styles.compactLevel, { color: scoreColor }]}>
                {trustScore.level}
              </Text>
              <Text style={styles.compactNextLevel}>
                {trustScore.pointsToNextLevel} points to {trustScore.nextLevel}
              </Text>
            </View>

            {/* Arrow indicator */}
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#8E8E8E"
            />
          </View>

          {/* Tap hint */}
          <Text style={styles.tapHint}>Tap to view breakdown</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#2C2C2C" />
            <Text style={styles.title}>Trust Score</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: scoreColor }]}>{trustScore.score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>

        {/* Score Display with Gradient */}
        <View style={styles.scoreDisplay}>
          <LinearGradient
            colors={gradientColors}
            style={styles.scoreCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.scoreCircleInner}>
              <MaterialCommunityIcons name={levelIcon} size={32} color="#FFFFFF" />
              <Text style={styles.scoreCircleText}>{trustScore.score}</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.levelContainer}>
            <Text style={[styles.level, { color: scoreColor }]}>{trustScore.level}</Text>
            <Text style={styles.nextLevel}>
              Next: {trustScore.nextLevel} ({trustScore.pointsToNextLevel} points)
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={gradientColors}
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}% Complete</Text>
        </View>

        {/* Breakdown */}
        {showBreakdown && (
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="phone-check" size={16} color="#00A651" />
              <Text style={styles.breakdownLabel}>Phone Verification</Text>
              <Text style={styles.breakdownValue}>{trustScore.breakdown.phoneVerification} pts</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="card-account-details" size={16} color="#2196F3" />
              <Text style={styles.breakdownLabel}>Identity Verification</Text>
              <Text style={styles.breakdownValue}>{trustScore.breakdown.identityVerification} pts</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#FF9800" />
              <Text style={styles.breakdownLabel}>Address Verification</Text>
              <Text style={styles.breakdownValue}>{trustScore.breakdown.addressVerification} pts</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="account-heart" size={16} color="#9C27B0" />
              <Text style={styles.breakdownLabel}>Community Endorsements</Text>
              <Text style={styles.breakdownValue}>{trustScore.breakdown.endorsements} pts</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="trending-up" size={16} color="#607D8B" />
              <Text style={styles.breakdownLabel}>Activity Level</Text>
              <Text style={styles.breakdownValue}>{trustScore.breakdown.activityLevel} pts</Text>
            </View>
          </View>
        )}

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(trustScore.lastUpdated).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <TrustScoreContent />
      </TouchableOpacity>
    );
  }

  return <TrustScoreContent />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  containerCompact: {
    padding: 16,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 16,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreCircleInner: {
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  levelContainer: {
    flex: 1,
  },
  level: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  nextLevel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Compact mode styles
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  compactScoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E8E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactLevel: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  compactNextLevel: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  tapHint: {
    fontSize: 12,
    color: '#00A651',
    textAlign: 'center',
    fontWeight: '500',
  },
});
