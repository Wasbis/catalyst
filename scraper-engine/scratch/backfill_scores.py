import sys
sys.path.append('a:\\Studio\\Great Saturday\\catalyst\\scraper-engine')
from api.models.database import SessionLocal, TenderResult, MasterKbli
from api.services.masking_services import MaskingService
from api.main import _score_tender_against_kbli
import json

def backfill():
    db = SessionLocal()
    masking = MaskingService.from_db(db)
    kbli_rows = db.query(MasterKbli).filter(MasterKbli.is_active == True).all()
    kbli_dicts = [{"kbli_code": r.kbli_code, "description": r.description} for r in kbli_rows]

    tenders = db.query(TenderResult).all()
    updated = 0
    for t in tenders:
        _bidang_usaha = []
        if t.source_metadata_json:
            try:
                meta = json.loads(t.source_metadata_json)
                _bidang_usaha = meta.get("bidang_usaha", [])
            except:
                pass
                
        _tender_text = t.tender_text or ""
        if _bidang_usaha:
            _text_to_score = ", ".join(_bidang_usaha)
        else:
            _text_to_score = _tender_text
            
        _match_score, _recommendation, _kbli_matched = _score_tender_against_kbli(_text_to_score, kbli_dicts, masking)
        
        t.match_score = _match_score
        t.recommendation = _recommendation
        t.kbli_matched_json = json.dumps(_kbli_matched, ensure_ascii=False)
        updated += 1
        print(f"Updated tender {t.id} - Score: {_match_score}")
        
    db.commit()
    print(f"Updated {updated} records.")

if __name__ == '__main__':
    backfill()
