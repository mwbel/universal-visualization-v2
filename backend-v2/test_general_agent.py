
import asyncio
from agents.general_agent import GeneralVisualizationAgent

async def test_general_agent():
    agent = GeneralVisualizationAgent()
    print(f"Agent initialized. Config present: {agent.llm_config is not None}")
    
    if not agent.llm_config:
        print("Skipping generation test as no LLM config is found.")
        return

    prompt = "Create a simple bar chart showing sales of 3 products: A, B, C."
    print(f"Testing generation with prompt: '{prompt}'")
    
    try:
        # Mock requirement parsing
        requirement = await agent.parse_requirement(prompt)
        
        # Mock template matching
        template = await agent.match_template(requirement)
        
        # Mock config generation
        config = await agent.generate_config(requirement, template, {})
        
        # Generate
        html = await agent.generate_visualization(config)
        
        print("\nGeneration Result:")
        print(f"HTML Length: {len(html)}")
        print(f"Starts with DOCTYPE: {html.strip().startswith('<!DOCTYPE html>')}")
        print("First 100 chars:", html[:100])
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_general_agent())
