from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import users_controller
from app.database.connection import get_db
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return users_controller.get_user(db, user_id)