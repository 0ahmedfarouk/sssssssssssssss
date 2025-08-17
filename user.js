import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const { data, error } = await supabase
    .from("users")
    .select("id, username, credits")
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).json({ error: "User not found" });
  res.status(200).json(data);
}