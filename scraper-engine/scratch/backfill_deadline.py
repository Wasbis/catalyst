import sys
from datetime import date
sys.path.append('a:\\Studio\\Great Saturday\\catalyst\\scraper-engine')
from api.models.database import SessionLocal, TenderResult
from api.services.civd_scraper import CIVDScraper

def backfill():
    db = SessionLocal()
    tenders = db.query(TenderResult).filter(TenderResult.source == 'civd').all()
    updated = 0
    for t in tenders:
        if not t.deadline_date and t.deadline_text:
            date_str = CIVDScraper._parse_deadline_date(t.deadline_text)
            if date_str:
                t.deadline_date = date.fromisoformat(date_str)
                updated += 1
    db.commit()
    print(f'Updated {updated} deadline dates for CIVD')

if __name__ == '__main__':
    backfill()
