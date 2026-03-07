from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse, ViewSpec
from app.services.ai_service import AIService

router = APIRouter()

def rule_based_tutor(message: str) -> ChatResponse:
    m = message.strip().lower()

    # 1. Quadratic
    if any(k in m for k in ["二次", "抛物线", "不等式", "ax^2", "quadratic"]):
        reply = (
            "对于一元二次函数 $y = ax^2 + bx + c$：\n"
            "- **开口方向**：由 $a$ 决定（$a>0$ 向上）。\n"
            "- **根的判别式**：$\\Delta = b^2 - 4ac$ 决定与 x 轴交点个数。\n\n"
            "右侧视图中，阴影部分表示 $y > 0$ 的解集区间。试着把 $a$ 变成负数，看看解集如何翻转。"
        )
        return ChatResponse(
            content=reply,
            view_spec=ViewSpec(
                view_id="quadratic_inequality",
                params={"a": 1, "b": -2, "c": -3}
            )
        )

    # 2. Trig
    if any(k in m for k in ["三角", "sin", "cos", "周期", "振幅", "相位", "trig"]):
        reply = (
            "对于函数 $y = A\\sin(\\omega x + \\phi) + k$：\n"
            "- $A$：**振幅** (Amplitude)\n"
            "- $\\omega$：决定**周期** $T = 2\\pi / \\omega$\n"
            "- $\\phi$：**初相**，决定左右平移\n"
            "- $k$：**偏置**，决定上下平移\n\n"
            "在右侧调整参数，观察图像的伸缩变换。"
        )
        return ChatResponse(
            content=reply,
            view_spec=ViewSpec(
                view_id="trig_func_params",
                params={"A": 2, "omega": 2, "phi": 0, "k": 0}
            )
        )

    # 3. Vector
    if any(k in m for k in ["向量", "面积", "det"]):
         return ChatResponse(
            content="向量 (ax,ay) 与 (bx,by) 张成的面积等于行列式的绝对值。",
            view_spec=ViewSpec(
                view_id="vector_area",
                params={"ax": 2, "ay": 1, "bx": 1, "by": 3}
            )
        )

    # Default - 让 AI 处理
    return ChatResponse(content="")  # Empty content means fallback to AI

@router.post("/chat")
def chat_endpoint(payload: ChatRequest):
    # 1. Rule-Based 快速响应
    rule_resp = rule_based_tutor(payload.message)
    if rule_resp.view_spec and rule_resp.content:
        return rule_resp

    # 2. 如果没有规则匹配，使用 AI
    context = f"当前视图状态：{payload.current_view_state}" if payload.current_view_state else "无"

    # 构建上下文字符串
    context_parts = []
    if payload.current_view_state:
        for key, value in payload.current_view_state.items():
            context_parts.append(f"{key} = {value}")
    context_str = ", ".join(context_parts) if context_parts else "新对话"

    # 调用智谱 AI
    ai_result = AIService.generate_response(
        prompt=payload.message,
        context=context_str,
        generate_code=True
    )

    # 构建 ViewSpec 如果 AI 生成了代码
    view_spec = None
    if ai_result.get("viz_code"):
        # 这里我们需要把代码传递给前端执行
        # 或者构建一个包含代码的 ViewSpec
        view_spec = ViewSpec(
            view_id=ai_result.get("viz_type", "cartesian_plot"),
            params={
                "viz_code": ai_result["viz_code"],
                "title": "AI 生成的可视化"
            }
        )

    return ChatResponse(
        content=ai_result.get("content", ""),
        view_spec=view_spec
    )
