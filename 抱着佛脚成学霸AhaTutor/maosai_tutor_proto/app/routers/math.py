import math
import json
import os
import random
from fastapi import APIRouter, Query
from app.services.ai_service import AIService

router = APIRouter()

def solve_quadratic(a, b, c):
    if abs(a) < 1e-6:
        return [] # Not quadratic
    delta = b*b - 4*a*c
    if delta < 0:
        return []
    elif delta == 0:
        return [-b / (2*a)]
    else:
        sqrt_d = math.sqrt(delta)
        x1 = (-b - sqrt_d) / (2*a)
        x2 = (-b + sqrt_d) / (2*a)
        return sorted([x1, x2])

@router.get("/api/math/quadratic")
def api_math_quadratic(a: float = 1, b: float = -2, c: float = -3):
    roots = solve_quadratic(a, b, c)
    vertex_x = -b / (2*a) if abs(a) > 1e-6 else 0
    vertex_y = a*vertex_x**2 + b*vertex_x + c
    
    # Generate Plot Data (Keep backend logic as fallback or for reference)
    center = vertex_x
    span = 10
    if len(roots) >= 2:
        span = (roots[-1] - roots[0]) * 2
    span = max(5, span)
    
    start = center - span
    end = center + span
    steps = 100
    
    xs = []
    ys = []
    step_size = (end - start) / steps
    for i in range(steps + 1):
        x = start + i * step_size
        xs.append(x)
        ys.append(a*x**2 + b*x + c)
        
    return {
        "roots": roots,
        "vertex": [vertex_x, vertex_y],
        "delta": b*b - 4*a*c,
        "xs": xs,
        "ys": ys
    }

@router.get("/api/math/trig")
def api_math_trig(A: float = 1, omega: float = 1, phi: float = 0, k: float = 0):
    limit = 4 * math.pi
    if abs(omega) > 0.1:
         period = 2 * math.pi / abs(omega)
         limit = max(limit, period * 2)
    
    start = -limit/2
    end = limit/2
    steps = 200
    step_size = (end - start) / steps
    
    xs = []
    ys = []
    for i in range(steps + 1):
        x = start + i * step_size
        xs.append(x)
        ys.append(A * math.sin(omega * x + phi) + k)
        
    return {
        "xs": xs,
        "ys": ys,
        "period": (2 * math.pi / abs(omega)) if abs(omega) > 1e-6 else 0
    }

@router.get("/api/vector/area")
def api_vector_area(ax: float, ay: float, bx: float, by: float):
    d = ax * by - ay * bx
    return {"det": d, "area": abs(d), "orientation": "CCW" if d > 0 else "CW"}

@router.get("/api/binomial")
def api_binomial(n: int, p: float):
    pmf = []
    n = max(1, min(int(n), 300))
    p = float(p)
    for k in range(n + 1):
         try:
             val = math.comb(n, k) * (p**k) * ((1-p)**(n-k))
             pmf.append(val)
         except: pmf.append(0)
    mu = n*p
    sigma = math.sqrt(n*p*(1-p))
    xs = [x - 0.5 for x in range(n+2)]
    pdf = []
    if sigma > 0:
        c = 1.0/(sigma*math.sqrt(2*math.pi))
        pdf = [c*math.exp(-0.5*((x-mu)/sigma)**2) for x in xs]
    else:
        pdf = [0]*len(xs)
        
    return {
        "n": n, "p": p, "k": list(range(n+1)), "pmf": pmf,
        "normal_x": xs, "normal_pdf": pdf, "mu": mu, "sigma": sigma
    }

@router.get("/api/math/practice")
def get_practice_questions(topic: str = None, category: str = "基础练"):
    """获取题库中的练习题"""
    questions_path = "app/data/math_questions.json"
    if not os.path.exists(questions_path):
        return []
    
    with open(questions_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    if topic:
        filtered = [q for q in questions if q["category"] == category and topic in q["topic"]]
        return random.sample(filtered, min(len(filtered), 1))
    else:
        # 如果没有指定专题，且是基础练，则每个专题抽一题
        results = []
        topics = list(set([q["topic"] for q in questions]))
        topics.sort()
        for t in topics:
            topic_questions = [q for q in questions if q["topic"] == t and q["category"] == category]
            if topic_questions:
                results.append(random.choice(topic_questions))
        return results

@router.get("/api/math/practice/generate")
def generate_ai_practice(topic: str, category: str = "基础练"):
    """调用 AI 生成一道练习题"""
    result = AIService.generate_practice_question(topic, category)
    return result

# --- OCR Problems Solving ---
from fastapi import File, UploadFile
from app.services.ocr_service import get_ocr_service
import shutil
import tempfile

@router.post("/api/viz/render")
async def render_plotly_code(request: dict):
    """接收 Python 代码并执行以获取 Plotly JSON 用于前端渲染"""
    code = request.get("code", "")
    if not code:
        return {"success": False, "error": "No code provided"}

    # 准备执行环境
    import plotly.graph_objects as go
    import plotly.express as px
    import pandas as pd
    import numpy as np

    namespace = {
        "go": go,
        "px": px,
        "pd": pd,
        "np": np,
        "math": math
    }

    try:
        # 清理代码：移除 fig.show() 以免其阻塞或报错
        clean_code = code.replace("fig.show()", "")
        
        # 执行代码
        exec(clean_code, namespace)
        
        # 寻找生成的 figure 对象
        fig = None
        for val in namespace.values():
            if hasattr(val, 'to_json'):
                fig = val
                break
        
        if fig:
            return {"success": True, "fig_json": json.loads(fig.to_json())}
        else:
            return {"success": False, "error": "代码执行成功但未找到有效的 Plotly Figure 对象。"}
            
    except Exception as e:
        return {"success": False, "error": f"代码执行出错: {str(e)}"}

@router.post("/api/ocr/solve")
async def ocr_solve(file: UploadFile = File(...)):
    """接收图片，识别题目并由 AI 解答"""
    ocr_service = get_ocr_service()
    
    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        # 1. OCR Recognition
        markdown_text = ocr_service.process_image(tmp_path)
        
        if markdown_text.startswith("Error") or markdown_text.startswith("识别过程中发生错误"):
             return {"success": False, "error": markdown_text}
             
        # 2. AI Solving
        # We use a custom prompt for OCR solving to emphasize step-by-step logic
        solve_prompt = f"请根据以下通过识别获取的题目内容进行解题讲解。如果识别内容有误，请在解题前根据常识进行合理修正。\n\n【题目内容】\n{markdown_text}"
        
        ai_result = AIService.generate_response(
            prompt=solve_prompt,
            generate_code=True,
            use_rag=True
        )
        
        return {
            "success": True,
            "ocr_text": markdown_text,
            "ai_response": ai_result
        }
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
