import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://autognvidqqfytmyxhrt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dG9nbnZpZHFxZnl0bXl4aHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDI3MTcsImV4cCI6MjA5NzU3ODcxN30.-ze7gH5UItb-_jMfK9R7AJ1_kgCNF10m3t0P0_99vmw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ───────────────────────── HELPERS DE DADOS (substituem window.storage) ───────────────────────── */

export async function loadData(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveData(key, value) {
  try {
    const { error } = await supabase
      .from("app_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteData(key) {
  try {
    const { error } = await supabase.from("app_data").delete().eq("key", key);
    return !error;
  } catch {
    return false;
  }
}

/* ───────────────────────── UPLOAD DE FOTOS ───────────────────────── */

const BUCKET = "produtos-fotos";

export async function uploadFotoProduto(file) {
  try {
    const ext = file.name.split(".").pop();
    const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(nomeArquivo, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nomeArquivo);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Erro ao enviar foto:", err);
    return null;
  }
}
