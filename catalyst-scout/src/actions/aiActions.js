"use server";

import { scraperFetch } from "@/lib/scraperApi";
import { revalidatePath } from "next/cache";

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

// ==========================================
// PROPOSAL TEMPLATES
// ==========================================

export async function getProposalTemplates() {
  try {
    const data = await scraperFetch("/api/v1/proposals/templates");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadProposalTemplate(formData) {
  try {
    const data = await scraperFetch("/api/v1/proposals/templates", {
      method: "POST",
      body: formData, // fetch will automatically handle multipart boundaries
    });
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteProposalTemplate(id) {
  try {
    const data = await scraperFetch(`/api/v1/proposals/templates/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// PROPOSAL DRAFTS
// ==========================================

export async function generateProposalDraft(payload) {
  try {
    const data = await scraperFetch("/api/v1/proposals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    // This returns { message, draft_id }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getProposalDraft(draftId) {
  try {
    const data = await scraperFetch(`/api/v1/proposals/${draftId}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProposalBlock(blockId, payload) {
  try {
    const data = await scraperFetch(`/api/v1/proposals/blocks/${blockId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function importTimeline(draftId, formData) {
  try {
    const data = await scraperFetch(`/api/v1/proposals/${draftId}/import-timeline`, {
      method: "POST",
      body: formData,
    });
    revalidatePath(`/tenders/[id]/proposal`); // Will need to be refreshed
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
