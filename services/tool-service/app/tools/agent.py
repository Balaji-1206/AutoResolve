"""
Qwen3 Tool Calling Agent.

Orchestrates multi-turn LLM reasoning and deterministic operational tool execution
via Ollama's OpenAI-compatible completions API.
"""

import json
import os
import time
from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, Field
from app.tools.dispatcher import ToolDispatcher
from app.tools.registry import get_tool_definitions

DEFAULT_SYSTEM_PROMPT = """You are the authoritative customer operations AI agent for AcmeCommerce.
You have direct access to operational tools to look up real-time orders, customer accounts, payment records, and refunds.

OPERATIONAL GUIDELINES:
1. When a customer inquires about their order, account, payment, or refund status, you MUST call the appropriate tool.
2. Ground your final response STRICTLY on the data returned by the tool.
3. Be polite, concise, professional, and clear.
4. If a tool reports that an entity was not found or an ID was invalid, inform the customer politely and suggest verifying the ID.
"""


class ToolCallingResult(BaseModel):
    """
    Standardized container for tool execution and synthesized LLM response.
    """
    query: str = Field(..., description="Original user prompt or customer inquiry")
    answer: str = Field(..., description="Synthesized grounded answer from Qwen3")
    tools_executed: List[Dict[str, Any]] = Field(
        default_factory=list, description="Audit trail of tool executions and their outputs"
    )
    model: str = Field(..., description="Underlying LLM model identifier")
    duration_ms: float = Field(default=0.0, description="End-to-end execution latency in milliseconds")


class QwenToolAgent:
    """
    Client managing the two-turn tool calling loop with Qwen3 on Ollama.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        dispatcher: Optional[ToolDispatcher] = None,
        timeout: float = 90.0,
    ):
        self.base_url = (
            base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        ).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen3:8b")
        self.dispatcher = dispatcher or ToolDispatcher()
        self.timeout = timeout
        self.tools_schema = get_tool_definitions()

    def run(
        self,
        query: str,
        system_prompt: Optional[str] = None,
    ) -> ToolCallingResult:
        """
        Executes the tool-calling loop synchronously for a given query.
        """
        t0 = time.time()
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt or DEFAULT_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]

        tools_executed: List[Dict[str, Any]] = []

        with httpx.Client(timeout=self.timeout) as client:
            # Turn 1: Send query with tools schema
            payload_turn1 = {
                "model": self.model,
                "messages": messages,
                "tools": self.tools_schema,
                "stream": False,
            }

            resp1 = client.post(f"{self.base_url}/chat/completions", json=payload_turn1)
            if resp1.status_code != 200:
                raise RuntimeError(
                    f"Ollama completion failed (status {resp1.status_code}): {resp1.text}"
                )

            data1 = resp1.json()
            choice1 = data1["choices"][0]["message"]
            tool_calls = choice1.get("tool_calls")

            # If no tools requested, return direct response
            if not tool_calls:
                dt = (time.time() - t0) * 1000
                return ToolCallingResult(
                    query=query,
                    answer=choice1.get("content", "").strip(),
                    tools_executed=[],
                    model=self.model,
                    duration_ms=round(dt, 2),
                )

            # Append assistant message with tool calls
            messages.append(choice1)

            # Execute each requested tool
            for tool_call in tool_calls:
                fn = tool_call.get("function", {})
                tool_name = fn.get("name", "")
                raw_args = fn.get("arguments", "{}")

                if isinstance(raw_args, str):
                    try:
                        args = json.loads(raw_args)
                    except json.JSONDecodeError:
                        args = {}
                else:
                    args = raw_args

                # Dispatch tool call
                tool_output = self.dispatcher.dispatch(tool_name, args)

                tools_executed.append({
                    "tool_name": tool_name,
                    "arguments": args,
                    "result": tool_output,
                })

                # Append tool result to conversation history
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.get("id", f"call_{tool_name}"),
                    "name": tool_name,
                    "content": json.dumps(tool_output),
                })

            # Turn 2: Synthesize final response using tool results
            payload_turn2 = {
                "model": self.model,
                "messages": messages,
                "stream": False,
            }

            resp2 = client.post(f"{self.base_url}/chat/completions", json=payload_turn2)
            if resp2.status_code != 200:
                raise RuntimeError(
                    f"Ollama turn 2 synthesis failed (status {resp2.status_code}): {resp2.text}"
                )

            data2 = resp2.json()
            final_content = data2["choices"][0]["message"].get("content", "").strip()
            dt = (time.time() - t0) * 1000

            return ToolCallingResult(
                query=query,
                answer=final_content,
                tools_executed=tools_executed,
                model=self.model,
                duration_ms=round(dt, 2),
            )

    async def run_async(
        self,
        query: str,
        system_prompt: Optional[str] = None,
    ) -> ToolCallingResult:
        """
        Executes the tool-calling loop asynchronously for FastAPI async route handlers.
        """
        t0 = time.time()
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt or DEFAULT_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]

        tools_executed: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Turn 1: Send query with tools schema
            payload_turn1 = {
                "model": self.model,
                "messages": messages,
                "tools": self.tools_schema,
                "stream": False,
            }

            resp1 = await client.post(f"{self.base_url}/chat/completions", json=payload_turn1)
            if resp1.status_code != 200:
                raise RuntimeError(
                    f"Ollama completion failed (status {resp1.status_code}): {resp1.text}"
                )

            data1 = resp1.json()
            choice1 = data1["choices"][0]["message"]
            tool_calls = choice1.get("tool_calls")

            if not tool_calls:
                dt = (time.time() - t0) * 1000
                return ToolCallingResult(
                    query=query,
                    answer=choice1.get("content", "").strip(),
                    tools_executed=[],
                    model=self.model,
                    duration_ms=round(dt, 2),
                )

            messages.append(choice1)

            for tool_call in tool_calls:
                fn = tool_call.get("function", {})
                tool_name = fn.get("name", "")
                raw_args = fn.get("arguments", "{}")

                if isinstance(raw_args, str):
                    try:
                        args = json.loads(raw_args)
                    except json.JSONDecodeError:
                        args = {}
                else:
                    args = raw_args

                tool_output = self.dispatcher.dispatch(tool_name, args)

                tools_executed.append({
                    "tool_name": tool_name,
                    "arguments": args,
                    "result": tool_output,
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.get("id", f"call_{tool_name}"),
                    "name": tool_name,
                    "content": json.dumps(tool_output),
                })

            payload_turn2 = {
                "model": self.model,
                "messages": messages,
                "stream": False,
            }

            resp2 = await client.post(f"{self.base_url}/chat/completions", json=payload_turn2)
            if resp2.status_code != 200:
                raise RuntimeError(
                    f"Ollama turn 2 synthesis failed (status {resp2.status_code}): {resp2.text}"
                )

            data2 = resp2.json()
            final_content = data2["choices"][0]["message"].get("content", "").strip()
            dt = (time.time() - t0) * 1000

            return ToolCallingResult(
                query=query,
                answer=final_content,
                tools_executed=tools_executed,
                model=self.model,
                duration_ms=round(dt, 2),
            )
