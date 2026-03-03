import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Check if we're running on native platform
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

// Android-də Firebase (google-services.json) qurulmayanda PushNotifications.register()
// native tərəfdə crash verə bilir. Default olaraq Android push auto-register söndürülür.
// Firebase hazır olanda lokal build zamanı bunu aktiv edin:
//   VITE_ANDROID_PUSH_AUTO_REGISTER=true
const androidPushAutoRegister = (import.meta.env as any).VITE_ANDROID_PUSH_AUTO_REGISTER === 'true';

// Haptic Feedback
export const hapticFeedback = {
  light: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  medium: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  heavy: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },
  vibrate: async () => {
    if (isNative) {
      await Haptics.vibrate();
    }
  }
};

// Status Bar
export const statusBar = {
  setLight: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Light });
    }
  },
  setDark: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Dark });
    }
  },
  hide: async () => {
    if (isNative) {
      await StatusBar.hide();
    }
  },
  show: async () => {
    if (isNative) {
      await StatusBar.show();
    }
  }
};

// Push Notifications - uses @capacitor-firebase/messaging for proper FCM tokens on iOS & Android
export const pushNotifications = {
  register: async () => {
    if (!isNative) return;

    if (isAndroid && !androidPushAutoRegister) {
      console.warn(
        'Android push auto-register deaktivdir (Firebase qurulmayıb ola bilər). ' +
          'Aktiv etmək üçün: VITE_ANDROID_PUSH_AUTO_REGISTER=true'
      );
      return;
    }

    try {
      // Try Firebase Messaging first (returns proper FCM token on both platforms)
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      
      let permStatus = await FirebaseMessaging.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await FirebaseMessaging.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      const tokenResult = await FirebaseMessaging.getToken();
      console.log('Firebase Messaging token obtained:', tokenResult.token.substring(0, 30) + '...');
    } catch (error) {
      console.warn('Firebase Messaging not available, falling back to Capacitor PushNotifications:', error);
      
      // Fallback to @capacitor/push-notifications
      try {
        const { PushNotifications: CapPush } = await import('@capacitor/push-notifications');
        
        let permStatus = await CapPush.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await CapPush.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }
        await CapPush.register();
      } catch (fallbackError) {
        console.error('Push notification registration failed:', fallbackError);
      }
    }
  },

  addListeners: () => {
    if (!isNative) return;

    // Try Firebase Messaging listeners first
    import('@capacitor-firebase/messaging').then(({ FirebaseMessaging }) => {
      FirebaseMessaging.addListener('tokenReceived', token => {
        console.log('Firebase Messaging token refreshed:', token.token.substring(0, 30) + '...');
      });

      FirebaseMessaging.addListener('notificationReceived', notification => {
        console.log('Push notification received:', notification);
      });

      FirebaseMessaging.addListener('notificationActionPerformed', action => {
        console.log('Push notification action performed:', action);
      });
    }).catch(() => {
      // Fallback to capacitor push listeners
      import('@capacitor/push-notifications').then(({ PushNotifications: CapPush }) => {
        CapPush.addListener('registration', token => {
          console.log('Push registration success, token: ' + token.value);
        });

        CapPush.addListener('registrationError', err => {
          console.error('Registration error: ', err.error);
        });

        CapPush.addListener('pushNotificationReceived', notification => {
          console.log('Push notification received: ', notification);
        });

        CapPush.addListener('pushNotificationActionPerformed', notification => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });
      });
    });
  }
};

// Local Notifications
export const localNotifications = {
  checkPermissions: async () => {
    if (!isNative) return { display: 'granted' };
    return await LocalNotifications.checkPermissions();
  },

  requestPermissions: async () => {
    if (!isNative) return { display: 'granted' };
    return await LocalNotifications.requestPermissions();
  },

  schedule: async (notifications: {
    id: number;
    title: string;
    body: string;
    schedule?: { at: Date };
  }[]) => {
    if (!isNative) {
      console.log('Local notification scheduled (web mode):', notifications);
      return;
    }

    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') {
      console.log('Local notification permission not granted');
      return;
    }

    await LocalNotifications.schedule({
      notifications: notifications.map(n => ({
        ...n,
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: null
      }))
    });
  },

  // Schedule water reminder
  scheduleWaterReminder: async () => {
    const now = new Date();
    const reminders = [];
    
    // Schedule reminders every 2 hours from 8am to 8pm
    for (let hour = 8; hour <= 20; hour += 2) {
      const reminderTime = new Date(now);
      reminderTime.setHours(hour, 0, 0, 0);
      
      if (reminderTime > now) {
        reminders.push({
          id: 100 + hour,
          title: 'Su içmək vaxtı! 💧',
          body: 'Sağlamlığınız üçün su içməyi unutmayın.',
          schedule: { at: reminderTime }
        });
      }
    }

    if (reminders.length > 0) {
      await localNotifications.schedule(reminders);
    }
  },

  // Schedule pill reminder
  schedulePillReminder: async (time: Date) => {
    await localNotifications.schedule([{
      id: 200,
      title: 'Vitamin vaxtı! 💊',
      body: 'Gündəlik vitaminlərinizi qəbul etməyi unutmayın.',
      schedule: { at: time }
    }]);
  },

  // Schedule appointment reminder
  scheduleAppointmentReminder: async (appointmentDate: Date, title: string) => {
    const reminderTime = new Date(appointmentDate);
    reminderTime.setDate(reminderTime.getDate() - 1);
    reminderTime.setHours(10, 0, 0, 0);

    await localNotifications.schedule([{
      id: 300,
      title: 'Sabah randevunuz var! 📅',
      body: title,
      schedule: { at: reminderTime }
    }]);
  },

  cancelAll: async () => {
    if (!isNative) return;
    
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }
  }
};

