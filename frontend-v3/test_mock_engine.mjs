
import { MockEngine } from './js/utils/MockEngine.js';

const engine = new MockEngine();
const prompt = '正态分布';
console.log('Testing prompt:', prompt);

try {
  const result = engine.generate(prompt);
  console.log('Result title:', result.title);
  console.log('Result html length:', result.html.length);
  console.log('Result html start:', result.html.substring(0, 500));
  console.log('Result html end:', result.html.substring(result.html.length - 100));
} catch (error) {
  console.error('Error:', error);
}
