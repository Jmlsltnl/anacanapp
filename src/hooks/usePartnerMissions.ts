import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Coffee, Heart, Flower2, Stethoscope, Baby, Gift, Star, ShoppingCart, Home, Calendar, Droplets, Moon, Smile, Utensils, Music, MessageCircle, Car, Book, Camera, Sun } from 'lucide-react';

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

// Large pool of missions to generate from
const MISSION_POOL: Omit<Mission, 'isCompleted'>[] = [
  // Care missions
  { id: 'care-1', title: 'Səhər çay hazırla', description: 'Zəncəfilli çay ürəkbulanmaya kömək edir', icon: Coffee, points: 10, category: 'care', difficulty: 'easy' },
  { id: 'care-2', title: 'Ayaq masajı et', description: 'Axşam 15 dəqiqə rahatlatıcı masaj', icon: Heart, points: 20, category: 'care', difficulty: 'medium' },
  { id: 'care-3', title: 'Ev işlərini et', description: 'Yemək hazırla, təmizlik et', icon: Home, points: 15, category: 'care', difficulty: 'easy' },
  { id: 'care-4', title: 'Gəzintiyə çıxar', description: 'Birlikdə açıq havada gəzin', icon: Calendar, points: 15, category: 'care', difficulty: 'easy' },
  { id: 'care-5', title: 'Su içməsini xatırlat', description: 'Gün ərzində 8 stəkan su', icon: Droplets, points: 10, category: 'care', difficulty: 'easy' },
  { id: 'care-6', title: 'Yuxuya hazırla', description: 'Yatmadan əvvəl rahat mühit yarat', icon: Moon, points: 15, category: 'care', difficulty: 'easy' },
  { id: 'care-7', title: 'Gülümsət', description: 'Zarafat et, əhvalını yaxşılaşdır', icon: Smile, points: 10, category: 'care', difficulty: 'easy' },
  { id: 'care-8', title: 'Sağlam yemək hazırla', description: 'Qida dəyəri yüksək yemək bişir', icon: Utensils, points: 25, category: 'care', difficulty: 'medium' },
  { id: 'care-9', title: 'Mahnı dinlət', description: 'Sevdiyi mahnıları aç', icon: Music, points: 10, category: 'care', difficulty: 'easy' },
  { id: 'care-10', title: 'Bel masajı et', description: 'Bel ağrılarını yüngülləşdir', icon: Heart, points: 20, category: 'care', difficulty: 'medium' },
  
  // Support missions
  { id: 'support-1', title: 'Həkim vizitinə götür', description: 'Müayinə randevusuna bərabər get', icon: Stethoscope, points: 25, category: 'support', difficulty: 'hard' },
  { id: 'support-2', title: 'Körpə otağını hazırla', description: 'Mebel yığmaqda kömək et', icon: Baby, points: 30, category: 'support', difficulty: 'hard' },
  { id: 'support-3', title: 'Alış-veriş köməyi', description: 'Lazımi əşyaları birlikdə alın', icon: ShoppingCart, points: 20, category: 'support', difficulty: 'medium' },
  { id: 'support-4', title: 'Maşını hazırla', description: 'Xəstəxanaya gedişə hazır ol', icon: Car, points: 15, category: 'support', difficulty: 'easy' },
  { id: 'support-5', title: 'Hamiləlik kitabı oxu', description: 'Birlikdə öyrənin', icon: Book, points: 20, category: 'support', difficulty: 'medium' },
  { id: 'support-6', title: 'Şəkil çək', description: 'Hamiləlik xatirəsi üçün foto', icon: Camera, points: 15, category: 'support', difficulty: 'easy' },
  { id: 'support-7', title: 'Sabahkı plana kömək et', description: 'Gündəlik işlərdə dəstək ol', icon: Sun, points: 15, category: 'support', difficulty: 'easy' },
  { id: 'support-8', title: 'Körpə ilə danış', description: 'Qarına danış, körpə səsi tanısın', icon: Baby, points: 20, category: 'support', difficulty: 'medium' },
  
  // Surprise missions
  { id: 'surprise-1', title: 'Gül gətir', description: 'Onu sürpriz etmək üçün çiçək al', icon: Flower2, points: 15, category: 'surprise', difficulty: 'easy' },
  { id: 'surprise-2', title: 'Romantik şam yeməyi', description: 'Evdə xüsusi axşam keçirin', icon: Star, points: 25, category: 'surprise', difficulty: 'medium' },
  { id: 'surprise-3', title: 'Sürpriz hədiyyə al', description: 'Xüsusi bir hədiyyə ilə sevindir', icon: Gift, points: 30, category: 'surprise', difficulty: 'hard' },
  { id: 'surprise-4', title: 'Sevgi mesajı göndər', description: 'Gözlənilmədən ürək mesajı yaz', icon: MessageCircle, points: 10, category: 'surprise', difficulty: 'easy' },
  { id: 'surprise-5', title: 'Şirniyyat gətir', description: 'Sevdiyi şirniyyatı al', icon: Coffee, points: 15, category: 'surprise', difficulty: 'easy' },
  { id: 'surprise-6', title: 'Film gecəsi planla', description: 'Sevimli filmlərlə rahat axşam', icon: Star, points: 20, category: 'surprise', difficulty: 'medium' },
];

