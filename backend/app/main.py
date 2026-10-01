from fastapi import FastAPI

app = FastAPI(
    title="AutoResolve AI",
    description="Autonomous Multi-Agent Customer Support & Ops Resolution System",
    version="0.1.0",
)

@app.get("/")
def root():
    return {
        "project": "AutoResolve AI",
        "status": "running",
        "version": "0.1.0",
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }