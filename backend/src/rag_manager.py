"""
RAG Engine Manager
================
Background initialization system for the RAG engine.
Initializes RAG in the background while allowing other features to work immediately.
"""

from __future__ import annotations

import asyncio
import threading
import time
from typing import Optional, Callable

from fastapi import FastAPI

from src.rag_engine import get_rag_chain

# Global state
_rag_chain: Optional[object] = None
_initialization_complete = asyncio.Event()
_initialization_failed = asyncio.Event()
_initialization_thread: Optional[threading.Thread] = None
_initialization_start_time: Optional[float] = None


class RAGInitializationError(Exception):
    """Custom exception for RAG initialization failures."""
    pass


async def _initialize_rag_async() -> object:
    """Initialize RAG chain asynchronously."""
    from src.rag_engine import get_rag_chain
    return await asyncio.to_thread(get_rag_chain)


async def _rag_initialization_task():
    """Background task to initialize RAG chain."""
    global _rag_chain

    try:
        # Start timer
        start_time = time.time()

        # Initialize RAG chain
        _rag_chain = await _initialize_rag_async()

        # Calculate duration
        duration = time.time() - start_time
        print(f"RAG chain initialized successfully in {duration:.2f} seconds.")

        # Signal completion
        _initialization_complete.set()

    except Exception as e:
        print(f"WARNING: RAG chain failed to initialize: {e}")
        _rag_chain = None
        _initialization_failed.set()
        raise RAGInitializationError(f"RAG initialization failed: {e}")


async def initialize_rag_background():
    """Start RAG initialization in background thread."""
    global _initialization_thread

    if _initialization_thread is not None and _initialization_thread.is_alive():
        print("RAG initialization already in progress.")
        return

    # Create and start background thread
    _initialization_thread = threading.Thread(
        target=lambda: asyncio.run(_rag_initialization_task()),
        daemon=True,
        name="RAG-Initializer"
    )
    _initialization_thread.start()
    print("RAG initialization started in background.")


async def wait_for_rag_initialization(timeout: float = 30.0) -> bool:
    """Wait for RAG initialization to complete with timeout.

    Returns:
        bool: True if initialization completed successfully, False if timed out
    """
    try:
        # Wait for completion or failure
        done, _ = await asyncio.wait(
            [_initialization_complete.wait(), _initialization_failed.wait()],
            timeout=timeout,
            return_when=asyncio.FIRST_COMPLETED
        )

        if _initialization_complete in done:
            return True
        elif _initialization_failed in done:
            return False
        else:
            print("RAG initialization timed out.")
            return False

    except Exception as e:
        print(f"Error waiting for RAG initialization: {e}")
        return False


async def get_rag_or_wait(timeout: float = 30.0) -> Optional[object]:
    """Get RAG chain, waiting for initialization if needed.

    Args:
        timeout: Maximum time to wait for initialization

    Returns:
        RAG chain object if available, None if initialization failed or timed out
    """
    global _rag_chain

    # If already initialized, return immediately
    if _rag_chain is not None:
        return _rag_chain

    # If initialization is in progress, wait for it
    if _initialization_thread is not None and _initialization_thread.is_alive():
        print("RAG initialization in progress, waiting...")
        success = await wait_for_rag_initialization(timeout)
        if success:
            return _rag_chain
        else:
            return None

    # If not started yet, start it now
    await initialize_rag_background()

    # Wait for completion
    success = await wait_for_rag_initialization(timeout)
    return _rag_chain if success else None


async def is_rag_ready() -> bool:
    """Check if RAG chain is ready for use."""
    global _rag_chain

    # If initialization hasn't started, start it now
    if _initialization_thread is None:
        await initialize_rag_background()

    # Check if ready
    if _rag_chain is not None:
        return True

    # Check if initialization is complete
    if _initialization_complete.is_set():
        return _rag_chain is not None

    return False


async def get_rag() -> Optional[object]:
    """Get RAG chain, initializing if needed.

    This is the main function to use throughout the application.
    It handles all initialization states automatically.
    """
    global _rag_chain

    # If already initialized, return immediately
    if _rag_chain is not None:
        return _rag_chain

    # If initialization is in progress, wait for it
    if _initialization_thread is not None and _initialization_thread.is_alive():
        # Don't wait - return None and let the caller handle it
        return None

    # If not started yet, start it now (non-blocking)
    await initialize_rag_background()

    # Return None - initialization is in progress
    return None