import numpy as np
from scipy.integrate import solve_ivp

def normalize(vec):
    """Normalize a 3D vector."""
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec

def parallel_transport_sphere(path_func, initial_point, initial_vector, t_span, dt=0.01):
    """
    Performs parallel transport of a vector along a path on the unit sphere S^2.

    Args:
        path_func (callable): A function gamma(t) -> x(t) returning the 3D position on the sphere.
        initial_point (np.array): The starting point on the sphere (x, y, z).
        initial_vector (np.array): The initial tangent vector at initial_point.
        t_span (tuple): (t_start, t_end) for the path.
        dt (float): Time step for numerical integration.

    Returns:
        tuple: (points_on_path, transported_vectors)
    """

    def ode_system(t, y):
        # y = [V_x, V_y, V_z, x_x, x_y, x_z]
        V = y[:3]
        x = y[3:]

        # Get path derivative at t
        # We need to approximate gamma_dot(t)
        h = 1e-6
        x_t_plus_h = normalize(path_func(t + h))
        x_t_minus_h = normalize(path_func(t - h))
        gamma_dot = (x_t_plus_h - x_t_minus_h) / (2 * h)

        # Parallel transport equation: dV/dt = -(gamma_dot . V) * x
        dVdt = -np.dot(gamma_dot, V) * x
        
        # The path x(t) is given by path_func, so dx/dt is gamma_dot
        dxdt = gamma_dot

        return np.concatenate((dVdt, dxdt))

    # Initial state for the ODE solver
    # Ensure initial_point and initial_vector are normalized and orthogonal
    initial_point = normalize(initial_point)
    initial_vector = initial_vector - np.dot(initial_vector, initial_point) * initial_point
    initial_vector = normalize(initial_vector)

    y0 = np.concatenate((initial_vector, initial_point))

    # Solve the ODE
    t_eval = np.arange(t_span[0], t_span[1] + dt, dt)
    sol = solve_ivp(ode_system, t_span, y0, t_eval=t_eval, method='RK45', rtol=1e-6, atol=1e-9)

    points_on_path = []
    transported_vectors = []

    for i in range(len(sol.t)):
        V_raw = sol.y[:3, i]
        x_raw = sol.y[3:, i]

        # Project V back to the tangent space at x and normalize its length
        x_proj = normalize(x_raw)
        V_proj = V_raw - np.dot(V_raw, x_proj) * x_proj
        V_proj = normalize(V_proj)

        points_on_path.append(x_proj)
        transported_vectors.append(V_proj)

    return np.array(points_on_path), np.array(transported_vectors)

# Example path functions (to be implemented later)
def great_circle_path(t, start_point, end_point):
    """Generates a point on a great circle path between two points."""
    start_point = normalize(start_point)
    end_point = normalize(end_point)
    
    # Angle between start and end points
    angle = np.arccos(np.dot(start_point, end_point))
    
    if angle == 0:
        return start_point
    
    # Interpolate along the great circle
    return (np.sin((1 - t) * angle) * start_point + np.sin(t * angle) * end_point) / np.sin(angle)

def constant_latitude_path(t, latitude_rad, start_longitude_rad, end_longitude_rad):
    """Generates a point on a constant latitude path."""
    r = np.cos(latitude_rad)
    z = np.sin(latitude_rad)
    
    longitude = start_longitude_rad + t * (end_longitude_rad - start_longitude_rad)
    
    x = r * np.cos(longitude)
    y = r * np.sin(longitude)
    
    return np.array([x, y, z])
