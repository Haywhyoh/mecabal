import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';

interface AccessCodeDisplayProps {
  code: string;
  label?: string;
}

export const AccessCodeDisplay: React.FC<AccessCodeDisplayProps> = ({
  code,
  label = 'Access Code',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      Clipboard.setString(code);
      setCopied(true);
      Toast.show({
        type: 'success',
        text1: 'Code copied!',
        position: 'bottom',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying code:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to copy code',
        position: 'bottom',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.codeContainer}>
        <Text style={styles.code}>{code}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <MaterialCommunityIcons
            name={copied ? 'check' : 'content-copy'}
            size={20}
            color={copied ? '#00A651' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  code: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00A651',
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    padding: 8,
  },
});