// Native Share
export const nativeShare = async (data: { title?: string; text?: string; url?: string }) => {
  // Check if native share is available
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed:', error);
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    const textToCopy = data.text || data.url || '';
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    }
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NATIVE IMAGE DOWNLOAD - Saves images to Photos app on iOS/Android
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Downloads an image and saves it to the device's photo gallery
 * On iOS: Opens share sheet for "Save to Photos" action
 * On Android: Saves to Pictures folder (visible in Gallery)
 * On Web: Falls back to browser download
 */
export const saveImageToGallery = async (imageUrl: string, fileName?: string): Promise<boolean> => {
  const finalFileName = fileName || `anacan-photo-${Date.now()}.jpg`;
  
  // Web fallback
  if (!isNative) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Web download failed:', error);
      return false;
    }
  }

  try {
    console.log('Starting native image download:', imageUrl);
    
    // Fetch the image as blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    if (isIOS) {
      // iOS: Save to Documents then trigger share sheet for saving to Photos
      try {
        // First save to Documents directory
        const writeResult = await Filesystem.writeFile({
          path: finalFileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        console.log('iOS: File saved to Documents:', writeResult.uri);
        
        // Now read it back as a blob for sharing
        const readResult = await Filesystem.readFile({
          path: finalFileName,
          directory: Directory.Documents,
        });
        
        // Convert base64 back to blob for sharing
        const byteCharacters = atob(readResult.data as string);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const shareBlob = new Blob([byteArray], { type: 'image/jpeg' });
        const file = new File([shareBlob], finalFileName, { type: 'image/jpeg' });
        
        // Open share sheet - user can "Save Image" from here
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Şəkli yadda saxla',
          });
          console.log('iOS: Share sheet opened successfully');
        } else {
          console.log('iOS: Sharing files not supported, file saved to Documents');
        }
        
        return true;
      } catch (iosError) {
        console.error('iOS save error:', iosError);
        // Last resort: just save to Documents
        try {
          await Filesystem.writeFile({
            path: finalFileName,
            data: base64Data,
            directory: Directory.Documents,
          });
          return true;
        } catch {
          return false;
        }
      }
    } else if (isAndroid) {
      // Android: Save to Downloads/Pictures - this will be visible in Gallery
      try {
        // Try saving to external storage first (Pictures folder)
        const result = await Filesystem.writeFile({
          path: `Pictures/${finalFileName}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
        });
        console.log('Android: File saved to Pictures:', result.uri);
        return true;
      } catch (extError) {
        console.log('External storage failed, trying Documents:', extError);
        // Fallback to Documents
        const result = await Filesystem.writeFile({
          path: finalFileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        console.log('Android: File saved to Documents:', result.uri);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Native image save failed:', error);
    
    // Final fallback: Try cache directory
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await Filesystem.writeFile({
        path: finalFileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      console.log('Fallback: File saved to cache');
      return true;
    } catch (fallbackError) {
      console.error('All save attempts failed:', fallbackError);
      return false;
    }
  }
};

// Initialize native features
export const initializeNativeFeatures = async () => {
  if (!isNative) {
    console.log('Running in web mode - native features disabled');
    return;
  }

  console.log('Initializing native features...');
  
  // Set status bar style
  await statusBar.setDark();
  
  // Hide splash screen as soon as app is ready
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }
  
  // Register for push notifications
  await pushNotifications.register();
  pushNotifications.addListeners();
  
  // Schedule default reminders
  await localNotifications.scheduleWaterReminder();
  
  console.log('Native features initialized');
};
