"use server";

import { scraperFetch } from "@/lib/scraperApi";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

export async function generateDocument({
  documentType,
  entityType,
  entityId,
  entityData,
  templateId = null,
  dataBlocks = null,
  aiSections = null,
  sectionGuidelines = null,
  contextText = "",
  companyName = "PT Cliste Rekayasa Indonesia",
  userRequirements = null,
  useMasking = true,
  timelineData = null,
}) {
  try {
    const res = await scraperFetch("/api/v1/documents", {
      method: "POST",
      body: JSON.stringify({
        document_type: documentType,
        entity_type: entityType,
        entity_id: String(entityId),
        entity_data: entityData,
        template_id: templateId,
        data_blocks: dataBlocks,
        ai_sections: aiSections,
        section_guidelines: sectionGuidelines,
        context_text: contextText,
        company_name: companyName,
        user_requirements: userRequirements,
        use_masking: useMasking,
        timeline_data: timelineData,
      }),
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getGeneratedDocument(id) {
  try {
    const res = await scraperFetch(`/api/v1/documents/${id}`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateDocumentBlock(blockId, payload) {
  try {
    const res = await scraperFetch(`/api/v1/documents/blocks/${blockId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function regenerateDocumentBlock(blockId) {
  try {
    const res = await scraperFetch(`/api/v1/documents/blocks/${blockId}/regenerate`, {
      method: "POST",
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Export tidak lewat scraperFetch (response-nya .docx binary, bukan JSON) —
// fetch langsung, kirim balik sebagai base64 supaya client bisa trigger download.
export async function exportDocument(id) {
  try {
    const res = await fetch(`${SCRAPER_API_URL}/api/v1/documents/${id}/export`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ?? `Scraper API error: ${res.status}`);
    }
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? `${id}.docx`;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { success: true, data: { filename, base64 } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
