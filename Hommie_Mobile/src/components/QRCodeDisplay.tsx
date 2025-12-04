import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Share } from 'react-native-share';
// Note: File download functionality requires additional implementation
// import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showShareButton?: boolean;
  showDownloadButton?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  showShareButton = true,
  showDownloadButton = true,
}) => {
  const handleShare = async () => {
    try {
      // For now, share the QR code value as text
      // In a full implementation, you might want to generate an image first
      await Share.open({
        message: `QR Code: ${value}`,
        title: 'Share QR Code',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const handleDownload = async () => {
    // Download functionality requires additional implementation
    // In production, you'd want to convert the QR code SVG to an image format
    // and save it to the device's media library
    alert('Download functionality requires additional implementation');
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={value}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      {(showShareButton || showDownloadButton) && (
        <View style={styles.buttonContainer}>
          {showShareButton && (
            <TouchableOpacity style={styles.button} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#00A651" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          )}
          {showDownloadButton && (
            <TouchableOpacity style={styles.button} onPress={handleDownload}>
              <MaterialCommunityIcons name="download" size={20} color="#00A651" />
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#00A651',
    fontSize: 14,
    fontWeight: '600',
  },
});

