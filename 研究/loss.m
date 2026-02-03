clc; clear all; close all;
a = 100; 
epsilon = 1; 

x = linspace(-2, 2, 50);  % x范围：-2到2，取50个点
y = linspace(-2, 2, 50);  % y范围：-2到2，取50个点
[X, Y] = meshgrid(x, y);  % 生成x、y的网格矩阵

Z = a*X.^2+ epsilon *Y.^2

figure;
mesh(X,Y,Z);
xlabel('x');
ylabel('y');
zlabel('f(x,y)');
title(['f(x,y) = ', num2str(a), 'x^2 + ', num2str(epsilon), 'y^2']);
grid on;  % 显示网格
%axis equal;
%daspect([1 1 0.1]);  
axis([-2 2 -2 2 0 50]);  % 缩小z轴显示范围，突出曲面形状