import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HospitalBagItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  category: 'mom' | 'baby' | 'documents';
  is_checked: boolean;
  created_at: string;
  updated_at: string;
}

const defaultItems = [
  // Ana üçün
  { item_id: '1', item_name: 'Gecə köynəyi (2-3 ədəd)', category: 'mom' as const },
  { item_id: '2', item_name: 'Xalat', category: 'mom' as const },
  { item_id: '3', item_name: 'Ayaqqabı (terlik)', category: 'mom' as const },
  { item_id: '4', item_name: 'Diş fırçası və pasta', category: 'mom' as const },
  { item_id: '5', item_name: 'Şampun və sabun', category: 'mom' as const },
  { item_id: '6', item_name: 'Əmzirmə südqəbi (2-3 ədəd)', category: 'mom' as const },
  { item_id: '7', item_name: 'Doğuşdan sonra gigiyenik bezlər', category: 'mom' as const },
  { item_id: '8', item_name: 'Rahat alt paltarları', category: 'mom' as const },
  { item_id: '9', item_name: 'Dodaq balzamı', category: 'mom' as const },
  { item_id: '10', item_name: 'Telefon şarj cihazı', category: 'mom' as const },
  // Körpə üçün
  { item_id: '11', item_name: 'Körpə paltarları (3-4 dəst)', category: 'baby' as const },
  { item_id: '12', item_name: 'Corablar', category: 'baby' as const },
  { item_id: '13', item_name: 'Papaq', category: 'baby' as const },
  { item_id: '14', item_name: 'Əlcəklər', category: 'baby' as const },
  { item_id: '15', item_name: 'Bezlər (yenidoğulmuş ölçüsü)', category: 'baby' as const },
  { item_id: '16', item_name: 'Yaş salfetlər', category: 'baby' as const },
  { item_id: '17', item_name: 'Körpə yağı/losyonu', category: 'baby' as const },
  { item_id: '18', item_name: 'Körpə yorğanı', category: 'baby' as const },
  { item_id: '19', item_name: 'Avtomobil oturacağı', category: 'baby' as const },
  // Sənədlər
  { item_id: '20', item_name: 'Şəxsiyyət vəsiqəsi', category: 'documents' as const },
  { item_id: '21', item_name: 'Tibbi sığorta kartı', category: 'documents' as const },
  { item_id: '22', item_name: 'Doğuş planı', category: 'documents' as const },
  { item_id: '23', item_name: 'Həkim kontaktları', category: 'documents' as const },
  { item_id: '24', item_name: 'Xəstəxana qeydiyyatı', category: 'documents' as const },
];

export const useHospitalBag = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HospitalBagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hospital_bag_items')
        .select('*')
        .eq('user_id', user.id)
        .order('item_id');

      if (error) throw error;

      // If no items exist, initialize with defaults
      if (!data || data.length === 0) {
        await initializeDefaults();
      } else {
        setItems(data as HospitalBagItem[]);
      }
    } catch (error) {
      console.error('Error fetching hospital bag items:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    if (!user) return;

    try {
      const itemsToInsert = defaultItems.map(item => ({
        user_id: user.id,
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        is_checked: false,
      }));

      const { data, error } = await supabase
        .from('hospital_bag_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      if (data) setItems(data as HospitalBagItem[]);
    } catch (error) {
      console.error('Error initializing hospital bag items:', error);
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!user) return;

    const item = items.find(i => i.item_id === itemId);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('hospital_bag_items')
        .update({ is_checked: !item.is_checked })
        .eq('user_id', user.id)
        .eq('item_id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(i => 
        i.item_id === itemId ? { ...i, is_checked: !i.is_checked } : i
      ));
    } catch (error) {
      console.error('Error toggling hospital bag item:', error);
    }
  };

  const getProgress = () => {
    if (items.length === 0) return 0;
    const checked = items.filter(i => i.is_checked).length;
    return (checked / items.length) * 100;
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  return {
    items,
    loading,
    toggleItem,
    getProgress,
    checkedCount: items.filter(i => i.is_checked).length,
    totalCount: items.length,
    refetch: fetchItems,
  };
};
