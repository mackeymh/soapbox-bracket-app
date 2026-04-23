import { supabase } from "./supabase";

export async function fetchSeeds(bracketType, district) {
  let query = supabase
    .from("seeds")
    .select("*")
    .eq("bracket_type", bracketType)
    .order("seed_number", { ascending: true });

  if (district) {
    query = query.eq("district", district);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertSeed(seed) {
  const { data, error } = await supabase
    .from("seeds")
    .upsert(seed, { onConflict: "district,bracket_type,seed_number" })
    .select();

  if (error) throw error;
  return data;
}

export async function fetchRaces(bracketType, district) {
  let query = supabase
    .from("races")
    .select("*")
    .eq("bracket_type", bracketType)
    .order("id", { ascending: true });

  if (district) {
    query = query.eq("district", district);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertRace(race) {
  const { data, error } = await supabase
    .from("races")
    .upsert(race, { onConflict: "district,bracket_type,id" })
    .select();

  if (error) throw error;
  return data;
}

export async function updateRace(raceId, updates, bracketType, district) {
  let query = supabase
    .from("races")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", raceId)
    .eq("bracket_type", bracketType);

  if (district) {
    query = query.eq("district", district);
  }

  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}