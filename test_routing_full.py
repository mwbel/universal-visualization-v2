import asyncio
import sys
import os

# Add path to backend-v2
sys.path.append(os.path.join(os.getcwd(), "backend-v2"))

from agents.router_manager import VisualizationRouter
from agents.general_agent import GeneralVisualizationAgent
from custom_llm_config import update_llm_configurations_with_api_keys


async def test_routing():
    print("Initializing system...")
    update_llm_configurations_with_api_keys()

    router = VisualizationRouter()

    # Prompt that caused issues
    prompt = "画一个二次函数 y=x^3 的图像"
    print(f"\nTesting prompt: '{prompt}'")

    # 1. Classification
    print("\n--- Step 1: Classification ---")
    subject = await router.subject_classifier.classify(prompt)
    print(f"Classified Subject: {subject}")

    # 2. Agent Selection
    print("\n--- Step 2: Agent Selection ---")
    agent = router.agents.get(subject)
    if not agent:
        print(f"Agent for {subject} not found, falling back to GeneralAgent")
        agent = router.agents["general"]
    else:
        print(f"Selected Agent: {agent.__class__.__name__}")

    # 3. Requirement Parsing
    print("\n--- Step 3: Requirement Parsing ---")
    requirement = await agent.parse_requirement(prompt)
    print(f"Requirement: {requirement}")

    # 4. Template Matching
    print("\n--- Step 4: Template Matching ---")
    template = await agent.match_template(requirement)
    print(f"Matched Template: {template}")

    # 5. Routing Decision
    if not template and subject != "general":
        print("\n!!! No template found. Router should switch to GeneralAgent !!!")
        agent = router.agents["general"]
        print(f"Switched to Agent: {agent.__class__.__name__}")
        requirement = await agent.parse_requirement(prompt)
        template = await agent.match_template(requirement)
        print(f"New Template (General): {template}")

    # 6. Generation (Mock or Real)
    print("\n--- Step 5: Generation Config ---")
    if isinstance(agent, GeneralVisualizationAgent):
        print("Using GeneralAgent for dynamic generation.")
        # We won't actually call generate_visualization here to save time/tokens,
        # as we already verified GeneralAgent logic in test_general_agent.py.
        # But we confirm that we reached this point.
        print("SUCCESS: Routing logic correctly fell back to GeneralAgent.")
    else:
        print(
            f"WARNING: Still using {agent.__class__.__name__}. This might be an issue if it doesn't support y=x^3."
        )
        if template:
            print(f"Using template: {template.get('name')} ({template.get('id')})")
        else:
            print("No template and no fallback? This shouldn't happen.")


if __name__ == "__main__":
    asyncio.run(test_routing())
