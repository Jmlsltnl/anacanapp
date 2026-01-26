import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
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

// Push Notifications
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
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();
    } catch (error) {
      // Firebase may not be configured - this is expected during development
      console.warn('Push notification registration failed (Firebase not configured?):', error);
    }
  },

  addListeners: () => {
    if (!isNative) return;

    try {
      PushNotifications.addListener('registration', token => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', err => {
        console.warn('Push registration error:', err.error);
      });

      PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
      });
    } catch (error) {
      console.warn('Failed to add push notification listeners:', error);
    }
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
      // iOS: Use share sheet to save directly to Photos app
      // This provides the native "Save to Photos" option immediately
      try {
        const file = new File([blob], finalFileName, { type: 'image/jpeg' });
        await navigator.share({
          files: [file],
          title: 'Şəkli yadda saxla',
        });
        console.log('iOS: Share sheet opened for saving to Photos');
        return true;
      } catch (shareError) {
        // If share fails or user cancels, fall back to Documents
        console.log('Share sheet failed/cancelled, saving to Documents:', shareError);
        const result = await Filesystem.writeFile({
          path: finalFileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        console.log('iOS: File saved to Documents:', result.uri);
        return true;
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
  
  // Register for push notifications
  await pushNotifications.register();
  pushNotifications.addListeners();
  
  // Schedule default reminders
  await localNotifications.scheduleWaterReminder();
  
  console.log('Native features initialized');
};
