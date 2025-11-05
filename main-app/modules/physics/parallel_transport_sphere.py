#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parallel Transport on the Unit Sphere (S²) — Plotly Visualization
Author: ChatGPT (GPT-5 Thinking)
Date: 2025-09-22 (Asia/Tokyo)

功能：
- 在单位球面 S² 上沿给定路径对切向量执行平行移动（嵌入空间投影法）
- 路径类型：triangle（球面三角形闭合回路）、latitude（恒纬度圈）、great_circle（单段大圆）
- 生成交互式 3D 动画（HTML），并报告 holonomy（闭合路径时）
依赖：numpy, plotly
"""

import argparse
import math
import numpy as np
import plotly.graph_objects as go

# ------------- 工具：角度/弧度、球面坐标与基向量 ------------- #

def deg2rad(d): return d * math.pi / 180.0
def rad2deg(r): return r * 180.0 / math.pi

def sph2cart(lat_deg, lon_deg):
    """纬度lat∈[-90,90], 经度lon∈[-180,180] -> R^3 单位向量"""
    lat = deg2rad(lat_deg)
    lon = deg2rad(lon_deg)
    cl = math.cos(lat)
    x = cl * math.cos(lon)
    y = cl * math.sin(lon)
    z = math.sin(lat)
    return np.array([x, y, z], dtype=float)

def normalize(v, eps=1e-12):
    n = np.linalg.norm(v)
    if n < eps: return v * 0.0
    return v / n

def local_basis_EN(x):
    """
    给定球面上一点的径向 x（单位向量），构造当地 East/North 正交基（均切向）。
    East = 归一化(zhat × x)；North = x × East
    在极点处，East 退化，我们用一个备用方向修正。
    """
    zhat = np.array([0.0, 0.0, 1.0])
    east = np.cross(zhat, x)
    if np.linalg.norm(east) < 1e-12:
        # 位于极点：任选一个参考方向（例如 x 轴）纠偏
        ref = np.array([1.0, 0.0, 0.0])
        east = np.cross(ref, x)
    east = normalize(east)
    north = normalize(np.cross(x, east))
    return east, north

def tangent_from_azimuth(x, azimuth_deg, length=1.0):
    """
    在点 x 的切平面内，根据“从北向东顺时针”的方位角（度）与长度生成初始切向量
    约定：azimuth=0 指向 North，azimuth=90 指向 East
    """
    E, N = local_basis_EN(x)
    a = deg2rad(azimuth_deg)
    vdir = math.cos(a) * N + math.sin(a) * E
    return normalize(vdir) * float(length)

def signed_angle_in_tangent(x, v1, v2):
    """
    在切平面（法向 x）上，计算 v1 -> v2 的有向角（弧度，[-π, π]）
    方向按照右手定则，正向满足 x · (v1 × v2) > 0
    """
    v1t = v1 - np.dot(v1, x) * x
    v2t = v2 - np.dot(v2, x) * x
    v1t = normalize(v1t)
    v2t = normalize(v2t)
    cross = np.cross(v1t, v2t)
    sinang = np.dot(x, cross)
    cosang = np.dot(v1t, v2t)
    return math.atan2(sinang, cosang)

# ------------- 路径生成：大圆插值、恒纬度、三角形 ------------- #

def slerp(a, b, u):
    """球面线性插值（单位向量 a->b, u∈[0,1]）"""
    a = normalize(a); b = normalize(b)
    dot = np.clip(np.dot(a, b), -1.0, 1.0)
    omega = math.acos(dot)
    if omega < 1e-12:
        return a.copy()
    s1 = math.sin((1.0 - u) * omega) / math.sin(omega)
    s2 = math.sin(u * omega) / math.sin(omega)
    return normalize(s1 * a + s2 * b)

def great_circle_path(p0, p1, n_per_seg=200):
    """从 p0 到 p1 的大圆等参路径（均匀参数 u），返回点列与“数值切向”近似"""
    us = np.linspace(0.0, 1.0, n_per_seg)
    pts = np.stack([slerp(p0, p1, u) for u in us], axis=0)
    # 数值导数估计 x'(u)（未必单位速度）
    dpts = np.zeros_like(pts)
    dpts[1:-1] = (pts[2:] - pts[:-2]) * 0.5
    dpts[0] = (pts[1] - pts[0])
    dpts[-1] = (pts[-1] - pts[-2])
    # 投影到切平面
    for i in range(len(pts)):
        dpts[i] -= np.dot(dpts[i], pts[i]) * pts[i]
    return pts, dpts

def latitude_path(lat_deg=30.0, lon0_deg=0.0, revolutions=1, n=600):
    """恒纬度圈（非测地线），从 lon0 开始，沿东向走一圈（可多圈）"""
    lat = deg2rad(lat_deg)
    lons = np.linspace(deg2rad(lon0_deg), deg2rad(lon0_deg) + 2*math.pi*revolutions, n)
    cl = math.cos(lat); sl = math.sin(lat)
    pts = np.stack([np.array([cl*math.cos(L), cl*math.sin(L), sl]) for L in lons], axis=0)
    # 解析导数：对 lon 求导，再以参数 t 等间隔替代
    dpts = np.stack([np.array([-cl*math.sin(L), cl*math.cos(L), 0.0]) for L in lons], axis=0)
    # 在切平面已天然满足正交（对单位球），但数值上再投影一次更稳妥
    for i in range(len(pts)):
        dpts[i] -= np.dot(dpts[i], pts[i]) * pts[i]
    return pts, dpts

def triangle_great_circle_default(n_per_edge=200):
    """
    预设三角形顶点（单位向量）：
    A = (lat=0, lon=0), B = (lat=0, lon=90E), C = (lat=30N, lon=90E)
    沿三段大圆闭合回路。
    """
    A = sph2cart(0.0, 0.0)
    B = sph2cart(0.0, 90.0)
    C = sph2cart(30.0, 90.0)
    seg1, d1 = great_circle_path(A, B, n_per_seg=n_per_edge)
    seg2, d2 = great_circle_path(B, C, n_per_seg=n_per_edge)
    seg3, d3 = great_circle_path(C, A, n_per_seg=n_per_edge)
    pts = np.concatenate([seg1, seg2[1:], seg3[1:]], axis=0)
    dpts = np.concatenate([d1, d2[1:], d3[1:]], axis=0)
    return pts, dpts

# ------------- 平行移动（嵌入空间投影法 + RK1/小步逼近） ------------- #

def parallel_transport_along(pts, dpts, v0, reproject_each=True):
    """
    输入：
      pts[k]  : 路径上的点（单位向量）
      dpts[k] : 参数导数近似（与步长成比例）
      v0      : 起点切向量（在 pts[0] 的切平面）
    使用离散步进：V_{k+1} = V_k + ΔV，ΔV = - (x'(t) · V_k) x  （Δt=1步）
    说明：dpts 未必是单位长度；该离散式视作欧拉法，效果可通过细分步提高。
    """
    N = len(pts)
    V = np.zeros_like(pts)
    V[0] = v0 - np.dot(v0, pts[0]) * pts[0]
    V[0] = normalize(V[0]) * np.linalg.norm(v0)

    for k in range(N-1):
        x = pts[k]
        dx = dpts[k]
        vk = V[k]
        # 平行移动离散更新（欧拉）
        dv = - np.dot(dx, vk) * x
        v_next = vk + dv
        if reproject_each:
            # 投影回切平面、保持长度（近似守恒）
            v_next = v_next - np.dot(v_next, pts[k+1]) * pts[k+1]
            v_next = normalize(v_next) * np.linalg.norm(v0)
        V[k+1] = v_next
    return V

# ------------- 球面多边形面积（球面盈量，用于 holonomy 对照） ------------- #

def spherical_polygon_area(verts):
    """
    计算球面三角形的面积（单位球，单位：弧度²）
    输入：verts = [A, B, C] 三个单位向量（numpy数组）
    使用 Girard 定理：面积 = α + β + γ - π
    其中 α, β, γ 为三角形角。
    """
    if len(verts) != 3:
        raise ValueError("当前版本仅支持三角形面积计算")

    A, B, C = verts
    # 三边弧长（单位：弧度）
    a = math.acos(np.clip(np.dot(B, C), -1.0, 1.0))
    b = math.acos(np.clip(np.dot(A, C), -1.0, 1.0))
    c = math.acos(np.clip(np.dot(A, B), -1.0, 1.0))

    # 三个角
    alpha = math.acos((math.cos(a) - math.cos(b) * math.cos(c)) / (math.sin(b) * math.sin(c)))
    beta  = math.acos((math.cos(b) - math.cos(a) * math.cos(c)) / (math.sin(a) * math.sin(c)))
    gamma = math.acos((math.cos(c) - math.cos(a) * math.cos(b)) / (math.sin(a) * math.sin(b)))

    # Girard 定理
    area = alpha + beta + gamma - math.pi
    return area  # 单位：球面度 (sr)

# ------------- 可视化（Plotly） ------------- #

def make_sphere_mesh(n=60):
    u = np.linspace(0, 2*math.pi, n)
    v = np.linspace(-math.pi/2, math.pi/2, n)
    uu, vv = np.meshgrid(u, v)
    x = np.cos(vv) * np.cos(uu)
    y = np.cos(vv) * np.sin(uu)
    z = np.sin(vv)
    return x, y, z

def vector_segment_at(x, v, scale=0.2):
    """返回画线段的两端点（沿切向量 v，从 x 出发）"""
    start = x
    end = x + scale * v
    return np.stack([start, end], axis=0)

def build_figure(
        pts, V, title="球面S²上的平行移动", show_vectors=True, out_html=None, animate=True, frame_duration=15,
        frame_skip=1,
        mesh=80
    ):
    xmesh, ymesh, zmesh = make_sphere_mesh(mesh)

    fig = go.Figure()

    # 球面
    fig.add_trace(go.Surface(
        x=xmesh, y=ymesh, z=zmesh,
        opacity=0.2, showscale=False,
        colorscale="Viridis", name="球面"
    ))

    # 路径
    fig.add_trace(go.Scatter3d(
        x=pts[:,0], y=pts[:,1], z=pts[:,2],
        mode="lines",
        line=dict(width=6),
        name="路径"
    ))

    # 起点/终点
    fig.add_trace(go.Scatter3d(
        x=[pts[0,0]], y=[pts[0,1]], z=[pts[0,2]],
        mode="markers", marker=dict(size=5), name="起点"
    ))
    fig.add_trace(go.Scatter3d(
        x=[pts[-1,0]], y=[pts[-1,1]], z=[pts[-1,2]],
        mode="markers", marker=dict(size=5), name="终点"
    ))

    # 向量动画（每帧一根小线段）
    frames = []
    if show_vectors:
        # 初始可见的向量段
        seg0 = vector_segment_at(pts[0], V[0])
        vec_trace = go.Scatter3d(
            x=seg0[:,0], y=seg0[:,1], z=seg0[:,2],
            mode="lines",
            line=dict(width=8),
            name="切向量"
        )
        fig.add_trace(vec_trace)

        if animate:
            for k in range(0, len(pts), frame_skip):    
                seg = vector_segment_at(pts[k], V[k])
                frames.append(go.Frame(
                    data=[  # 只更新最后一个 trace（vec_trace）
                        go.Surface(x=xmesh, y=ymesh, z=zmesh, opacity=0.2, showscale=False, colorscale="Viridis"),
                        go.Scatter3d(x=pts[:,0], y=pts[:,1], z=pts[:,2], mode="lines", line=dict(width=6)),
                        go.Scatter3d(x=[pts[0,0]], y=[pts[0,1]], z=[pts[0,2]], mode="markers", marker=dict(size=5)),
                        go.Scatter3d(x=[pts[-1,0]], y=[pts[-1,1]], z=[pts[-1,2]], mode="markers", marker=dict(size=5)),
                        go.Scatter3d(x=seg[:,0], y=seg[:,1], z=seg[:,2], mode="lines", line=dict(width=8)),
                    ],
                    name=f"f{k}"
                ))

            fig.update(frames=frames)
            fig.update_layout(
                updatemenus=[dict(
                    type="buttons",
                    showactive=False,
                    buttons=[
                        dict(label="► Play", method="animate",
                             args=[None, {"frame": {"duration": frame_duration, "redraw": True},
                                          "fromcurrent": True, "transition": {"duration": 0}}]),
                        dict(label="❚❚ Pause", method="animate",
                             args=[[None], {"frame": {"duration": 0, "redraw": False},
                                            "mode": "immediate",
                                            "transition": {"duration": 0}}]),
                    ],
                    x=0.02, y=0.02
                )]
            )

    fig.update_layout(
        title=title,
        scene=dict(
            aspectmode="data",
            xaxis=dict(title="x轴"), yaxis=dict(title="y轴"), zaxis=dict(title="z轴"),
        ),
        showlegend=True,
        margin=dict(l=0, r=0, t=40, b=0),
    )

    if out_html:
        fig.write_html(out_html, include_plotlyjs="cdn")
        print(f"[✓] Saved to {out_html}")
    return fig

# ------------- CLI 与主流程 ------------- #

def main():
    parser = argparse.ArgumentParser(description="S²上的平行移动 — Plotly Visualization")
    parser.add_argument("--path", choices=["triangle", "latitude", "great_circle"], default="triangle",
                        help="Path type: triangle (closed), latitude (closed), great_circle (open)")
    parser.add_argument("--lat", type=float, default=30.0, help="For latitude path: latitude in degrees")
    parser.add_argument("--lon0", type=float, default=0.0, help="For latitude/great_circle: start longitude")
    parser.add_argument("--lon1", type=float, default=90.0, help="For great_circle: end longitude")
    parser.add_argument("--lat0", type=float, default=0.0, help="For great_circle: start latitude")
    parser.add_argument("--lat1", type=float, default=0.0, help="For great_circle: end latitude")
    parser.add_argument("--revolutions", type=int, default=1, help="For latitude: number of loops")
    parser.add_argument("--steps", type=int, default=600, help="Discretization steps per segment")
    parser.add_argument("--azimuth", type=float, default=90.0, help="Initial azimuth at start (deg). 0=North, 90=East")
    parser.add_argument("--vlen", type=float, default=1.0, help="Initial tangent vector length")
    parser.add_argument("--out", type=str, default="parallel_transport.html", help="Output HTML")
    parser.add_argument("--no-anim", action="store_true", help="Disable animation")
    
    parser.add_argument("--frame-duration", type=int, default=15, help="动画每帧毫秒数，值越小越快")
    parser.add_argument("--frame-skip", type=int, default=1, help="动画跳帧步长，例如2表示每2个点取一帧")
    parser.add_argument("--mesh", type=int, default=80, help="球面网格密度，越小越快（建议40~80）")

    args = parser.parse_args()

    # 生成路径与参数导数
    if args.path == "triangle":
        pts, dpts = triangle_great_circle_default(n_per_edge=max(50, args.steps//3))
        closed = True
        title = "球面 S² 上的平行移动 —— 三角形回路"
    elif args.path == "latitude":
        pts, dpts = latitude_path(lat_deg=args.lat, lon0_deg=args.lon0, revolutions=args.revolutions, n=max(100, args.steps))
        closed = True
        title = f"球面 S² 上的平行移动— 纬度圈 {args.lat:.1f}° 回路 (回转角)"
    else:  # great_circle
        p0 = sph2cart(args.lat0, args.lon0)
        p1 = sph2cart(args.lat1, args.lon1)
        pts, dpts = great_circle_path(p0, p1, n_per_seg=max(100, args.steps))
        closed = False
        title = "球面 S² 上的平行移动 — 大圆 Segment"

    # 初始切向量（在起点）
    x0 = pts[0]
    v0 = tangent_from_azimuth(x0, args.azimuth, length=args.vlen)

    # 平行移动
    V = parallel_transport_along(pts, dpts, v0, reproject_each=True)

    # Holonomy（闭合路径）
    if closed and np.linalg.norm(pts[0] - pts[-1]) < 1e-6:
        ang = signed_angle_in_tangent(pts[0], v0, V[-1])
        hol_deg = rad2deg(ang)
        # 估算围成面积（单位球），与理论关系对照：盈量 ≈ holonomy
        A = sph2cart(0.0, 0.0)
        B = sph2cart(0.0, 90.0)
        C = sph2cart(30.0, 90.0)
        area = spherical_polygon_area([A, B, C])
        info = f"回转角 (Holonomy) ≈ {hol_deg:.3f}° ; 球面面积 ≈ {area:.5f} 球面度;  面积对应角度deg(area)={rad2deg(area):.3f}° "
        print("[Holonomy]", info)
        title += f"<br>{info}"

    # 图形
    fig = build_figure(
        pts, V, title=title, out_html=args.out, animate=not args.no_anim,
        frame_duration=args.frame_duration, frame_skip=args.frame_skip, mesh=args.mesh
    )
    # 在交互环境中显示（可选）
    # fig.show()

if __name__ == "__main__":
    main()
