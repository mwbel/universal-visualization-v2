// BackButton.js: 返回工具集首页按钮
(function(global){
  function renderBackButton(containerSelector, href){
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const btn = document.createElement('a');
    btn.className = 'btn';
    btn.textContent = '返回工具集首页';
    btn.href = href || './index.html';
    container.appendChild(btn);
  }
  global.BackButton = { renderBackButton };
})(window);