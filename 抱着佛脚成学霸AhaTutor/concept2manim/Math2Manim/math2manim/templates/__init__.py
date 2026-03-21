"""模板管理器"""

__all__ = ["TemplateManager"]


class TemplateManager:
    """模板管理器 - 管理预定义的动画模板"""

    def __init__(self):
        self.templates = {}

    def get_template(self, name: str) -> str:
        """获取模板"""
        return self.templates.get(name, "")
