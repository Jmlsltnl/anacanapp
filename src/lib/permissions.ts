import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

// Permission status types
export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PermissionResult {
  granted: boolean;
  status: PermissionStatus;
}

/**
 * Check and request camera permissions
 */
export async function requestCameraPermission(): Promise<PermissionResult> {
  if (!Capacitor.isNativePlatform()) {
    // Web platform - permissions handled by browser
    return { granted: true, status: 'granted' };
  }

  try {
    const status = await Camera.checkPermissions();
    
    if (status.camera === 'granted' && status.photos === 'granted') {
      return { granted: true, status: 'granted' };
    }

    // Request permissions
    const requested = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    
    const granted = requested.camera === 'granted' && requested.photos === 'granted';
    return { 
      granted, 
      status: granted ? 'granted' : 'denied' 
    };
  } catch (error) {
    console.error('Camera permission error:', error);
    return { granted: false, status: 'denied' };
  }
}

/**
 * Check and request location permissions
 */
export async function requestLocationPermission(): Promise<PermissionResult> {
  if (!Capacitor.isNativePlatform()) {
    // Web platform - use standard geolocation API
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ granted: true, status: 'granted' }),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({ granted: false, status: 'denied' });
          } else {
            resolve({ granted: false, status: 'prompt' });
          }
        },
        { timeout: 5000 }
      );
    });
  }

  try {
    const status = await Geolocation.checkPermissions();
    
    if (status.location === 'granted') {
      return { granted: true, status: 'granted' };
    }

    const requested = await Geolocation.requestPermissions();
    const granted = requested.location === 'granted';
    
    return { 
      granted, 
      status: granted ? 'granted' : 'denied' 
    };
  } catch (error) {
    console.error('Location permission error:', error);
    return { granted: false, status: 'denied' };
  }
}

/**
 * Check and request microphone permissions
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  try {
    // For both web and native, we use the MediaDevices API
    // On native, this will trigger the system permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop the stream immediately - we just needed to request permission
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true, status: 'granted' };
  } catch (error: any) {
    console.error('Microphone permission error:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return { granted: false, status: 'denied' };
    }
    
    return { granted: false, status: 'prompt' };
  }
}

/**
 * Take a photo using the camera (native or web)
 */
export async function takePhoto(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback - return null to trigger file input
    return null;
  }

  try {
    // Request permissions first on native
    const permStatus = await Camera.checkPermissions();
    
    if (permStatus.camera !== 'granted') {
      const requested = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requested.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }
    }

    // Use Capacitor Camera plugin for native
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      correctOrientation: true,
      saveToGallery: false,
      width: 1024,
      height: 1024,
    });

    if (image.base64String) {
      return `data:image/jpeg;base64,${image.base64String}`;
    }
    return null;
  } catch (error: any) {
    console.error('Take photo error:', error);
    // If user cancelled, don't throw
    if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
      return null;
    }
    throw error;
  }
}

/**
 * Pick a photo from gallery (native or web)
 */
export async function pickFromGallery(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback - return null to trigger file input
    return null;
  }

  try {
    // Request photo library permissions first on native
    const permStatus = await Camera.checkPermissions();
    
    if (permStatus.photos !== 'granted') {
      const requested = await Camera.requestPermissions({ permissions: ['photos'] });
      if (requested.photos !== 'granted') {
        throw new Error('Photo library permission denied');
      }
    }

    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 1024,
      height: 1024,
    });

    if (image.base64String) {
      return `data:image/jpeg;base64,${image.base64String}`;
    }
    return null;
  } catch (error: any) {
    console.error('Pick from gallery error:', error);
    // If user cancelled, don't throw
    if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get current position with proper permission handling
 */
export async function getCurrentPosition(): Promise<GeolocationPosition> {
  const permission = await requestLocationPermission();
  
  if (!permission.granted) {
    throw new Error('Location permission denied');
  }

  if (Capacitor.isNativePlatform()) {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    // Convert Capacitor position to standard GeolocationPosition format
    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      },
      timestamp: position.timestamp,
    } as GeolocationPosition;
  } else {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  }
}
