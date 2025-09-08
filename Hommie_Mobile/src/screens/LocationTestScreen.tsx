import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants';
import { MeCabalLocation } from '../services';

export default function LocationTestScreen({ navigation }: any) {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, result: any, success: boolean) => {
    setTestResults(prev => [...prev, {
      test,
      result: JSON.stringify(result, null, 2),
      success,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const result = await MeCabalLocation.getCurrentLocation();
      addResult('getCurrentLocation', result, result.success);
      
      if (result.success && result.data) {
        Alert.alert(
          'Location Retrieved!',
          `Lat: ${result.data.latitude}\nLng: ${result.data.longitude}\nAccuracy: ${result.data.accuracy}m\nAddress: ${result.data.address || 'N/A'}`
        );
      } else {
        Alert.alert('Location Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      addResult('getCurrentLocation', { error: error.message }, false);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testVerifyLocation = async () => {
    setIsLoading(true);
    try {
      // Test with comprehensive Nigerian locations using new neighborhood system
      const testCoordinates = [
        // === ESTATES (Should verify with high confidence) ===
        { name: 'Ikeja GRA (estate)', lat: 6.605, lng: 3.355 },
        { name: 'Victoria Island (estate)', lat: 6.430, lng: 3.415 },
        { name: 'Lekki Phase 1 (estate)', lat: 6.450, lng: 3.505 },
        
        // === TRADITIONAL AREAS (Should now verify!) ===
        { name: 'Surulere (traditional area)', lat: 6.495, lng: 3.348 },
        { name: 'Yaba (traditional area)', lat: 6.515, lng: 3.378 },
        { name: 'Ikeja main (traditional area)', lat: 6.595, lng: 3.337 },
        { name: 'Mushin (traditional area)', lat: 6.527, lng: 3.347 },
        
        // === ROAD-BASED AREAS (Should now verify!) ===
        { name: 'Allen Avenue Area (road-based)', lat: 6.588, lng: 3.367 },
        { name: 'Opebi Area (road-based)', lat: 6.595, lng: 3.352 },
        
        // === LANDMARK-BASED AREAS (Should now verify!) ===
        { name: 'Computer Village Area (landmark-based)', lat: 6.600, lng: 3.348 },
        { name: 'UNILAG Area (landmark-based)', lat: 6.515, lng: 3.397 },
        
        // === TRANSPORT & MARKET AREAS (Should now verify!) ===
        { name: 'Ojota Area (transport hub)', lat: 6.573, lng: 3.384 },
        { name: 'Alaba Market Area (market-based)', lat: 6.447, lng: 3.180 },
        
        // === EDGE CASES ===
        { name: 'Random location (should suggest nearby)', lat: 6.500, lng: 3.300 },
        { name: 'Far from any area (should fail gracefully)', lat: 6.000, lng: 3.000 },
      ];

      for (const coord of testCoordinates) {
        const result = await MeCabalLocation.verifyLocation(
          'test-user',
          coord.lat,
          coord.lng,
          'Test address'
        );
        addResult(`verifyLocation - ${coord.name}`, result, result.verified);
      }
      
      Alert.alert('Verification Tests Complete', 'Check results below');
    } catch (error) {
      addResult('verifyLocation', { error: error.message }, false);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testDiscoverLandmarks = async () => {
    setIsLoading(true);
    try {
      // Test with Lagos coordinates
      const result = await MeCabalLocation.discoverNearbyLandmarks(6.6, 3.35, 5, 10);
      addResult('discoverNearbyLandmarks', result, result.success);
      
      if (result.success && result.landmarks) {
        Alert.alert(
          'Landmarks Found!',
          `Found ${result.landmarks.length} landmarks:\n${result.landmarks.map(l => `• ${l.name} (${l.distance}km)`).join('\n')}`
        );
      } else {
        Alert.alert('Landmarks Test Failed', result.error || 'No landmarks found');
      }
    } catch (error) {
      addResult('discoverNearbyLandmarks', { error: error.message }, false);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testLandmarkVerification = async () => {
    setIsLoading(true);
    try {
      const landmarks = [
        'Ikeja City Mall',
        'Lagos University',
        'Random Landmark'
      ];

      for (const landmark of landmarks) {
        const result = await MeCabalLocation.verifyLandmarkLocation(
          'test-user',
          landmark,
          'Shopping Center'
        );
        addResult(`verifyLandmarkLocation - ${landmark}`, result, result.verified);
      }
      
      Alert.alert('Landmark Tests Complete', 'Check results below');
    } catch (error) {
      addResult('verifyLandmarkLocation', { error: error.message }, false);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    clearResults();
    Alert.alert(
      'Run All Tests?',
      'This will test all location functions. Make sure you have location permissions enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run Tests', onPress: async () => {
          await testVerifyLocation();
          await testDiscoverLandmarks();
          await testLandmarkVerification();
          await testGetCurrentLocation(); // GPS test last as it requires user interaction
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Location Services Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Individual Functions</Text>
          
          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.testButtonDisabled]}
            onPress={testGetCurrentLocation}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test GPS Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.testButtonDisabled]}
            onPress={testVerifyLocation}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Location Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.testButtonDisabled]}
            onPress={testDiscoverLandmarks}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Landmark Discovery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.testButtonDisabled]}
            onPress={testLandmarkVerification}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Landmark Verification</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.testButton, styles.primaryButton, isLoading && styles.testButtonDisabled]}
              onPress={runAllTests}
              disabled={isLoading}
            >
              <Text style={[styles.testButtonText, styles.primaryButtonText]}>Run All Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.clearButton]}
              onPress={clearResults}
            >
              <Text style={[styles.testButtonText, styles.clearButtonText]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results ({testResults.length})</Text>
            
            {testResults.map((result, index) => (
              <View key={index} style={[styles.resultItem, result.success ? styles.successResult : styles.failureResult]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTest}>{result.test}</Text>
                  <Text style={styles.resultTime}>{result.timestamp}</Text>
                </View>
                <ScrollView style={styles.resultContent} nestedScrollEnabled>
                  <Text style={styles.resultText}>{result.result}</Text>
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  testSection: {
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  testButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  clearButton: {
    backgroundColor: COLORS.orange,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  clearButtonText: {
    color: COLORS.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  resultsSection: {
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultItem: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  successResult: {
    backgroundColor: COLORS.lightGreen,
    borderColor: COLORS.primary,
  },
  failureResult: {
    backgroundColor: '#FFE5E5',
    borderColor: COLORS.orange,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultTest: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  resultTime: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  resultContent: {
    maxHeight: 150,
  },
  resultText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});