// Function to get daily seed based on date
const getDailySeed = (): number => {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

// Seeded random function
const seededRandom = (seed: number): () => number => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Shuffle array with seed
const shuffleArray = <T,>(array: T[], random: () => number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate daily missions based on date seed
const generateDailyMissions = (): Omit<Mission, 'isCompleted'>[] => {
  const seed = getDailySeed();
  const random = seededRandom(seed);

  // Shuffle the mission pool
  const shuffled = shuffleArray(MISSION_POOL, random);

  // Pick missions ensuring variety
  const careMissions = shuffled.filter(m => m.category === 'care').slice(0, 3);
  const supportMissions = shuffled.filter(m => m.category === 'support').slice(0, 2);
  const surpriseMissions = shuffled.filter(m => m.category === 'surprise').slice(0, 2);

  // Combine and add daily IDs
  return [...careMissions, ...supportMissions, ...surpriseMissions].map((m, i) => ({
    ...m,
    id: `daily-${seed}-${i}`,
  }));
};

export const usePartnerMissions = () => {
  const { user } = useAuth();
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());
  const [dbPoints, setDbPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Generate daily missions (same for all users each day)
  const dailyMissions = generateDailyMissions();

  // Build missions with completion state
  const missions: Mission[] = dailyMissions.map(m => ({
    ...m,
    isCompleted: completedMissionIds.has(m.id),
  }));

  const fetchMissionState = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('partner_missions')
        .select('mission_id, is_completed, points_earned')
        .eq('user_id', user.id);

      if (error) throw error;

      // Get completed mission IDs
      const completedIds = new Set(
        (data || []).filter(m => m.is_completed).map(m => m.mission_id)
      );
      setCompletedMissionIds(completedIds);

      // Calculate total points from DB
      const totalFromDb = (data || []).reduce((sum, m) => sum + (m.points_earned || 0), 0);
      setDbPoints(totalFromDb);
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMissionState();
  }, [fetchMissionState]);

  const toggleMission = async (missionId: string, missionPoints?: number): Promise<{ pointsEarned: number; completed: boolean } | null> => {
    if (!user) return null;

    const currentlyCompleted = completedMissionIds.has(missionId);
    const newCompleted = !currentlyCompleted;
    const points = missionPoints || dailyMissions.find(m => m.id === missionId)?.points || 10;

    try {
      // Optimistically update UI
      setCompletedMissionIds(prev => {
        const next = new Set(prev);
        if (newCompleted) {
          next.add(missionId);
        } else {
          next.delete(missionId);
        }
        return next;
      });

      if (newCompleted) {
        setDbPoints(prev => prev + points);
      } else {
        setDbPoints(prev => Math.max(0, prev - points));
      }

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
      setCompletedMissionIds(prev => {
        const next = new Set(prev);
        if (currentlyCompleted) {
          next.add(missionId);
        } else {
          next.delete(missionId);
        }
        return next;
      });
      if (newCompleted) {
        setDbPoints(prev => Math.max(0, prev - points));
      } else {
        setDbPoints(prev => prev + points);
      }
      return null;
    }
  };

  // Calculate level from total DB points
  const totalPoints = dbPoints;
  const level = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = 50 - (totalPoints % 50);
  const levelProgress = ((totalPoints % 50) / 50) * 100;
  const completedCount = completedMissionIds.size;

  return {
    missions,
    loading,
    toggleMission,
    totalPoints,
    level,
    pointsToNextLevel,
    levelProgress,
    completedCount,
    refetch: fetchMissionState,
  };
};
