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
  const { data, error } = await supabase
    .from("seeds")
    .upsert(seed, { onConflict: "bracket_type,seed_number" })
    .select();

  if (error) {
    console.error("UPSERT SEED ERROR:", error, seed);
    throw error;
  }

  return data;
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

export async function upsertRace(race) {
  const { data, error } = await supabase
    .from("races")
    .upsert(race, { onConflict: "bracket_type,id" })
    .select();

  if (error) {
    console.error("UPSERT RACE ERROR:", error, race);
    throw error;
  }

  return data;
}

export async function updateRace(raceId, updates, bracketType) {
  const { data, error } = await supabase
    .from("races")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", raceId)
    .eq("bracket_type", bracketType)
    .select();

  if (error) {
    console.error("UPDATE RACE ERROR:", error, {
      raceId,
      updates,
      bracketType,
    });
    throw error;
  }

  return data;
}