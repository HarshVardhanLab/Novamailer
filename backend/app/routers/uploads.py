from fastapi import APIRouter, UploadFile, File, Depends
from app import deps
from app.models.user import User
from app.services import csv_service

router = APIRouter()

@router.post("/csv/preview")
async def preview_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
):
    data = await csv_service.parse_csv(file)
    return {"count": len(data), "preview": data[:5], "columns": list(data[0].keys()) if data else []}
