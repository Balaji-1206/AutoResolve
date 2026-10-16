"""
End-to-End Live Demonstration of Qwen3 Tool Calling Layer for AutoResolve AI.

Executes autonomous tool calling through Qwen3 on Ollama across diverse customer inquiries:
1. Order Status: "What is the status and delivery date of order ORD-1001?"
2. Customer Profile: "Look up customer CUS-1001 and tell me their email and account status."
3. Payment Status: "Check if payment PAY-1001 was successful and how much was charged."
4. Refund Inquiry: "What is the status of refund REF-1001?"
5. Non-Existent Order: "Where is my package for order ORD-9999?"
"""

import json
import os
import sys
import time
from pathlib import Path

# Add tool-service to sys.path
repo_root = Path(__file__).resolve().parent.parent
tool_service_path = repo_root / "services" / "tool-service"
sys.path.insert(0, str(tool_service_path))

from app.tools.agent import QwenToolAgent


def format_header(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def run_qwen_tool_calling_demo():
    print("\n" + "#" * 70)
    print("  AUTORESOLVE AI - QWEN3 AUTONOMOUS TOOL CALLING DEMONSTRATION")
    print("#" * 70)

    agent = QwenToolAgent()
    print(f"Connecting to LLM: {agent.model} at {agent.base_url}")
    print(f"Registered Tools: {[t['function']['name'] for t in agent.tools_schema]}\n")

    test_queries = [
        ("1. ORDER INQUIRY", "Where is my order ORD-1001 and when was it delivered?"),
        ("2. CUSTOMER INQUIRY", "Look up customer CUS-1001 and verify their email and account status."),
        ("3. PAYMENT INQUIRY", "Did payment PAY-1001 go through, and what was the payment method?"),
        ("4. REFUND INQUIRY", "Can you check if refund REF-1001 has been processed yet?"),
        ("5. UNKNOWN ENTITY ERROR HANDLING", "I want to track order ORD-9999. Can you tell me where it is?"),
    ]

    for title, query in test_queries:
        format_header(title)
        print(f"Customer: \"{query}\"\n")

        t0 = time.time()
        try:
            result = agent.run(query)
            dt = (time.time() - t0)

            print(f"Tools Autonomously Called by Qwen3 ({len(result.tools_executed)}):")
            for t in result.tools_executed:
                print(f"  -> Tool: {t['tool_name']}")
                print(f"     Args: {t['arguments']}")
                print(f"     Success: {t['result'].get('success')}")

            print(f"\nQwen3 Final Response ({dt:.2f}s):")
            # Safely handle console print encoding
            safe_text = result.answer.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
                sys.stdout.encoding or "utf-8"
            )
            print(f"{safe_text}")

        except Exception as err:
            print(f"Execution Error: {err}")

    print("\n" + "=" * 70)
    print(" QWEN3 AUTONOMOUS TOOL CALLING DEMONSTRATION COMPLETED!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_qwen_tool_calling_demo()
