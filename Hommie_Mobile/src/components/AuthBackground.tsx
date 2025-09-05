import React from 'react';
import { View, Image, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';

const { width, height } = Dimensions.get('window');

interface AuthBackgroundProps {
  children: React.ReactNode;
  overlayOpacity?: number;
}

export default function AuthBackground({ children, overlayOpacity = 0.6 }: AuthBackgroundProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../../assets/background.jpeg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]} />
      
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});