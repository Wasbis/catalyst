from sentence_transformers import SentenceTransformer, util
import logging

logger = logging.getLogger(__name__)

# Load model saat file di-import (Load ke RAM diya-server)
# Model ini kecil (~80MB) dan cepat untuk CPU/GPU laptop
logger.info("Loading AI Embedding Model...")
model = SentenceTransformer("all-MiniLM-L6-v2")


def semantic_kbli_match(
    scraped_text: str, kbli_list: list[dict], threshold: float = 0.6
) -> dict | None:
    """
    Membandingkan teks syarat tender dengan list master KBLI.
    kbli_list format: [{"kbli_code": "46599", "description": "PERDAGANGAN BESAR MESIN..."}]
    """
    if not kbli_list or not scraped_text:
        return None

    # Ekstrak deskripsi KBLI ke dalam list string
    kbli_descriptions = [item["description"] for item in kbli_list]

    # Encode teks tender dan deskripsi KBLI menjadi vector
    # (Di sinilah CPU/GPU diya-server lo bekerja keras)
    scraped_vector = model.encode(scraped_text)
    kbli_vectors = model.encode(kbli_descriptions)

    # Hitung cosine similarity
    cosine_scores = util.cos_sim(scraped_vector, kbli_vectors)[0]

    # Cari skor tertinggi
    best_match_idx = int(cosine_scores.argmax())
    best_score = float(cosine_scores[best_match_idx])

    # Jika skor kemiripan memenuhi batas minimal (threshold)
    if best_score >= threshold:
        matched_kbli = kbli_list[best_match_idx]
        logger.info(
            f"AI Match Found! Score: {best_score:.2f} -> {matched_kbli['kbli_code']}"
        )
        return {"kbli_code": matched_kbli["kbli_code"], "score": best_score}

    logger.info(f"No semantic match found. Highest score was {best_score:.2f}")
    return None
