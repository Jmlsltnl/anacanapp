import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminRecipe {
  id: string;
  title: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  is_active: boolean;
  life_stages: string[];
}

export const useAdminRecipesQuery = () => {
  return useQuery({
    queryKey: ['admin-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients as string[] : [],
        instructions: Array.isArray(item.instructions) ? item.instructions as string[] : [],
        life_stages: Array.isArray((item as any).life_stages) ? (item as any).life_stages as string[] : [],
      })) as AdminRecipe[];
    },
  });
};

export const useAdminRecipesAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useAdminRecipesQuery();

  const create = useMutation({
    mutationFn: async (item: Partial<AdminRecipe>) => {
      const { error } = await supabase.from('admin_recipes').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({ title: 'Resept əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<AdminRecipe> & { id: string }) => {
      const { error } = await supabase.from('admin_recipes').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({ title: 'Resept yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({ title: 'Resept silindi' });
    },
  });

  return { ...query, create, update, remove, refetch: query.refetch };
};
