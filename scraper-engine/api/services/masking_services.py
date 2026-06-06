"""
api/services/masking_services.py

Perbaikan dari versi sebelumnya:
  1. from_db(db) — class method untuk load langsung dari SQLAlchemy session
  2. is_active filter — skip keyword/pattern yang di-disable
  3. is_regex support — pattern dari DB (kolom isRegex) digabung dengan hardcoded
  4. Placeholder mapping — [EMAIL_0001] dll bisa di-unmask ke nilai asli
  5. reset() — bersihkan mapping antar request
  6. Pattern PHONE diperluas (fixed-line 021-xxx)
"""

import re
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class MaskingService:

    # Regex patterns bawaan — selalu aktif, tidak perlu ada di DB
    _BUILTIN_PATTERNS: Dict[str, str] = {
        "EMAIL": r"[\w\.\+\-]+@[\w\.\-]+\.\w{2,}",
        "PHONE": r"(\+62|62|0)[0-9\-\s]{8,14}",  # HP + fixed-line
        "CURRENCY": r"(Rp\.?|IDR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?",
        "ACCOUNT": r"\b\d{10,16}\b",  # nomor rekening
    }

    def __init__(
        self,
        sensitive_keywords: Optional[List[Dict]] = None,
        db_regex_patterns: Optional[List[Dict]] = None,
    ):
        """
        Args:
            sensitive_keywords : list dari DB.
              Format  : [{"keyword": "GeoDipa", "replacement": "[CLIENT_A]"}, ...]
              Filter  : hanya item dengan is_active=True yang dipakai.

            db_regex_patterns  : list pattern regex dari DB (isRegex=True).
              Format  : [{"keyword": r"\bCRI\b", "replacement": "[COMPANY]"}, ...]
        """
        # Filter hanya yang aktif — item dari DB sudah difilter, tapi guard lagi
        self._keywords: List[Dict] = [
            kw
            for kw in (sensitive_keywords or [])
            if kw.get("is_active", True)  # default True untuk backward compat
        ]
        self._db_patterns: List[Dict] = db_regex_patterns or []

        # Placeholder → original value (untuk unmask regex results)
        self._placeholder_map: Dict[str, str] = {}
        self._counter: int = 0

    # ------------------------------------------------------------------
    # Class methods — factory dari DBy
    # ------------------------------------------------------------------
    @classmethod
    def from_db(cls, db) -> "MaskingService":
        """
        Buat instance MaskingService dengan data langsung dari database.

        Usage:
            masking = MaskingService.from_db(db)
            masked  = masking.mask_text(tender_text)

        Args:
            db : SQLAlchemy Session (dari Depends(get_db))
        """
        from api.models.database import DataMasking

        rows = db.query(DataMasking).filter(DataMasking.is_active == True).all()

        keywords = []
        patterns = []
        for row in rows:
            entry = {
                "keyword": row.keyword,
                "replacement": row.replacement,
                "is_active": True,
            }
            if row.is_regex:
                patterns.append(entry)
            else:
                keywords.append(entry)

        instance = cls(sensitive_keywords=keywords, db_regex_patterns=patterns)
        logger.debug(
            f"[MaskingService] Loaded {len(keywords)} keywords + "
            f"{len(patterns)} regex patterns dari DB."
        )
        return instance

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _next_placeholder(self, tag: str) -> str:
        """Generate placeholder unik: [EMAIL_0001], [PHONE_0002], dst."""
        self._counter += 1
        return f"[{tag}_{self._counter:04d}]"

    def reset(self) -> None:
        """
        Reset mapping placeholder — panggil di awal setiap request baru
        kalau instance di-reuse (misal disimpan di module-level).
        Tidak perlu dipanggil kalau instance dibuat per-request.
        """
        self._placeholder_map.clear()
        self._counter = 0

    # ------------------------------------------------------------------
    # Core
    # ------------------------------------------------------------------
    def mask_text(self, text: str) -> str:
        """
        Mask data sensitif dalam teks.

        Urutan prioritas:
        1. Regex patterns dari DB (is_regex=True) — paling spesifik
        2. Builtin regex patterns (EMAIL, PHONE, CURRENCY, ACCOUNT)
        3. Keyword exact-match dari DB (terpanjang duluan → hindari partial match)

        Setiap nilai yang di-mask disimpan di _placeholder_map
        sehingga bisa di-unmask nanti (termasuk regex results).
        """
        if not text:
            return ""

        result = text

        # 1. DB regex patterns
        for item in self._db_patterns:
            try:
                pattern = re.compile(item["keyword"], re.IGNORECASE)

                def _replacer_db(m, _item=item):
                    ph = self._next_placeholder(
                        re.sub(r"[^A-Z0-9]", "", _item["replacement"].upper())[:10]
                        or "MASKED"
                    )
                    self._placeholder_map[ph] = m.group(0)
                    return ph

                result = pattern.sub(_replacer_db, result)
            except re.error as e:
                logger.warning(
                    f"[MaskingService] Invalid DB regex '{item['keyword']}': {e}"
                )

        # 2. Builtin regex patterns
        for tag, pattern_str in self._BUILTIN_PATTERNS.items():

            def _replacer_builtin(m, _tag=tag):
                ph = self._next_placeholder(_tag)
                self._placeholder_map[ph] = m.group(0)
                return ph

            result = re.sub(pattern_str, _replacer_builtin, result)

        # 3. Keyword exact-match (terpanjang duluan hindari partial match)
        sorted_keywords = sorted(
            self._keywords,
            key=lambda x: len(x["keyword"]),
            reverse=True,
        )
        for item in sorted_keywords:
            if not item["keyword"]:
                continue
            pattern = re.compile(re.escape(item["keyword"]), re.IGNORECASE)

            def _replacer_kw(m, _item=item):
                # Keyword pakai replacement tetap dari DB, bukan placeholder unik
                # tapi tetap simpan mapping untuk unmask
                ph = _item["replacement"]
                self._placeholder_map[ph] = m.group(0)
                return ph

            result = pattern.sub(_replacer_kw, result)

        return result

    def unmask_text(self, masked_text: str) -> str:
        """
        Kembalikan semua placeholder ke nilai aslinya.

        Bekerja untuk:
        - [CLIENT_A] → "GeoDipa"         (keyword replacement)
        - [EMAIL_0001] → "user@mail.com" (regex replacement)
        - [PHONE_0003] → "+6281234567"   (regex replacement)
        """
        if not masked_text:
            return ""

        result = masked_text
        # Sort by counter descending supaya nested placeholder aman
        for placeholder, original in sorted(
            self._placeholder_map.items(),
            key=lambda x: x[0],
            reverse=True,
        ):
            result = result.replace(placeholder, original)
        return result

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------
    @property
    def stats(self) -> Dict:
        """Info berapa banyak masking yang terjadi di session ini."""
        return {
            "total_replacements": self._counter,
            "keywords_loaded": len(self._keywords),
            "patterns_loaded": len(self._db_patterns) + len(self._BUILTIN_PATTERNS),
        }
