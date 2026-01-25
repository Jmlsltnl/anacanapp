import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

// Check if we're running on native platform
export const isNative = Capacitor.isNativePlatform();

// Android-də Firebase (google-services.json) qurulmayanda PushNotifications.register()
// native tərəfdə crash verə bilir. Default olaraq Android push auto-register söndürülür.
// Firebase hazır olanda lokal build zamanı bunu aktiv edin:
//   VITE_ANDROID_PUSH_AUTO_REGISTER=true
const isAndroid = Capacitor.getPlatform() === 'android';
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
      console.error('Push notification registration failed:', error);
    }
  },

  addListeners: () => {
    if (!isNative) return;

    PushNotifications.addListener('registration', token => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
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
