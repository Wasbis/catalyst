"use server";

import { scraperFetch } from "@/lib/scraperApi";

export async function matchKbli(tenderText, { threshold = 0.6, useMasking = true } = {}) {
  if (!tenderText?.trim()) {
    return { success: false, error: "Tender text kosong." };
  }

  try {
    // kbli_list kosong -> scraper-engine fallback ke MasterKbli aktif dari database
    const data = await scraperFetch("/api/v1/match-kbli", {
      method: "POST",
      body: JSON.stringify({
        tender_text: tenderText,
        kbli_list: [],
        threshold,
        use_masking: useMasking,
      }),
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
