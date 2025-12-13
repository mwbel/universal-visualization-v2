#!/usr/bin/env python3

# Simple test to isolate the issue
test_dict = {
    "template_content": """
    <script>
        function createOrbit(radius) {
            const curve = new THREE.EllipseCurve(
                0, 0,
                radius, radius,
                0, 2 * Math.PI,
                false,  // This should be fine as it's in a string
                0
            );
        }
    </script>
    """
}

print("Test passed - no syntax errors")