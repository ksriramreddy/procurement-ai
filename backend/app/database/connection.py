import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "procurement")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

vendor_compliances_collection = db["vendor_compliances"]
email_threads_collection = db["email_threads"]
messages_collection = db["messages"]
vendors_collection = db["vendors"]


async def ping_db():
    await client.admin.command("ping")
    return True
