import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import { mapRowsTranslation } from '@/lib/tr';

// Types for dynamic content - matching database schema
export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  image_url: string | null;
  is_active: boolean;
  // Frontend-only properties (not in DB but used for display)
  emoji?: string;
  calories?: number;
  stage?: string;
  benefits?: string[];
}

export interface SafetyItem {
  id: string;
  name: string;
  name_az: string | null;
  category: string;
  safety_level: 'safe' | 'warning' | 'danger';
  description: string | null;
  description_az: string | null;
  is_active: boolean;
}

export interface BabyName {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string | null;
  meaning: string | null;
  meaning_az: string | null;
  popularity: number | null;
  is_active: boolean;
}

export interface HospitalBagItem {
  id: string;
  item_name: string;
  item_name_az: string | null;
  category: string;
  is_essential: boolean;
  sort_order: number | null;
  is_active: boolean;
}

export interface NutritionTip {
  id: string;
  title: string;
  content: string | null;
  category: string;
  trimester: number | null;
  calories: number | null;
  nutrients: string[] | null;
  is_active: boolean;
  // Frontend display helpers
  emoji?: string;
  benefits?: string[];
}

export interface WeeklyTip {
  id: string;
  week_number: number;
  life_stage: string;
  title: string;
  content: string | null;
  is_active: boolean;
  tips?: any;
}

