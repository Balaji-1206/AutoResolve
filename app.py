"""
AutoResolve AI - Unified Application Orchestrator (app.py)

Spawns, monitors, and manages all 4 core microservices in a single process lifecycle:
1. RAG Knowledge & Policy Retrieval Service (Port 8000)
2. Operational Tool & Database Service (Port 8001)
3. LangGraph Resolution & Investigation Engine (Port 8002)
4. Next.js Apple iOS Glassmorphic Web Frontend (Port 3000)

Usage:
    python app.py                # Run all 4 services
    python app.py --backend-only # Run only microservices (8000, 8001, 8002)
    python app.py --health-check # Check status of all running services
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from typing import Dict, List, Optional, Set
import urllib.request
import urllib.error

# Force unbuffered output so status prints immediately in PowerShell/CMD
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

# Determine Python executable (prefer workspace .venv)
VENV_PY = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
PYTHON_EXE = VENV_PY if os.path.exists(VENV_PY) else sys.executable

SERVICES = {
    "rag": {
        "name": "RAG Policy Service",
        "port": 8000,
        "health_url": "http://127.0.0.1:8000/health",
        "cwd": ROOT_DIR,
        "cmd": [
            PYTHON_EXE, "-m", "uvicorn", "app.main:app",
            "--app-dir", "services/rag-service",
            "--host", "127.0.0.1", "--port", "8000",
            "--log-level", "warning"
        ],
    },
    "tool": {
        "name": "Tool Database Service",
        "port": 8001,
        "health_url": "http://127.0.0.1:8001/health",
        "cwd": ROOT_DIR,
        "cmd": [
            PYTHON_EXE, "-m", "uvicorn", "app.main:app",
            "--app-dir", "services/tool-service",
            "--host", "127.0.0.1", "--port", "8001",
            "--log-level", "warning"
        ],
    },
    "resolution": {
        "name": "Resolution LangGraph Engine",
        "port": 8002,
        "health_url": "http://127.0.0.1:8002/health",
        "cwd": ROOT_DIR,
        "cmd": [
            PYTHON_EXE, "-m", "uvicorn", "app.main:app",
            "--app-dir", "services/resolution-service",
            "--host", "127.0.0.1", "--port", "8002",
            "--log-level", "warning"
        ],
    },
    "frontend": {
        "name": "Next.js Web Portal",
        "port": 3000,
        "health_url": "http://localhost:3000",
        "cwd": os.path.join(ROOT_DIR, "frontend"),
        "cmd": ["npm", "run", "start", "--", "-p", "3000"],
        "shell": True,
    },
}

active_processes: Dict[str, subprocess.Popen] = {}


def free_port(port: int):
    """
    Terminates any lingering or orphaned process listening on the specified port
    to guarantee clean socket binding.
    """
    if sys.platform != "win32":
        return

    try:
        cmd = f"netstat -ano -p tcp | findstr /R \":{port} \""
        output = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode()
        for line in output.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pid = parts[-1]
                if pid != "0" and int(pid) != os.getpid():
                    print(f"   🧹 Freeing occupied port {port} (terminating stale PID {pid})...")
                    subprocess.call(
                        ["taskkill", "/F", "/T", "/PID", pid],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    time.sleep(0.5)
    except Exception:
        pass


def check_service_health(url: str, timeout: float = 2.0) -> bool:
    """Checks if HTTP endpoint returns 200 OK."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AutoResolve-HealthCheck"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
    except Exception:
        return False


