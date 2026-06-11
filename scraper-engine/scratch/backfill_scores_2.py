import sys
sys.path.append('a:\\Studio\\Great Saturday\\catalyst\\scraper-engine')
from api.models.database import SessionLocal, TenderResult, MasterKbli
from api.services.masking_services import MaskingService
from api.main import _score_tender_against_kbli, _recommendation_from_score
import json

def backfill():
    db = SessionLocal()
    masking = MaskingService.from_db(db)
    kbli_rows = db.query(MasterKbli).filter(MasterKbli.is_active == True).all()
    kbli_dicts = [{"kbli_code": r.kbli_code, "description": r.description} for r in kbli_rows]

    tenders = db.query(TenderResult).all()
    updated = 0
    for item in tenders:
        _bidang_usaha = []
        if item.source_metadata_json:
            try:
                meta = json.loads(item.source_metadata_json)
                _bidang_usaha = meta.get("bidang_usaha", [])
            except:
                pass
                
        _tender_text = item.tender_text or ""
        
        _kbli_matched_list = []
        _max_score = None
        
        texts_to_score = _bidang_usaha if _bidang_usaha else [_tender_text]
        
        for txt in texts_to_score:
            score, _, matches = _score_tender_against_kbli(txt, kbli_dicts, masking)
            if score is not None:
                if _max_score is None or score > _max_score:
                    _max_score = score
                _kbli_matched_list.extend(matches)
                
        # Deduplicate matched KBLI by kbli_code
        seen = set()
        unique_matches = []
        for m in _kbli_matched_list:
            if m["kbli_code"] not in seen:
                seen.add(m["kbli_code"])
                unique_matches.append(m)
                
        _recommendation = _recommendation_from_score(_max_score) if _max_score is not None else None
        
        _match_score = _max_score
        _kbli_matched = unique_matches
        
        item.match_score = _match_score
        item.recommendation = _recommendation
        item.kbli_matched_json = json.dumps(_kbli_matched, ensure_ascii=False)
        updated += 1
        print(f"Updated tender {item.id} - Score: {_match_score}")
        
    db.commit()
    print(f"Updated {updated} records.")

if __name__ == '__main__':
    backfill()
