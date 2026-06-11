import sys
from datetime import datetime, timezone
sys.path.append('a:\\Studio\\Great Saturday\\catalyst\\scraper-engine')
from api.models.database import SessionLocal, AppSetting, ScraperSetting

def seed():
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    if not db.query(ScraperSetting).first():
        db.add_all([
            ScraperSetting(target_name='CIVD', target_url='', cron_schedule='12', updated_at=now),
            ScraperSetting(target_name='GeoDipa', target_url='', cron_schedule='24', updated_at=now)
        ])

    if not db.query(AppSetting).filter_by(key='MATCH_SCORE_THRESHOLD').first():
        db.add(AppSetting(key='MATCH_SCORE_THRESHOLD', value='70', updated_at=now))

    if not db.query(AppSetting).filter_by(key='MAX_TENDER_PER_RUN').first():
        db.add(AppSetting(key='MAX_TENDER_PER_RUN', value='50', updated_at=now))

    db.commit()
    print("Seed done")

if __name__ == '__main__':
    seed()
