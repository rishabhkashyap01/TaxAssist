"""
Background RAG Initialization System
====================================

This system allows the RAG engine to initialize in the background while the FastAPI application
starts immediately and handles other requests (like login) without delay.

Key Components:
- **Background Thread**: RAG initialization runs in a separate thread
- **Non-blocking Startup**: FastAPI starts immediately, not waiting for RAG
- **Lazy Access**: RAG is only accessed when actually needed
- **Health Monitoring**: Tracks initialization status

Usage:
1. RAG starts initializing in background during app startup
2. Login, auth, and other endpoints work immediately
3. When RAG is first requested, it returns None if not ready
4. Once RAG is ready, all subsequent requests get the initialized engine

Benefits:
- Login and auth requests are never delayed by RAG initialization
- Users get immediate response for non-RAG features
- RAG is ready when first needed (typically for tax questions)
- No timeout issues from slow startup
- Better user experience

Implementation Details:
- Uses threading.Thread for background initialization
- Uses asyncio.Event for completion signaling
- Provides helper functions for checking readiness
- Handles initialization failures gracefully
"""

# How It Works

## Startup Flow
1. FastAPI app starts immediately (no waiting)
2. Background thread starts RAG initialization
3. Other endpoints (login, auth) are immediately available
4. RAG initialization continues in background

## Request Flow
1. Non-RAG requests (login, auth) → Immediate response
2. RAG requests (tax questions) → Check if ready:
   - If ready: Return RAG engine
   - If not ready: Return None (caller handles gracefully)
   - If initialization failed: Return None with error handling

## State Management
- `_rag_chain`: Global RAG engine instance (None until ready)
- `_initialization_complete`: Event signaled when ready
- `_initialization_failed`: Event signaled on failure
- `_initialization_thread`: Background thread reference

## Graceful Degradation
- If RAG fails to initialize, app continues to work
- Non-RAG features are unaffected
- RAG-dependent features can show "feature unavailable" messages
- Health endpoint shows RAG readiness status

## Configuration
- Timeout for waiting on initialization (default: 30 seconds)
- Background thread is daemon (won't block app shutdown)
- Automatic retry on failure (if needed)

This approach ensures your FastAPI app is always responsive, while the RAG engine initializes in the background without affecting user experience.