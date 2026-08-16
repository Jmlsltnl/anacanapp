import { supabase } from "@/integrations/supabase/client";

export type PublicProfileCard = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  badge_type: string | null;
  life_stage?: string | null;
  is_premium?: boolean | null;
  is_verified?: boolean | null;
  verified_until?: string | null;
  created_at?: string;
};

// CORE_FIELDS mütləq mövcuddur (uzun müddətdir DB-də var). is_verified/
// verified_until isə supabase/duzelis/Duzelis10.sql ilə əlavə olunur —
// istifadəçi bu SQL-i işlətməyənə qədər live DB-də bu sütunlar OLMAYA bilər.
// Postgres/PostgREST mövcud olmayan sütun seçildikdə BÜTÜN sorğunu xəta ilə
// rədd edir (yalnız o sütun deyil) — nəticədə hər post/şərh üçün authorMap
// boş qalır və HAMISI "İstifadəçi" fallback-inə düşür. Ona görə əvvəlcə tam
// SELECT sınanır, xəta olarsa CORE_FIELDS ilə təhlükəsiz fallback edilir ki,
// ad/avatar/nişan göstərilməsi migration-un vaxtından asılı olmasın.
const CORE_FIELDS = "user_id, name, avatar_url, badge_type, life_stage, is_premium, created_at";
const SELECT_FIELDS = `${CORE_FIELDS}, is_verified, verified_until`;

export async function getPublicProfileCard(userId: string): Promise<PublicProfileCard | null> {
  if (!userId) return null;

  let { data, error } = await (supabase as any)
    .from("public_profile_cards")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Fallback: Duzelis10.sql hələ işlədilməyib — köhnə sütunlarla təkrar cəhd
    const fallback = await (supabase as any)
      .from("public_profile_cards")
      .select(CORE_FIELDS)
      .eq("user_id", userId)
      .maybeSingle();
    if (fallback.error) {
      console.error("Public profile fetch error:", fallback.error);
      return null;
    }
    data = fallback.data;
  }

  return (data ?? null) as PublicProfileCard | null;
}

export async function getPublicProfileCards(userIds: string[]): Promise<Record<string, PublicProfileCard>> {
  const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  let { data, error } = await (supabase as any)
    .from("public_profile_cards")
    .select(SELECT_FIELDS)
    .in("user_id", uniqueIds);

  if (error) {
    // Fallback: Duzelis10.sql hələ işlədilməyib — köhnə sütunlarla təkrar cəhd
    const fallback = await (supabase as any)
      .from("public_profile_cards")
      .select(CORE_FIELDS)
      .in("user_id", uniqueIds);
    if (fallback.error) {
      console.error("Public profiles bulk fetch error:", fallback.error);
      return {};
    }
    data = fallback.data;
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
