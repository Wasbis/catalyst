"use server";

import { revalidatePath } from "next/cache";
import { scraperFetch } from "@/lib/scraperApi";

export async function getDocumentTemplates(documentType) {
  try {
    const qs = documentType ? `?document_type=${encodeURIComponent(documentType)}` : "";
    const res = await scraperFetch(`/api/v1/documents/templates${qs}`);
    return { success: true, data: res.data ?? [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadDocumentTemplate(formData) {
  try {
    const res = await scraperFetch("/api/v1/documents/templates", {
      method: "POST",
      body: formData, // fetch handles multipart boundaries
    });
    revalidatePath("/settings/document-templates");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateDocumentTemplate(id, payload) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    revalidatePath("/settings/document-templates");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getDocumentTemplateHeadings(id) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}/headings`);
    return { success: true, data: res.data?.headings ?? [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function scanTemplateFieldMapper(id) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}/field-mapper/scan`);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function suggestTemplateFieldMapping(id) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}/field-mapper/suggest`, {
      method: "POST",
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function applyTemplateFieldMapping(id, mappings) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}/field-mapper/apply`, {
      method: "POST",
      body: JSON.stringify({ mappings }),
    });
    revalidatePath("/settings/document-templates");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDocumentTemplate(id) {
  try {
    const res = await scraperFetch(`/api/v1/documents/templates/${id}`, { method: "DELETE" });
    revalidatePath("/settings/document-templates");
    return { success: true, data: res };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
