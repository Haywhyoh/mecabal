// Debug AsyncStorage persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function debugStorage() {
  console.log('=== Storage Debug ===');
  const keys = await AsyncStorage.getAllKeys();
  console.log('All keys:', keys);
  
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    console.log(`${key}:`, value ? value.substring(0, 100) : 'null');
  }
  console.log('===================');
}