def terminate_all_services():
    """Gracefully terminates all spawned child processes."""
    print("\n🛑 Shutting down AutoResolve AI services...")
    for s_id, proc in list(active_processes.items()):
        if proc.poll() is None:
            try:
                print(f"   Terminating {SERVICES[s_id]['name']} (PID: {proc.pid})...")
                if sys.platform == "win32":
                    subprocess.call(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    proc.terminate()
            except Exception as e:
                print(f"   Warning closing {s_id}: {e}")
    active_processes.clear()
    print("✓ All services successfully terminated.\n")


def print_dashboard():
    """Prints status table with clickable URLs."""
    print("\n" + "=" * 80)
    print("  🚀 AUTORESOLVE AI - ALL MICROSERVICES & WEB PORTALS ACTIVE")
    print("=" * 80)
    print("  • Main Gateway:             http://localhost:3000")
    print("  • Customer Care Portal:     http://localhost:3000/customer")
    print("  • Operations Admin Console: http://localhost:3000/admin")
    print("  • RAG Retrieval API:        http://127.0.0.1:8000/docs")
    print("  • Tool Execution API:       http://127.0.0.1:8001/docs")
    print("  • Resolution Engine API:    http://127.0.0.1:8002/docs")
    print("=" * 80)
    print("  Press Ctrl+C at any time to gracefully shut down all services.")
    print("=" * 80 + "\n")


def run(backend_only: bool = False):
    """Main launcher starting all services and monitoring health."""
    def signal_handler(sig, frame):
        terminate_all_services()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    services_to_run = ["rag", "tool", "resolution"]
    if not backend_only:
        services_to_run.append("frontend")

    print("\n⚡ Initializing AutoResolve AI Microservices...")
    print(f"   Python Runtime: {PYTHON_EXE}")
    print(f"   Workspace Root: {ROOT_DIR}")

    # 1. Clean any stale processes holding the target ports
    print("\n🔍 Checking and preparing ports...")
    for s_id in services_to_run:
        free_port(SERVICES[s_id]["port"])

    # 2. Launch processes
    for s_id in services_to_run:
        conf = SERVICES[s_id]
        print(f"   Starting {conf['name']} on port {conf['port']}...")
        is_shell = conf.get("shell", False)
        proc = subprocess.Popen(
            conf["cmd"],
            cwd=conf["cwd"],
            shell=is_shell,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        active_processes[s_id] = proc

    # 3. Health check wait loop
    print("\n⏳ Awaiting microservice readiness...")
    max_wait = 30
    start_time = time.time()
    pending = list(services_to_run)

    while pending and (time.time() - start_time) < max_wait:
        for s_id in list(pending):
            proc = active_processes.get(s_id)
            if proc and proc.poll() is not None:
                print(f"   ❌ Error: {SERVICES[s_id]['name']} failed to start (exit code {proc.poll()})")
                pending.remove(s_id)
                continue

            url = SERVICES[s_id]["health_url"]
            if check_service_health(url):
                print(f"   ✓ {SERVICES[s_id]['name']} (Port {SERVICES[s_id]['port']}) is ONLINE")
                pending.remove(s_id)
        if pending:
            time.sleep(1.0)

    failed = [s for s in services_to_run if active_processes[s].poll() is not None]
    if failed:
        print(f"\n❌ Startup aborted: Some services failed to start: {failed}")
        terminate_all_services()
        sys.exit(1)

    print("\n✨ All services verified healthy and ready!")
    print_dashboard()

    # 4. Monitor loop (no infinite log spam)
    reported_exits: Set[str] = set()
    try:
        while True:
            time.sleep(2.0)
            for s_id, proc in list(active_processes.items()):
                ret = proc.poll()
                if ret is not None and s_id not in reported_exits:
                    reported_exits.add(s_id)
                    print(f"⚠️ Service {SERVICES[s_id]['name']} stopped (exit code {ret})")

            # If all services stopped, clean exit
            if len(reported_exits) == len(services_to_run):
                print("\nAll services have stopped.")
                break
    except KeyboardInterrupt:
        terminate_all_services()


def main():
    parser = argparse.ArgumentParser(description="AutoResolve AI Unified Service Orchestrator")
    parser.add_argument("--backend-only", action="store_true", help="Launch only backend microservices without frontend")
    parser.add_argument("--health-check", action="store_true", help="Probe health of existing running services")
    args = parser.parse_args()

    if args.health_check:
        print("\n🔍 Checking AutoResolve AI Microservice Health:")
        for s_id, conf in SERVICES.items():
            ok = check_service_health(conf["health_url"])
            status_text = "ONLINE (Healthy)" if ok else "OFFLINE"
            print(f"   • {conf['name']:<28} [Port {conf['port']}]: {status_text}")
        print()
        sys.exit(0)

    run(backend_only=args.backend_only)


if __name__ == "__main__":
    main()
