from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# -----------------------------------------------------------------------------
# Core View Engine Models
# -----------------------------------------------------------------------------

class ViewSpec(BaseModel):
    """
    Defines what dynamic view to render and with what parameters.
    This is the core contract between Backend (Logic) and Frontend (Renderer).
    """
    view_id: str = Field(..., description="Unique ID of the view template (e.g., 'vector_parallelogram_area')")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters to initialize the view with")
    highlights: List[str] = Field(default_factory=list, description="IDs of elements to highlight")

# -----------------------------------------------------------------------------
# Knowledge / Quick Actions Models
# -----------------------------------------------------------------------------

class QuickAction(BaseModel):
    """
    Represents a subject card on the Welcome Screen.
    """
    id: str
    subject: str
    grade: str
    title: str
    tags: List[str]
    view_id: str
    default_params: Dict[str, Any]
    starter_prompt: str

# -----------------------------------------------------------------------------
# Chat Models
# -----------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    thread_id: Optional[str] = None
    # Client can send current view state so the bot knows what user is looking at
    current_view_state: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    view_spec: Optional[ViewSpec] = None
    suggested_actions: List[str] = Field(default_factory=list)

# -----------------------------------------------------------------------------
# Domain Entities (Mock for Prototype)
# -----------------------------------------------------------------------------

class Project(BaseModel):
    id: str
    name: str
    subject: str  # 'Math', 'Physics', 'Chemistry'
    grade: str    # 'Grade 10', 'Grade 11', 'Grade 12'
    created_at: datetime = Field(default_factory=datetime.now)

class Thread(BaseModel):
    id: str
    project_id: str
    title: str
    last_message: str
    updated_at: datetime = Field(default_factory=datetime.now)
