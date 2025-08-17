import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, product_id } = req.body || {};
  if (!user_id || !product_id) return res.status(400).json({ error: "Missing fields" });

  // المنتج
  const { data: product, error: perr } = await supabase
    .from("products")
    .select("id, price, active")
    .eq("id", product_id)
    .eq("active", true)
    .single();
  if (perr || !product) return res.status(404).json({ error: "Product not found or inactive" });

  // المستخدم
  const { data: user, error: uerr } = await supabase
    .from("users")
    .select("id, credits")
    .eq("id", user_id)
    .single();
  if (uerr || !user) return res.status(404).json({ error: "User not found" });

  if ((user.credits || 0) < product.price) return res.status(400).json({ error: "Not enough credits" });

  // خصم الرصيد
  const newCredits = (user.credits || 0) - product.price;
  const { error: derr } = await supabase
    .from("users")
    .update({ credits: newCredits })
    .eq("id", user_id);
  if (derr) return res.status(500).json({ error: "Failed to update credits" });

  // تسجيل العملية
  const { error: terr } = await supabase
    .from("transactions")
    .insert([{ user_id, product_id, amount: product.price }]);
  if (terr) return res.status(500).json({ error: "Failed to record transaction" });

  res.status(200).json({ ok: true, message: "Purchase successful", credits: newCredits, product_id });
}