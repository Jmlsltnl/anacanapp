import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ShoppingItem {
  id: string;
  user_id: string;
  partner_id: string | null;
  name: string;
  quantity: number;
  is_checked: boolean;
  priority: 'low' | 'medium' | 'high';
  added_by: string | null;
  created_at: string;
}

export const useShoppingItems = () => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setItems((data || []) as ShoppingItem[]);
    } catch (error) {
      console.error('Error fetching shopping items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: {
    name: string;
    quantity?: number;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const isPartner = profile?.life_stage === 'partner';
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          name: item.name,
          quantity: item.quantity || 1,
          priority: item.priority || 'medium',
          user_id: user.id,
          partner_id: profile?.linked_partner_id ? 
            (await supabase.from('profiles').select('user_id').eq('id', profile.linked_partner_id).single()).data?.user_id 
            : null,
          added_by: isPartner ? 'partner' : 'woman'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchItems();
      return { data, error: null };
    } catch (error) {
      console.error('Error adding shopping item:', error);
      return { data: null, error };
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', id);

      if (error) throw error;
      
      await fetchItems();
    } catch (error) {
      console.error('Error toggling shopping item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchItems();
    } catch (error) {
      console.error('Error deleting shopping item:', error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('shopping_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items'
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const uncheckedCount = items.filter(i => !i.is_checked).length;
  const checkedCount = items.filter(i => i.is_checked).length;

  return {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    uncheckedCount,
    checkedCount,
    refetch: fetchItems
  };
};
