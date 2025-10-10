import Toast from 'react-native-toast-message';

export class ToastService {
  static showSuccess(title: string, message?: string) {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  }

  static showError(title: string, message?: string) {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  }

  static showInfo(title: string, message?: string) {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  }

  static showWarning(title: string, message?: string) {
    Toast.show({
      type: 'error', // Using error type for warning since there's no warning type
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3500,
    });
  }
}

