import { supabase } from "./supabase";

export async function fetchEventSetting(district, division) {
  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .eq("district", district)
    .eq("division", division)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertEventSetting(setting) {
  const { data, error } = await supabase
    .from("event_settings")
    .upsert(
      {
        ...setting,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "district,division",
      }
    )
    .select();

  if (error) throw error;
  return data;
}

export async function fetchSeeds(bracketType, district, division) {
  const { data, error } = await supabase
    .from("seeds")
    .select("*")
    .eq("district", district)
    .eq("division", division)
    .eq("bracket_type", bracketType)
    .order("seed_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertSeed(seed) {
  const { data, error } = await supabase
    .from("seeds")
    .upsert(seed, {
      onConflict: "district,division,bracket_type,seed_number",
    })
    .select();

  if (error) throw error;
  return data;
}

export async function fetchRaces(bracketType, district, division) {
  const { data, error } = await supabase
    .from("races")
    .select("*")
    .eq("district", district)
    .eq("division", division)
    .eq("bracket_type", bracketType)
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertRace(race) {
  const { data, error } = await supabase
    .from("races")
    .upsert(race, {
      onConflict: "district,division,bracket_type,id",
    })
    .select();

  if (error) throw error;
  return data;
}

export async function updateRace(raceId, updates, bracketType, district, division) {
  const { data, error } = await supabase
    .from("races")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", raceId)
    .eq("district", district)
    .eq("division", division)
    .eq("bracket_type", bracketType)
    .select();

  if (error) throw error;
  return data;
}