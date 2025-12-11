
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MockEngine } from '../js/utils/MockEngine.js';
import { VisualizationPrompts } from '../js/utils/PromptTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const mockEngine = new MockEngine();

// Define the generation tasks
const tasks = [
    // Linear Algebra
    {
        subject: 'linear_algebra',
        topic: 'Determinant',
        keywords: 'determinant matrix 2x2',
        filename: 'determinant.html',
        template: VisualizationPrompts.LINEAR_ALGEBRA_VISUALIZATION
    },
    {
        subject: 'linear_algebra',
        topic: 'Eigenvalues',
        keywords: 'eigenvalues eigenvectors matrix',
        filename: 'eigenvalues.html',
        template: VisualizationPrompts.LINEAR_ALGEBRA_VISUALIZATION
    },
    {
        subject: 'linear_algebra',
        topic: 'Gaussian Elimination',
        keywords: 'gaussian elimination matrix',
        filename: 'gaussian_elimination.html',
        template: VisualizationPrompts.LINEAR_ALGEBRA_VISUALIZATION
    },
    {
        subject: 'linear_algebra',
        topic: 'Vector Spaces',
        keywords: 'vector space basis linear independence',
        filename: 'vector_spaces.html',
        template: VisualizationPrompts.LINEAR_ALGEBRA_VISUALIZATION
    },

    // Probability & Statistics
    {
        subject: 'probability_statistics',
        topic: 'Binomial Distribution',
        keywords: 'binomial distribution n=20 p=0.5',
        filename: 'binomial_distribution.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: 'Normal Distribution',
        keywords: 'normal distribution mean=0 std=1',
        filename: 'normal_distribution.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: 'Poisson Distribution',
        keywords: 'poisson distribution lambda=4',
        filename: 'poisson_distribution.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: 'Hypothesis Testing',
        keywords: 'hypothesis testing p-value t-test',
        filename: 'hypothesis_testing.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    }
];

console.log('Starting Batch Generation...\n');

tasks.forEach(task => {
    const outputDir = path.join(PROJECT_ROOT, 'generated_pages', task.subject);
    const outputPath = path.join(outputDir, task.filename);

    console.log(`Processing: [${task.subject}] ${task.topic}...`);

    // 1. Try to generate using Mock Engine
    const mockResult = mockEngine.generate(task.keywords);

    let finalHtml = '';

    // Check if Mock Engine returned a specific strategy (not the default random one)
    // We assume if the title contains "General" or "Random", it's the default.
    // In MockEngine.js: default title is '通用数据图表' or 'AI生成的随机数据分布'
    const isDefault = mockResult.title.includes('通用') || mockResult.title.includes('随机');

    if (!isDefault) {
        console.log(`  -> Mock Strategy Found: "${mockResult.title}"`);
        finalHtml = mockResult.html;
    } else {
        console.log(`  -> No Mock Strategy. Generating Prompt Template...`);
        // Generate a placeholder page with the prompt
        const promptContent = `
Task: ${task.topic}
Keywords: ${task.keywords}

--- SYSTEM PROMPT ---
${task.template}

--- USER PROMPT ---
Generate a visualization for: ${task.keywords}
`;
        
        finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Prompt for ${task.topic}</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f0f0f0; }
        .container { background: white; padding: 20px; border-radius: 8px; max-width: 800px; margin: 0 auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        pre { background: #2d2d2d; color: #ccc; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
        .note { color: #666; font-style: italic; margin-bottom: 20px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visualization Pending: ${task.topic}</h1>
        <p class="note">This topic is not yet implemented in the Mock Engine. Use the prompt below with an LLM to generate the code.</p>
        <button onclick="copyPrompt()">Copy Prompt to Clipboard</button>
        <pre id="prompt">${promptContent}</pre>
    </div>
    <script>
        function copyPrompt() {
            const text = document.getElementById('prompt').innerText;
            navigator.clipboard.writeText(text).then(() => {
                alert('Prompt copied!');
            });
        }
    </script>
</body>
</html>`;
    }

    fs.writeFileSync(outputPath, finalHtml);
    console.log(`  -> Saved to: ${task.filename}\n`);
});

console.log('Batch Generation Completed.');
