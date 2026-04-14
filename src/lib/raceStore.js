import { supabase } from "./supabase";

export async function fetchSeeds(bracketType) {
  const { data, error } = await supabase
    .from("seeds")
    .select("*")
    .eq("bracket_type", bracketType)
    .order("seed_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertSeed(seed) {
  const { error } = await supabase
    .from("seeds")
    .upsert(seed, { onConflict: "bracket_type,seed_number" });

  if (error) throw error;
}

export async function fetchRaces(bracketType) {
  const { data, error } = await supabase
    .from("races")
    .select("*")
    .eq("bracket_type", bracketType)
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateRace(raceId, updates) {
  const { error } = await supabase
    .from("races")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", raceId);

  if (error) throw error;
}