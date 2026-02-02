clc; 
close all; clear all;
% MATLAB 代码：绘制 3D 椭球体线框

%% 1. 定义椭球体参数
% MATLAB 代码：创建并渲染一个实体 3D 椭球体

%% 1. 定义椭球体参数
a = 1.0; % X轴半径
b = 1.5; % Y轴半径
c = 1.0; % Z轴半径

% 定义网格点
n = 50;
[u, v] = meshgrid(linspace(0, 2*pi, n), linspace(0, pi, n));

% 椭球体的参数方程
X = a * cos(u) .* sin(v);
Y = b * sin(u) .* sin(v);
Z = c * cos(v);

%% 2. 设置绘图环境
figure('Color', [0.05 0.05 0.15], 'Position', [100 100 800 800]); % 深蓝色背景
hold on; 

% 隐藏坐标轴
axis off;
box off;

%% 3. 绘制实体 3D 椭球体
% 使用 surf 绘制曲面
h_surf = surf(X, Y, Z);

% 设定材质和颜色
set(h_surf, 'FaceColor', [0.8 0.8 0.9], ... % 设定一个浅灰蓝色作为基色
            'EdgeColor', 'none', ...      % 移除默认的网格线
            'FaceAlpha', 0.1);            % 使曲面透明，以便我们能看到中央轴和线框

%% 4. 绘制网格线 (线框)
% 在曲面之上绘制线框，这是关键步骤，用于模仿原图的结构

% 绘制纬线 (经度线 v 不变，u 变化)
for k = 1:5:n % 间隔绘制，控制线条密度
    % 获取第 k 行的数据（一条纬线）
    X_line = X(:, k);
    Y_line = Y(:, k);
    Z_line = Z(:, k);
    
    % 使用 plot3 绘制，并设置颜色和线型
    if mod(k, 10) == 1
        % 重要的线使用白色实线
        plot3(X_line, Y_line, Z_line, 'Color', [1 1 1], 'LineWidth', 2, 'LineStyle', '-');
    else
        % 次要线使用彩色虚线
        color_rgb = hsv2rgb([k/n, 1, 0.8]); % 根据位置赋予不同颜色
        plot3(X_line, Y_line, Z_line, 'Color', color_rgb, 'LineWidth', 1, 'LineStyle', ':');
    end
end

% 绘制经线 (纬度线 u 不变，v 变化)
for k = 1:7:n 
    % 获取第 k 列的数据（一条经线）
    X_line = X(k, :);
    Y_line = Y(k, :);
    Z_line = Z(k, :);
    
    color_rgb = hsv2rgb([(k+n/2)/n, 0.8, 0.6]);
    plot3(X_line, Y_line, Z_line, 'Color', color_rgb, 'LineWidth', 1, 'LineStyle', '-');
end


%% 5. 添加光照和视角
lighting gouraud; % 使用 Gouraud 光照，使表面更平滑
light('Position', [1 1 1]); % 添加一个光源，增强 3D 立体感

% 调整视角
view(45, 30); % 仰角 30 度，方位角 45 度

% 确保所有轴的比例相等，保持椭球体的正确形状
pbaspect([1 1 1]); 
daspect([1 1 1]); 

title('3D 椭球体曲面与线框', 'Color', 'w');
hold off;