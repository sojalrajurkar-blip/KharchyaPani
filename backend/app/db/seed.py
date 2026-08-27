from app.db.session import SessionLocal
from app.models.category import Category
from app.models.expense import Expense  # Required for SQLAlchemy relationship mapping

SEED_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Health",
    "Entertainment",
    "Other"
]

def seed_categories(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        count = db.query(Category).count()
        if count == 0:
            print("Seeding initial categories...")
            for cat_name in SEED_CATEGORIES:
                category = Category(name=cat_name)
                db.add(category)
            db.commit()
            print(f"Successfully seeded {len(SEED_CATEGORIES)} categories.")
        else:
            print(f"Categories table already contains {count} records. Skipping seed.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding categories: {e}")
        raise e
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_categories()
