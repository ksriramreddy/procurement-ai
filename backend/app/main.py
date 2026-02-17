import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import vendor_compliances, email_threads, messages, vendors, send_document, upload, s3_upload, lyzr_proxy, contracts, internal_vendors
from .database.connection import ping_db, vendors_collection, email_threads_collection, contracts_collection, internal_vendors_collection

app = FastAPI(
    title="Procurement Automation API",
    description="Backend API for procurement automation - vendor compliances, email threads, and messages",
    version="1.0.0",
)

# CORS: allow localhost + any Vercel preview/production URLs
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
extra_origins = os.getenv("CORS_ORIGINS", "")
if extra_origins:
    cors_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

app.include_router(vendor_compliances.router, prefix="/api")
app.include_router(email_threads.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(internal_vendors.router, prefix="/api")
app.include_router(send_document.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(s3_upload.router, prefix="/api")
app.include_router(lyzr_proxy.router, prefix="/api")


@app.on_event("startup")
async def create_indexes():
    try:
        await vendors_collection.create_index("vendor_id", unique=True)
    except Exception as e:
        print(f"Index creation for vendors_collection failed: {e}")
    
    try:
        await email_threads_collection.create_index("vendor_id")
    except Exception as e:
        print(f"Index creation for email_threads_collection failed: {e}")
    
    try:
        await contracts_collection.create_index("contract_id", unique=False)
    except Exception as e:
        print(f"Index creation for contracts_collection failed: {e}")
    
    try:
        await internal_vendors_collection.create_index("vendor_id", unique=False)
    except Exception as e:
        print(f"Index creation for internal_vendors_collection failed: {e}")


@app.get("/")
async def root():
    return {"message": "Procurement Automation API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    try:
        await ping_db()
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}
