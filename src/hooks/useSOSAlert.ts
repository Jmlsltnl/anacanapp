import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface SOSAlert {
  id: string;
  sender_id: string;
  receiver_id: string;
  alert_type: string;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export const useSOSAlert = () => {
  const { user, profile } = useAuth();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<SOSAlert | null>(null);

  const getPartnerUserId = useCallback(async (): Promise<string | null> => {
    if (!profile?.linked_partner_id) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profile.linked_partner_id)
        .single();

      if (error || !data) return null;
      return data.user_id;
    } catch {
      return null;
    }
  }, [profile?.linked_partner_id]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data || []) as SOSAlert[]);

      // Check for unacknowledged alerts where I'm the receiver
      const pending = data?.find(
        a => a.receiver_id === user.id && !a.is_acknowledged
      );
      setPendingAlert(pending as SOSAlert || null);
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
    }
  };

  const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    locationName?: string;
  } | null> => {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const sendSOS = async (message?: string, includeLocation: boolean = true) => {
    if (!user) return { error: 'No user logged in' };

    setLoading(true);

    try {
      // Haptic feedback
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch {}

      const partnerUserId = await getPartnerUserId();
      if (!partnerUserId) {
        return { error: 'No partner linked' };
      }

      let location = null;
      if (includeLocation) {
        location = await getCurrentLocation();
      }

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert({
          sender_id: user.id,
          receiver_id: partnerUserId,
          alert_type: 'emergency',
          message: message || 'TƏCİLİ! Mənə kömək lazımdır!',
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          location_name: location?.locationName || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also send a partner message for push notification
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerUserId,
        message_type: 'sos_alert',
        content: JSON.stringify({
          type: 'sos_alert',
          title: '🆘 TƏCİLİ XƏBƏRDARLIQ!',
          body: message || 'Partnyorunuz təcili kömək istəyir!',
          alertId: data.id,
          latitude: location?.latitude,
          longitude: location?.longitude,
          timestamp: new Date().toISOString()
        }),
      });

      await fetchAlerts();
      return { data, error: null };
    } catch (error) {
      console.error('Error sending SOS:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('receiver_id', user.id);

      if (error) throw error;

      setPendingAlert(null);
      await fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Set up realtime subscription for alerts
  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('sos_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts'
        },
        async (payload) => {
          // If new alert where I'm receiver, trigger haptic
          if (
            payload.eventType === 'INSERT' &&
            (payload.new as SOSAlert).receiver_id === user?.id
          ) {
            try {
              await Haptics.impact({ style: ImpactStyle.Heavy });
              await Haptics.impact({ style: ImpactStyle.Heavy });
              await Haptics.impact({ style: ImpactStyle.Heavy });
            } catch {}
          }
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    alerts,
    pendingAlert,
    loading,
    sendSOS,
    acknowledgeAlert,
    hasPartner: !!profile?.linked_partner_id,
    refetch: fetchAlerts,
  };
};
