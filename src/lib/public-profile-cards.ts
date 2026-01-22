import { supabase } from "@/integrations/supabase/client";

export type PublicProfileCard = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  badge_type: string | null;
  life_stage?: string | null;
  is_premium?: boolean | null;
  created_at?: string;
};

const SELECT_FIELDS = "user_id, name, avatar_url, badge_type, life_stage, is_premium, created_at";

export async function getPublicProfileCard(userId: string): Promise<PublicProfileCard | null> {
  if (!userId) return null;

  const { data, error } = await (supabase as any)
    .from("public_profile_cards")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Public profile fetch error:", error);
    return null;
  }

  return (data ?? null) as PublicProfileCard | null;
}

export async function getPublicProfileCards(userIds: string[]): Promise<Record<string, PublicProfileCard>> {
  const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const { data, error } = await (supabase as any)
    .from("public_profile_cards")
    .select(SELECT_FIELDS)
    .in("user_id", uniqueIds);

  if (error) {
    console.error("Public profiles bulk fetch error:", error);
    return {};
  }

  const map: Record<string, PublicProfileCard> = {};
  for (const row of (data || []) as PublicProfileCard[]) {
    map[row.user_id] = row;
  }
  return map;
}

export async function searchPublicProfileCards(term: string, limit = 5): Promise<PublicProfileCard[]> {
  const t = term?.trim();
  if (!t) return [];

  const { data, error } = await (supabase as any)
    .from("public_profile_cards")
    .select("user_id, name, avatar_url")
    .ilike("name", `%${t}%`)
    .limit(limit);

  if (error) {
    console.error("Public profile search error:", error);
    return [];
  }

  return (data || []) as PublicProfileCard[];
}
