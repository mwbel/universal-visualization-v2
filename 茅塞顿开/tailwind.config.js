/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 学科主题色
        'chinese': '#DC2626',     // 语文 - 红色
        'math': '#7C3AED',        // 数学 - 紫色
        'english': '#0891B2',     // 英语 - 青色
        'physics': '#059669',     // 物理 - 绿色
        'chemistry': '#EA580C',   // 化学 - 橙色
        'biology': '#16A34A',     // 生物 - 草绿色
        'history': '#92400E',     // 历史 - 棕色
        'geography': '#0284C7',   // 地理 - 蓝色
        'politics': '#B91C1C',    // 政治 - 深红色
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Noto Serif SC', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}