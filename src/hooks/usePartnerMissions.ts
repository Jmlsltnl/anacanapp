import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Coffee, Heart, Flower2, Stethoscope, Baby, Gift, Star, ShoppingCart, Home, Calendar } from 'lucide-react';

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: any;
  points: number;
  isCompleted: boolean;
  category: 'care' | 'support' | 'surprise';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Default missions
const DEFAULT_MISSIONS: Mission[] = [
  { id: '1', title: 'Səhər çay hazırla', description: 'Zəncəfilli çay ürəkbulanmaya kömək edir', icon: Coffee, points: 10, isCompleted: false, category: 'care', difficulty: 'easy' },
  { id: '2', title: 'Ayaq masajı et', description: 'Axşam 15 dəqiqə rahatlatıcı masaj', icon: Heart, points: 20, isCompleted: false, category: 'care', difficulty: 'medium' },
  { id: '3', title: 'Gül gətir', description: 'Onu sürpriz etmək üçün', icon: Flower2, points: 15, isCompleted: false, category: 'surprise', difficulty: 'easy' },
  { id: '4', title: 'Həkim vizitinə götür', description: 'Bu həftəki USG randevusu', icon: Stethoscope, points: 25, isCompleted: false, category: 'support', difficulty: 'hard' },
  { id: '5', title: 'Körpə otağını hazırla', description: 'Mebel yığmaqda kömək et', icon: Baby, points: 30, isCompleted: false, category: 'support', difficulty: 'hard' },
  { id: '6', title: 'Romantik şam yeməyi', description: 'Evdə xüsusi axşam keçirin', icon: Star, points: 25, isCompleted: false, category: 'surprise', difficulty: 'medium' },
  { id: '7', title: 'Alış-veriş köməyi', description: 'Körpə üçün lazımi əşyalar alın', icon: ShoppingCart, points: 20, isCompleted: false, category: 'support', difficulty: 'medium' },
  { id: '8', title: 'Ev işlərini et', description: 'Yemək hazırla, təmizlik et', icon: Home, points: 15, isCompleted: false, category: 'care', difficulty: 'easy' },
  { id: '9', title: 'Gəzintiyə çıxar', description: 'Birlikdə açıq havada gəzin', icon: Calendar, points: 15, isCompleted: false, category: 'care', difficulty: 'easy' },
  { id: '10', title: 'Sürpriz hədiyyə al', description: 'Xüsusi bir hədiyyə ilə sevindir', icon: Gift, points: 30, isCompleted: false, category: 'surprise', difficulty: 'hard' },
];

export const usePartnerMissions = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('partner_missions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Merge database state with default missions
      const updatedMissions = DEFAULT_MISSIONS.map(mission => {
        const dbMission = data?.find(m => m.mission_id === mission.id);
        if (dbMission) {
          return {
            ...mission,
            isCompleted: dbMission.is_completed,
          };
        }
        return mission;
      });

      setMissions(updatedMissions);
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [user]);

  const toggleMission = async (missionId: string, missionPoints?: number): Promise<{ pointsEarned: number; completed: boolean } | null> => {
    if (!user) return null;

    // Find from local missions first, then use provided points
    const localMission = missions.find(m => m.id === missionId);
    const points = missionPoints || localMission?.points || 10;
    const currentlyCompleted = localMission?.isCompleted || false;
    const newCompleted = !currentlyCompleted;

    try {
      // Optimistically update UI
      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, isCompleted: newCompleted } : m
      ));

      // Upsert to database
      const { error } = await supabase
        .from('partner_missions')
        .upsert({
          user_id: user.id,
          mission_id: missionId,
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          points_earned: newCompleted ? points : 0,
        }, {
          onConflict: 'user_id,mission_id'
        });

      if (error) throw error;

      return { pointsEarned: newCompleted ? points : 0, completed: newCompleted };
    } catch (err) {
      console.error('Error toggling mission:', err);
      // Revert on error
      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, isCompleted: currentlyCompleted } : m
      ));
      return null;
    }
  };

  // Calculate total points and level
  const totalPoints = missions.filter(m => m.isCompleted).reduce((sum, m) => sum + m.points, 0);
  const level = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = 50 - (totalPoints % 50);
  const levelProgress = ((totalPoints % 50) / 50) * 100;
  const completedCount = missions.filter(m => m.isCompleted).length;

  return {
    missions,
    loading,
    toggleMission,
    totalPoints,
    level,
    pointsToNextLevel,
    levelProgress,
    completedCount,
    refetch: fetchMissions,
  };
};
