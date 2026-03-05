from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await manager.connect(run_id, websocket)
    try:
        while True:
            # Keep alive — wait for client messages (pings)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)
