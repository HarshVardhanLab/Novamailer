import pandas as pd
from fastapi import UploadFile, HTTPException
import io

async def parse_csv(file: UploadFile):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
    
    # Check for required columns (e.g., email)
    # We can be flexible and just look for 'email' case-insensitive
    email_col = None
    for col in df.columns:
        if col.lower() == 'email':
            email_col = col
            break
    
    if not email_col:
        raise HTTPException(status_code=400, detail="CSV must contain an 'email' column.")
    
    # Convert to list of dicts
    return df.to_dict(orient='records')