// Hooks for fetching dynamic content
export const useRecipes = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['recipes', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_recipes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = mapRowsTranslation(data, language, ['title', 'description', 'category', 'ingredients', 'instructions', 'tags']);
      // Map DB data to our interface with defaults for missing fields
      return mapped.map(item => ({
        ...item,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients as string[] : [],
        instructions: Array.isArray(item.instructions) ? item.instructions as string[] : [],
        emoji: '🍽️', // Default emoji
        calories: 0,
        stage: item.category,
        benefits: [],
      })) as Recipe[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSafetyItems = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['safety_items', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_items')
        .select('*')
        .eq('is_active', true)
        .order('name_az', { ascending: true });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['name', 'description']) as SafetyItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

const ENGLISH_BABY_NAMES: BabyName[] = [
  // Boys
  { id: 'en-b-1', name: 'Liam', gender: 'boy', origin: 'Irish', meaning: 'Strong-willed warrior, protector', meaning_az: null, popularity: 100, is_active: true },
  { id: 'en-b-2', name: 'Noah', gender: 'boy', origin: 'Hebrew', meaning: 'Rest, comfort, peace', meaning_az: null, popularity: 99, is_active: true },
  { id: 'en-b-3', name: 'Oliver', gender: 'boy', origin: 'Latin', meaning: 'Olive tree, symbol of peace', meaning_az: null, popularity: 98, is_active: true },
  { id: 'en-b-4', name: 'Elijah', gender: 'boy', origin: 'Hebrew', meaning: 'Yahweh is God', meaning_az: null, popularity: 97, is_active: true },
  { id: 'en-b-5', name: 'James', gender: 'boy', origin: 'Hebrew', meaning: 'Supplanter, one who follows', meaning_az: null, popularity: 96, is_active: true },
  { id: 'en-b-6', name: 'William', gender: 'boy', origin: 'Germanic', meaning: 'Resolute protector, strong helmet', meaning_az: null, popularity: 95, is_active: true },
  { id: 'en-b-7', name: 'Benjamin', gender: 'boy', origin: 'Hebrew', meaning: 'Son of the right hand, favorite son', meaning_az: null, popularity: 94, is_active: true },
  { id: 'en-b-8', name: 'Lucas', gender: 'boy', origin: 'Latin', meaning: 'Bringer of light, luminous', meaning_az: null, popularity: 93, is_active: true },
  { id: 'en-b-9', name: 'Henry', gender: 'boy', origin: 'Germanic', meaning: 'Ruler of the home, estate ruler', meaning_az: null, popularity: 92, is_active: true },
  { id: 'en-b-10', name: 'Theodore', gender: 'boy', origin: 'Greek', meaning: 'Gift of God, divine gift', meaning_az: null, popularity: 91, is_active: true },
  { id: 'en-b-11', name: 'Jack', gender: 'boy', origin: 'English', meaning: 'God is gracious, healthy', meaning_az: null, popularity: 90, is_active: true },
  { id: 'en-b-12', name: 'Levi', gender: 'boy', origin: 'Hebrew', meaning: 'Joined, attached, united', meaning_az: null, popularity: 89, is_active: true },
  { id: 'en-b-13', name: 'Alexander', gender: 'boy', origin: 'Greek', meaning: 'Defender of men, protector', meaning_az: null, popularity: 88, is_active: true },
  { id: 'en-b-14', name: 'Daniel', gender: 'boy', origin: 'Hebrew', meaning: 'God is my judge', meaning_az: null, popularity: 87, is_active: true },
  { id: 'en-b-15', name: 'Michael', gender: 'boy', origin: 'Hebrew', meaning: 'Who is like God?', meaning_az: null, popularity: 86, is_active: true },
  { id: 'en-b-16', name: 'Owen', gender: 'boy', origin: 'Welsh', meaning: 'Noble born, young warrior', meaning_az: null, popularity: 85, is_active: true },
  { id: 'en-b-17', name: 'Sebastian', gender: 'boy', origin: 'Latin', meaning: 'Venerable, revered, respected', meaning_az: null, popularity: 84, is_active: true },
  { id: 'en-b-18', name: 'Carter', gender: 'boy', origin: 'English', meaning: 'Cart driver, transporter of goods', meaning_az: null, popularity: 83, is_active: true },
  { id: 'en-b-19', name: 'Julian', gender: 'boy', origin: 'Latin', meaning: 'Youthful, downy-bearded', meaning_az: null, popularity: 82, is_active: true },
  { id: 'en-b-20', name: 'Wyatt', gender: 'boy', origin: 'English', meaning: 'Brave in war, little warrior', meaning_az: null, popularity: 81, is_active: true },
  { id: 'en-b-21', name: 'Leo', gender: 'boy', origin: 'Latin', meaning: 'Lion, brave and strong', meaning_az: null, popularity: 80, is_active: true },
  { id: 'en-b-22', name: 'Gabriel', gender: 'boy', origin: 'Hebrew', meaning: 'God is my strength, hero of God', meaning_az: null, popularity: 79, is_active: true },
  { id: 'en-b-23', name: 'Lincoln', gender: 'boy', origin: 'English', meaning: 'Lake colony, town by the pool', meaning_az: null, popularity: 78, is_active: true },
  { id: 'en-b-24', name: 'Hudson', gender: 'boy', origin: 'English', meaning: 'Son of Hudd, son of the mind', meaning_az: null, popularity: 77, is_active: true },
  { id: 'en-b-25', name: 'Samuel', gender: 'boy', origin: 'Hebrew', meaning: 'God has heard, name of God', meaning_az: null, popularity: 76, is_active: true },
  { id: 'en-b-26', name: 'Maverick', gender: 'boy', origin: 'American', meaning: 'Independent, nonconformist, free spirit', meaning_az: null, popularity: 75, is_active: true },
  { id: 'en-b-27', name: 'Ezra', gender: 'boy', origin: 'Hebrew', meaning: 'Help, helper, strong support', meaning_az: null, popularity: 74, is_active: true },
  { id: 'en-b-28', name: 'Thomas', gender: 'boy', origin: 'Aramaic', meaning: 'Twin', meaning_az: null, popularity: 73, is_active: true },
  { id: 'en-b-29', name: 'Charles', gender: 'boy', origin: 'Germanic', meaning: 'Free man, strong, manly', meaning_az: null, popularity: 72, is_active: true },
  { id: 'en-b-30', name: 'Christopher', gender: 'boy', origin: 'Greek', meaning: 'Bearer of Christ, Christ-carrier', meaning_az: null, popularity: 71, is_active: true },

  // Girls
  { id: 'en-g-1', name: 'Olivia', gender: 'girl', origin: 'Latin', meaning: 'Olive tree, symbol of peace and fertility', meaning_az: null, popularity: 100, is_active: true },
  { id: 'en-g-2', name: 'Emma', gender: 'girl', origin: 'Germanic', meaning: 'Whole, universal, complete', meaning_az: null, popularity: 99, is_active: true },
  { id: 'en-g-3', name: 'Charlotte', gender: 'girl', origin: 'French', meaning: 'Free man, petite and feminine', meaning_az: null, popularity: 98, is_active: true },
  { id: 'en-g-4', name: 'Amelia', gender: 'girl', origin: 'Latin', meaning: 'Industrious, striving, hardworking', meaning_az: null, popularity: 97, is_active: true },
  { id: 'en-g-5', name: 'Sophia', gender: 'girl', origin: 'Greek', meaning: 'Wisdom, intellectual ability', meaning_az: null, popularity: 96, is_active: true },
  { id: 'en-g-6', name: 'Isabella', gender: 'girl', origin: 'Hebrew', meaning: 'Pledged to God, devoted', meaning_az: null, popularity: 95, is_active: true },
  { id: 'en-g-7', name: 'Mia', gender: 'girl', origin: 'Italian', meaning: 'Mine, beloved, wished-for child', meaning_az: null, popularity: 94, is_active: true },
  { id: 'en-g-8', name: 'Evelyn', gender: 'girl', origin: 'English', meaning: 'Desired, water source, beautiful bird', meaning_az: null, popularity: 93, is_active: true },
  { id: 'en-g-9', name: 'Harper', gender: 'girl', origin: 'English', meaning: 'Harp player, musician', meaning_az: null, popularity: 92, is_active: true },
  { id: 'en-g-10', name: 'Luna', gender: 'girl', origin: 'Latin', meaning: 'Moon, glowing, celestial', meaning_az: null, popularity: 91, is_active: true },
  { id: 'en-g-11', name: 'Camila', gender: 'girl', origin: 'Latin', meaning: 'Young ceremonial attendant, noble helper', meaning_az: null, popularity: 90, is_active: true },
  { id: 'en-g-12', name: 'Gianna', gender: 'girl', origin: 'Italian', meaning: 'God is gracious, divine favor', meaning_az: null, popularity: 89, is_active: true },
  { id: 'en-g-13', name: 'Elizabeth', gender: 'girl', origin: 'Hebrew', meaning: 'My God is an oath, bountiful', meaning_az: null, popularity: 88, is_active: true },
  { id: 'en-g-14', name: 'Eleanor', gender: 'girl', origin: 'Greek', meaning: 'Bright, shining one, radiant', meaning_az: null, popularity: 87, is_active: true },
  { id: 'en-g-15', name: 'Ella', gender: 'girl', origin: 'Germanic', meaning: 'All, completely, fairy maiden', meaning_az: null, popularity: 86, is_active: true },
  { id: 'en-g-16', name: 'Aria', gender: 'girl', origin: 'Italian', meaning: 'Air, song, melody, lioness', meaning_az: null, popularity: 85, is_active: true },
  { id: 'en-g-17', name: 'Scarlett', gender: 'girl', origin: 'English', meaning: 'Bright red, seller of fine fabrics', meaning_az: null, popularity: 84, is_active: true },
  { id: 'en-g-18', name: 'Emily', gender: 'girl', origin: 'Latin', meaning: 'Rival, eager, industrious', meaning_az: null, popularity: 83, is_active: true },
  { id: 'en-g-19', name: 'Abigail', gender: 'girl', origin: 'Hebrew', meaning: "My father's joy, source of joy", meaning_az: null, popularity: 82, is_active: true },
  { id: 'en-g-20', name: 'Lily', gender: 'girl', origin: 'Latin', meaning: 'Lily flower, symbol of purity and innocence', meaning_az: null, popularity: 81, is_active: true },
  { id: 'en-g-21', name: 'Chloe', gender: 'girl', origin: 'Greek', meaning: 'Blooming, green shoot, fresh bloom', meaning_az: null, popularity: 80, is_active: true },
  { id: 'en-g-22', name: 'Mila', gender: 'girl', origin: 'Slavic', meaning: 'Gracious, dear, loved by people', meaning_az: null, popularity: 79, is_active: true },
  { id: 'en-g-23', name: 'Layla', gender: 'girl', origin: 'Arabic', meaning: 'Night, dark beauty', meaning_az: null, popularity: 78, is_active: true },
  { id: 'en-g-24', name: 'Penelope', gender: 'girl', origin: 'Greek', meaning: 'Weaver, faithful wife', meaning_az: null, popularity: 77, is_active: true },
  { id: 'en-g-25', name: 'Grace', gender: 'girl', origin: 'Latin', meaning: 'Favor, blessing, effortless beauty', meaning_az: null, popularity: 76, is_active: true },
  { id: 'en-g-26', name: 'Nora', gender: 'girl', origin: 'Latin', meaning: 'Honor, light, shining star', meaning_az: null, popularity: 75, is_active: true },
  { id: 'en-g-27', name: 'Hazel', gender: 'girl', origin: 'English', meaning: 'Hazelnut tree, greenish-brown color', meaning_az: null, popularity: 74, is_active: true },
  { id: 'en-g-28', name: 'Aurora', gender: 'girl', origin: 'Latin', meaning: 'Dawn, morning goddess', meaning_az: null, popularity: 73, is_active: true },
  { id: 'en-g-29', name: 'Audrey', gender: 'girl', origin: 'English', meaning: 'Noble strength', meaning_az: null, popularity: 72, is_active: true },
  { id: 'en-g-30', name: 'Stella', gender: 'girl', origin: 'Latin', meaning: 'Star of the sea, celestial light', meaning_az: null, popularity: 71, is_active: true },

  // Unisex
  { id: 'en-u-1', name: 'Avery', gender: 'unisex', origin: 'English', meaning: 'Ruler of elves, wise advisor', meaning_az: null, popularity: 90, is_active: true },
  { id: 'en-u-2', name: 'Riley', gender: 'unisex', origin: 'Irish', meaning: 'Courageous, valiant, clearing in the woods', meaning_az: null, popularity: 89, is_active: true },
  { id: 'en-u-3', name: 'Jordan', gender: 'unisex', origin: 'Hebrew', meaning: 'Flowing down, historical river', meaning_az: null, popularity: 88, is_active: true },
  { id: 'en-u-4', name: 'Taylor', gender: 'unisex', origin: 'English', meaning: 'Tailor, cutter of cloth', meaning_az: null, popularity: 87, is_active: true },
  { id: 'en-u-5', name: 'Parker', gender: 'unisex', origin: 'English', meaning: 'Park keeper, forest guardian', meaning_az: null, popularity: 86, is_active: true },
  { id: 'en-u-6', name: 'Peyton', gender: 'unisex', origin: 'English', meaning: "Fighting man's estate, royal town", meaning_az: null, popularity: 85, is_active: true },
  { id: 'en-u-7', name: 'Quinn', gender: 'unisex', origin: 'Irish', meaning: 'Wise, intelligent, counsel, head', meaning_az: null, popularity: 84, is_active: true },
  { id: 'en-u-8', name: 'Rowan', gender: 'unisex', origin: 'Irish', meaning: 'Red-haired, rowan tree, protection', meaning_az: null, popularity: 83, is_active: true },
  { id: 'en-u-9', name: 'Logan', gender: 'unisex', origin: 'Scottish', meaning: 'Little hollow, peaceful meadow', meaning_az: null, popularity: 82, is_active: true },
  { id: 'en-u-10', name: 'Finley', gender: 'unisex', origin: 'Scottish', meaning: 'Fair warrior, heroic leader', meaning_az: null, popularity: 81, is_active: true },
  { id: 'en-u-11', name: 'Morgan', gender: 'unisex', origin: 'Welsh', meaning: 'Sea defender, born of the sea', meaning_az: null, popularity: 80, is_active: true },
  { id: 'en-u-12', name: 'Alex', gender: 'unisex', origin: 'Greek', meaning: 'Defender of men, helper', meaning_az: null, popularity: 79, is_active: true },
  { id: 'en-u-13', name: 'Charlie', gender: 'unisex', origin: 'English', meaning: 'Free man, friendly and cheerful', meaning_az: null, popularity: 78, is_active: true },
  { id: 'en-u-14', name: 'Sam', gender: 'unisex', origin: 'Hebrew', meaning: 'God has heard, listener', meaning_az: null, popularity: 77, is_active: true },
  { id: 'en-u-15', name: 'Skyler', gender: 'unisex', origin: 'Dutch', meaning: 'Scholar, protective shelter, sky', meaning_az: null, popularity: 76, is_active: true },
  { id: 'en-u-16', name: 'Sage', gender: 'unisex', origin: 'Latin', meaning: 'Wise one, healing herb', meaning_az: null, popularity: 75, is_active: true },
  { id: 'en-u-17', name: 'River', gender: 'unisex', origin: 'English', meaning: 'Flowing body of water, constant path', meaning_az: null, popularity: 74, is_active: true },
  { id: 'en-u-18', name: 'Robin', gender: 'unisex', origin: 'English', meaning: 'Bright fame, cheerful bird', meaning_az: null, popularity: 73, is_active: true },
  { id: 'en-u-19', name: 'Reese', gender: 'unisex', origin: 'Welsh', meaning: 'Ardent, fiery, passionate', meaning_az: null, popularity: 72, is_active: true },
  { id: 'en-u-20', name: 'Casey', gender: 'unisex', origin: 'Irish', meaning: 'Vigilant, brave, watchful', meaning_az: null, popularity: 71, is_active: true }
];

export const useBabyNames = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['baby_names', language],
    queryFn: async () => {
      if (language === 'en') {
        return ENGLISH_BABY_NAMES;
      }

      const { data, error } = await supabase
        .from('baby_names_db')
        .select('*')
        .eq('is_active', true)
        .order('popularity', { ascending: false });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['meaning']) as BabyName[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useHospitalBagTemplates = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['hospital_bag_templates', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospital_bag_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['item_name']) as HospitalBagItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useNutritionTips = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['nutrition_tips', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = mapRowsTranslation(data, language, ['title', 'content']);
      // Map DB data to our interface with defaults
      return mapped.map(item => ({
        ...item,
        nutrients: Array.isArray(item.nutrients) ? item.nutrients as string[] : [],
        emoji: '🍎', // Default emoji
        benefits: Array.isArray(item.nutrients) ? item.nutrients as string[] : [],
      })) as NutritionTip[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useWeeklyTips = (weekNumber?: number, lifeStage?: string) => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['weekly_tips', weekNumber, lifeStage, language],
    queryFn: async () => {
      let query = supabase
        .from('weekly_tips')
        .select('*')
        .eq('is_active', true);

      if (weekNumber) {
        query = query.eq('week_number', weekNumber);
      }
      if (lifeStage) {
        query = query.eq('life_stage', lifeStage);
      }

      const { data, error } = await query.order('week_number', { ascending: true });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['title', 'content', 'tips']) as WeeklyTip[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
