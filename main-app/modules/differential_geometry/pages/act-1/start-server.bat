@echo off
REM 启动本地HTTP服务器来访问微分几何可视化页面

echo ======================================
echo 微分几何可视化 - 本地服务器
echo ======================================
echo.
echo 正在启动服务器...
echo.

cd /d "%~dp0"

REM 尝试使用Python 3
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 Python 3 启动服务器...
    echo 请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
    python3 -m http.server 8080
    goto :end
)

REM 尝试使用Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 Python 启动服务器...
    echo 请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8080 2>nul || python -m SimpleHTTPServer 8080
    goto :end
)

REM 尝试使用PHP
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 PHP 启动服务器...
    echo 请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
    php -S localhost:8080
    goto :end
)

echo 错误: 未找到 Python 或 PHP
echo 请安装 Python 3 来运行本地服务器
pause

:end
