document.addEventListener('DOMContentLoaded', () => {
    // 可以在这里添加一些交互逻辑，例如平滑滚动
    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 可以在这里添加其他 JavaScript 交互，例如动态加载内容或更复杂的模拟控制
    console.log("物理学可视化平台已加载。");
});
