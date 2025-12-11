/**
 * MockEngine - 模拟生成引擎
 * 负责在无 LLM 环境下，根据关键词智能匹配并生成高质量的预设可视化
 * 采用策略模式 (Strategy Pattern) 以便于扩展
 */

const PROBABILITY_DESCRIPTIONS = {
    'prob_classical': {
        definition: '古典概型（Classical Probability）是指试验中样本点有限且等可能的概率模型。',
        intuition: '就像掷骰子或抛硬币，每个结果出现的可能性是相等的。比如掷一个公平的骰子，出现6点的概率是1/6，因为总共有6个面，且每个面朝上的机会均等。',
        useCase: '适用于博彩游戏分析（如骰子、扑克）、简单的随机抽样问题、以及所有满足有限等可能假设的基础概率计算场景。',
        formula: 'P(A) = \\frac{k}{n} = \\frac{\\text{A包含的基本事件数}}{\\text{基本事件总数}}'
    },
    'prob_conditional': {
        definition: '条件概率（Conditional Probability）是指在事件A已经发生的条件下，事件B发生的概率，记为P(B|A)。',
        intuition: '当我们获得新信息（A发生）时，样本空间缩小了。比如知道掷出的点数是偶数（A），那么点数是6（B）的概率就从1/6变成了1/3。Venn图中，这表现为A与B交集面积占A面积的比例。',
        useCase: '广泛用于医疗诊断（已知症状求患病率）、垃圾邮件过滤（贝叶斯分类）、天气预报以及任何需要根据新证据更新概率的场景。',
        formula: 'P(B|A) = \\frac{P(AB)}{P(A)}'
    },
    'independent_events': {
         definition: '事件独立性是指两个事件发生互不影响，即P(AB) = P(A)P(B)。',
         intuition: '比如第一次抛硬币的结果不会影响第二次抛硬币的结果。如果事件A的发生不改变事件B发生的概率，则称A与B独立。',
         useCase: '系统可靠性分析（组件失效独立）、多次重复试验（如伯努利试验）、遗传学中的基因分离等。',
         formula: 'P(AB) = P(A)P(B)'
    },
    'prob_binomial': {
        definition: '二项分布（Binomial Distribution）描述了n次独立重复伯努利试验中成功次数k的概率分布。',
        intuition: '比如抛10次硬币，正面朝上恰好出现5次的概率。它关注的是"成功"或"失败"这种二元结果在多次试验中的累计情况。',
        useCase: '质量控制（次品率检测）、临床试验（治愈率）、用户点击率分析、投票预测等涉及"是/否"计数的问题。',
        formula: 'P(X=k) = C_n^k p^k (1-p)^{n-k}'
    },
    'prob_poisson': {
        definition: '泊松分布（Poisson Distribution）描述单位时间或空间内稀有事件发生的次数的概率分布。',
        intuition: '当n很大而p很小时，二项分布近似为泊松分布。比如一小时内来到公交站的乘客数量，或者一页书中印刷错误的字数。',
        useCase: '呼叫中心接听电话数预测、网站流量分析、放射性衰变计数、保险公司理赔次数估算等。',
        formula: 'P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}'
    },
    'prob_normal_dist': {
        definition: '正态分布（Normal Distribution），又称高斯分布，呈钟形曲线，由均值μ和方差σ²决定。',
        intuition: '自然界中许多变量（如身高、体重、考试成绩、测量误差）都呈现中间多、两头少的分布规律。68-95-99.7法则描述了数据落在均值附近的比例。',
        useCase: '误差分析、质量管理（六西格玛）、金融资产收益率建模、教育统计（标准分）以及作为中心极限定理的基础。',
        formula: 'f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'
    },
    'prob_exponential': {
        definition: '指数分布（Exponential Distribution）描述泊松过程中独立事件发生的时间间隔。',
        intuition: '它具有"无记忆性"，即已经等待了多久不影响还要等待多久。常用于描述寿命或等待时间，如电子元件的寿命、顾客到达的间隔时间。',
        useCase: '可靠性工程（产品寿命）、排队论（服务时间）、放射性粒子衰变时间等。',
        formula: 'f(x) = \\lambda e^{-\\lambda x}, \\quad x \\ge 0'
    },
    'prob_distribution_function': {
        definition: '分布函数（CDF）F(x) 定义为随机变量X小于等于x的概率，即P(X ≤ x)。',
        intuition: '它描述了随机变量落在某个值左侧的累积概率。对于连续变量，它是密度函数的积分；对于离散变量，它是概率的阶梯累加。',
        useCase: '计算区间概率 P(a < X ≤ b) = F(b) - F(a)、确定分位数（如中位数）、生存分析等。',
        formula: 'F(x) = P(X \\le x) = \\int_{-\\infty}^x f(t)dt'
    },
    'prob_continuous': {
        definition: '连续型随机变量由概率密度函数（PDF）描述，其取值充满一个区间。',
        intuition: '与离散变量不同，连续变量取单点值的概率为0，我们只能讨论它落在某个区间内的概率（即PDF曲线下的面积）。',
        useCase: '物理测量（温度、长度）、时间、金融指数等连续变化量的建模。',
        formula: 'P(a < X < b) = \\int_a^b f(x)dx'
    },
    'prob_clt': {
        definition: '中心极限定理（CLT）指出，大量独立同分布随机变量之和（或均值）近似服从正态分布，无论原分布是什么。',
        intuition: '这是统计学的基石。即使原始数据是偏态的（如掷骰子点数），只要样本量足够大，样本均值的分布就会变成钟形曲线。',
        useCase: '抽样调查（用样本均值估计总体均值）、误差分析、置信区间构造、以及解释为什么正态分布在自然界如此常见。',
        formula: '\\bar{X} \\sim N(\\mu, \\frac{\\sigma^2}{n})'
    },
    'prob_chi_square': {
        definition: '卡方分布（Chi-Square Distribution）是k个独立标准正态随机变量的平方和服从的分布。',
        intuition: '它主要用于衡量"实际观测值"与"理论期望值"之间的偏离程度（距离的平方）。自由度k决定了分布的形状。',
        useCase: '拟合优度检验（检验数据是否符合某分布）、列联表分析（独立性检验）、方差的区间估计。',
        formula: '\\chi^2 = \\sum_{i=1}^k Z_i^2'
    },
    'prob_t_test': {
        definition: 't分布（Student\'s t-distribution）用于在样本量较小且总体方差未知时，估计正态总体的均值。',
        intuition: '它比正态分布"尾巴更厚"，反映了因样本量小带来的额外不确定性。随着样本量增大，t分布逐渐趋近于标准正态分布。',
        useCase: '小样本均值检验（t检验）、比较两组数据的差异（AB测试）、构建回归系数的置信区间。',
        formula: 't = \\frac{\\bar{X} - \\mu}{S/\\sqrt{n}}'
    },
    'prob_hypothesis': {
        definition: '假设检验（Hypothesis Testing）是根据样本信息判断关于总体特征的假设是否成立的统计推断方法。',
        intuition: '基于"小概率事件原理"：如果原假设成立，那么观测到当前极端数据的概率（P值）应该很小。如果P值太小（如<0.05），我们就拒绝原假设。',
        useCase: '新药疗效验证、产品质量检验、A/B测试决策、科学实验结论验证。',
        formula: 'H_0: \\theta = \\theta_0 \\quad \\text{vs} \\quad H_1: \\theta \\neq \\theta_0'
    },
    'prob_expectation': {
        definition: '数学期望（Expectation）是随机变量取值的加权平均，方差（Variance）衡量取值的离散程度。',
        intuition: '期望是"长期的平均结果"（如赌博的平均收益），方差是"结果的波动大小"（如投资的风险）。',
        useCase: '投资组合优化（风险回报权衡）、保险精算（保费制定）、决策分析、系统误差评估。',
        formula: 'E(X) = \\sum x_i p_i \\quad \\text{or} \\quad \\int x f(x) dx'
    },
    'stats_regression': {
        definition: '线性回归（Linear Regression）是一种分析变量间线性依赖关系的统计方法。',
        intuition: '试图画一条直线穿过散点图，使得所有点到直线的距离（误差）平方和最小。斜率表示X每增加1单位，Y平均变化的量。',
        useCase: '销售预测、趋势分析、经济学建模（如消费函数）、量化变量间的相关性。',
        formula: 'Y = \\beta_0 + \\beta_1 X + \\epsilon'
    },
    'prob_regression': {
        definition: '线性回归（Linear Regression）是一种分析变量间线性依赖关系的统计方法。',
        intuition: '试图画一条直线穿过散点图，使得所有点到直线的距离（误差）平方和最小。斜率表示X每增加1单位，Y平均变化的量。',
        useCase: '销售预测、趋势分析、经济学建模（如消费函数）、量化变量间的相关性。',
        formula: 'Y = \\beta_0 + \\beta_1 X + \\epsilon'
    },
    'prob_anova': {
        definition: '方差分析（ANOVA）用于检验三个或更多组的均值是否存在显著差异。',
        intuition: '它通过比较"组间差异"（不同处理造成的影响）与"组内差异"（随机误差）的比值（F统计量）来判断。如果组间差异显著大于组内差异，说明分组有意义。',
        useCase: '比较不同药物、不同广告方案、不同生产工艺的效果差异。',
        formula: 'F = \\frac{MS_{between}}{MS_{within}}'
    },
    'prob_multi_regression': {
        definition: '多元回归（Multiple Regression）分析一个因变量与多个自变量之间的线性关系。',
        intuition: '是简单线性回归的扩展。比如预测房价，不仅看面积，还要看地段、房龄等多个因素。它能分离出每个因素在控制其他因素后的独立影响。',
        useCase: '复杂系统建模、归因分析、多因素预测（如宏观经济预测）。',
        formula: 'Y = \\beta_0 + \\beta_1 X_1 + \\dots + \\beta_p X_p + \\epsilon'
    },
    'prob_covariance': {
        definition: '协方差（Covariance）与相关系数（Correlation）衡量两个随机变量的线性相关程度。',
        intuition: '协方差为正表示同向变化，为负表示反向变化。相关系数将协方差标准化到[-1, 1]区间，1表示完全正相关，0表示不相关。',
        useCase: '金融风险分散（寻找负相关资产）、特征选择（去除冗余变量）、数据探索性分析。',
        formula: 'Cov(X,Y) = E[(X-\\mu_X)(Y-\\mu_Y)]'
    },
    'prob_sampling': {
        definition: '抽样分布（Sampling Distribution）是指统计量（如样本均值、样本方差）在多次重复抽样下的概率分布。',
        intuition: '统计量本身也是随机变量。比如每次抽查100人算平均身高，这个"平均身高"本身也会波动。了解其分布是进行推断的前提。',
        useCase: '确定置信区间、计算检验的功效、评估估计量的优良性（无偏性、有效性）。',
        formula: '\\bar{X} = \\frac{1}{n}\\sum X_i'
    },
    'prob_interval': {
        definition: '区间估计（Interval Estimation）是给出一个区间（置信区间），声称该区间包含总体参数的可信程度（置信水平）。',
        intuition: '与其说"明天下雨概率是30%"（点估计），不如说"明天下雨概率在25%到35%之间，可信度95%"。它反映了估计的精确度。',
        useCase: '民调误差范围（±3%）、产品寿命保证、科学实验结果报告。',
        formula: '\\bar{X} \\pm z_{\\alpha/2} \\frac{\\sigma}{\\sqrt{n}}'
    },
    'prob_descriptive': {
        definition: '描述性统计（Descriptive Statistics）通过图表和概括性数字（均值、中位数、方差等）描述数据的特征。',
        intuition: '直方图、箱线图能直观展示数据的分布形状、中心位置和离散程度，帮助我们快速了解数据全貌。',
        useCase: '数据清洗（发现异常值）、探索性数据分析（EDA）、汇报总结。',
        formula: '\\bar{x} = \\frac{1}{n}\\sum x_i, \\quad s^2 = \\frac{1}{n-1}\\sum(x_i - \\bar{x})^2'
    },
    'prob_estimation': {
        definition: '点估计（Point Estimation）是用样本统计量的一个具体数值来估计总体未知参数。',
        intuition: '比如用样本均值作为总体均值的估计值。矩估计和极大似然估计是两种常用的构造点估计的方法。',
        useCase: '参数拟合、模型校准、快速决策支持。',
        formula: '\\hat{\\theta} = \\arg\\max L(\\theta)'
    },
    'prob_cdf': {
         definition: '分布函数（CDF）F(x) 定义为随机变量X小于等于x的概率，即P(X ≤ x)。',
         intuition: '它描述了随机变量落在某个值左侧的累积概率。对于连续变量，它是密度函数的积分；对于离散变量，它是概率的阶梯累加。',
         useCase: '计算区间概率 P(a < X ≤ b) = F(b) - F(a)、确定分位数（如中位数）、生存分析等。',
         formula: 'F(x) = P(X \\le x)'
    }
};

export class MockEngine {
  constructor() {
    this.strategies = [
      // 1. 正弦/波形 (Math/Physics)
      {
        id: 'sine_wave',
        keywords: ['sin', '正弦', '波', 'wave', 'cosine', '余弦', '频率'],
        handler: (prompt) => {
          // 提取频率参数
          let initialFreq = 1;
          const freqMatch = prompt.match(/(?:频率|freq|frequency)\s*[:=是为]?\s*(\d+(\.\d+)?)/i) || 
                           prompt.match(/sin\(\s*(\d+(\.\d+)?)x/i);
          if (freqMatch) {
            initialFreq = parseFloat(freqMatch[1]);
          }

          return {
            title: '正弦波生成',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:10px;">
        <label>频率: <input type="range" id="freq" min="1" max="20" step="0.5" value="${initialFreq}"></label>
        <span id="freq-val">${initialFreq}</span>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const input = document.getElementById('freq');
        const valDisplay = document.getElementById('freq-val');
        function draw() {
            const f = input.value;
            valDisplay.textContent = f;
            const x = [], y = [];
            for(let i=0; i<100; i++) {
                x.push(i/10);
                y.push(Math.sin(f * i/10));
            }
            Plotly.newPlot('plot', [{x, y, type:'scatter', line:{color:'#667eea'}}], 
            {margin:{t:20,b:20,l:30,r:20}, title: \`y = sin(\${f}x)\`});
        }
        input.oninput = draw;
        draw();
    </script>
</body>
</html>`
          };
        }
      },
      
      // 2. 化学 (Chemistry)
      {
        id: 'chemistry_reaction',
        keywords: ['化学', 'chemistry', '反应', 'reaction', '浓度', 'concentration'],
        handler: (prompt) => {
          // 提取反应速率常数 k
          let initialK = 0.5;
          const matchK = prompt.match(/(?:k|常数|constant)\s*[:=是为]?\s*(\d+(\.\d+)?)/i);
          if (matchK) {
             initialK = parseFloat(matchK[1]);
          }

          return {
            title: '化学反应速率模拟',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:10px;">
        <label>反应速率常数 (k): <input type="range" id="k-val" min="0.1" max="2" step="0.1" value="${initialK}"></label>
        <span id="k-display">${initialK}</span>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const input = document.getElementById('k-val');
        const display = document.getElementById('k-display');
        function draw() {
            const k = parseFloat(input.value);
            display.textContent = k;
            const t = [], r = [], p = [];
            // A -> B, [A] = [A]0 * e^(-kt), [B] = [A]0 * (1 - e^(-kt))
            for(let i=0; i<=100; i++) {
                const time = i/10;
                t.push(time);
                r.push(100 * Math.exp(-k * time)); // Reactant
                p.push(100 * (1 - Math.exp(-k * time))); // Product
            }
            
            const trace1 = {x: t, y: r, name: '反应物 [A]', line: {color: 'red'}};
            const trace2 = {x: t, y: p, name: '生成物 [B]', line: {color: 'blue'}};
            
            Plotly.newPlot('plot', [trace1, trace2], 
            {
                margin:{t:40,b:40,l:50,r:20}, 
                title: '一级反应动力学: A → B',
                xaxis: {title: '时间 (t)'},
                yaxis: {title: '浓度 (%)'}
            });
        }
        input.oninput = draw;
        draw();
    </script>
</body>
</html>`
          };
        }
      },

      // 3. 生物 (Biology)
      {
        id: 'biology_population',
        keywords: ['生物', 'biology', '种群', 'population', 'cell', '细胞', 'growth'],
        handler: () => ({
          title: '生物种群增长模拟',
          html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const t = [], n_exp = [], n_log = [];
        const r = 0.5; // growth rate
        const K = 100; // carrying capacity
        let n0 = 2;
        
        for(let i=0; i<=50; i++) {
            t.push(i);
            // Exponential: N(t) = N0 * e^(rt)
            n_exp.push(n0 * Math.exp(r * i * 0.2));
            // Logistic: N(t) = K / (1 + ((K-N0)/N0) * e^(-rt))
            const val = K / (1 + ((K-n0)/n0) * Math.exp(-r * i * 0.2));
            n_log.push(val);
        }
        
        const trace1 = {x: t, y: n_log, name: 'Logistic增长 (S型)', line: {color: 'green', width: 3}};
        const trace2 = {x: t, y: n_exp, name: '指数增长 (J型)', line: {color: 'orange', dash: 'dot'}};
        
        Plotly.newPlot('plot', [trace1, trace2], 
        {
            margin:{t:40,b:40,l:50,r:20}, 
            title: '种群增长模型',
            xaxis: {title: '时间'},
            yaxis: {title: '种群数量', range: [0, 150]}
        });
    </script>
</body>
</html>`
        })
      },

      // 4. 经济 (Economics)
      {
        id: 'economics_supply_demand',
        keywords: ['经济', 'economics', '供需', 'supply', 'demand', 'price', '价格', 'market'],
        handler: () => ({
          title: '经济学供需曲线',
          html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        // Demand: P = a - bQ
        // Supply: P = c + dQ
        const q = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const demand = q.map(val => 100 - val); // P = 100 - Q
        const supply = q.map(val => 10 + val);  // P = 10 + Q
        
        // Equilibrium at 100-Q = 10+Q => 90=2Q => Q=45, P=55
        
        const traceD = {x: q, y: demand, name: '需求 (Demand)', line: {color: 'blue'}};
        const traceS = {x: q, y: supply, name: '供给 (Supply)', line: {color: 'red'}};
        const traceE = {x: [45], y: [55], mode: 'markers', name: '均衡点', marker: {size: 12, color: 'purple'}};
        
        Plotly.newPlot('plot', [traceD, traceS, traceE], 
        {
            margin:{t:40,b:40,l:50,r:20}, 
            title: '市场供需平衡',
            xaxis: {title: '数量 (Q)'},
            yaxis: {title: '价格 (P)'},
            hovermode: 'closest'
        });
    </script>
</body>
</html>`
        })
      },

      // 5. 数学/二次函数 (Math)
      {
        id: 'math_quadratic',
        keywords: ['二次函数', '抛物线', 'quadratic', 'parabola', 'equation', '方程'],
        handler: (prompt) => {
          // 提取参数 a, b, c
          let a = 1, b = 0, c = 0;
          
          // 尝试匹配 a=, b=, c=
          const matchA = prompt.match(/a\s*[:=是为]?\s*(-?\d+(\.\d+)?)/i);
          const matchB = prompt.match(/b\s*[:=是为]?\s*(-?\d+(\.\d+)?)/i);
          const matchC = prompt.match(/c\s*[:=是为]?\s*(-?\d+(\.\d+)?)/i);
          
          if (matchA) a = parseFloat(matchA[1]);
          if (matchB) b = parseFloat(matchB[1]);
          if (matchC) c = parseFloat(matchC[1]);
          
          // 尝试简单匹配 y=2x^2
          const matchSimple = prompt.match(/y\s*=\s*(-?\d+(\.\d+)?)x\^2/i);
          if (matchSimple && !matchA) {
             a = parseFloat(matchSimple[1]);
          }

          return {
            title: '二次函数可视化',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:10px; display: flex; gap: 10px; flex-wrap: wrap;">
        <label>a: <input type="number" id="a-val" value="${a}" step="0.1" style="width:50px"></label>
        <label>b: <input type="number" id="b-val" value="${b}" step="0.1" style="width:50px"></label>
        <label>c: <input type="number" id="c-val" value="${c}" step="0.1" style="width:50px"></label>
        <button onclick="draw()">绘制</button>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        function draw() {
            const a = parseFloat(document.getElementById('a-val').value);
            const b = parseFloat(document.getElementById('b-val').value);
            const c = parseFloat(document.getElementById('c-val').value);
            
            const x = [], y = [];
            for(let i=-10; i<=10; i+=0.1) {
                x.push(i);
                y.push(a*i*i + b*i + c);
            }
            
            const trace = {x: x, y: y, type: 'scatter', name: 'y=ax²+bx+c'};
            
            Plotly.newPlot('plot', [trace], {
                title: \`y = \${a}x² + \${b}x + \${c}\`,
                margin: {t:40,b:30,l:30,r:30}
            });
        }
        draw();
    </script>
</body>
</html>`
          };
        }
      },

      // 28. 概率统计 - 多元回归 (Multiple Regression) - Moved to top
      {
        id: 'prob_multi_regression',
        keywords: ['multiple regression', 'multivariate', '多元回归'],
        handler: (prompt) => {
            return {
                title: '多元线性回归 (3D)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:500px;"></div>
    <script>
        const n = 100;
        const x1 = [], x2 = [], y = [];
        
        for(let i=0; i<n; i++) {
            const v1 = Math.random() * 10;
            const v2 = Math.random() * 10;
            // Plane: z = 2 + 0.5*x + 0.3*y + noise
            const v3 = 2 + 0.5*v1 + 0.3*v2 + (Math.random()-0.5)*2;
            x1.push(v1);
            x2.push(v2);
            y.push(v3);
        }
        
        const tracePoints = {
            x: x1, y: x2, z: y,
            mode: 'markers', type: 'scatter3d',
            marker: {size: 3, color: y, colorscale: 'Viridis'}
        };
        
        // Plane
        const plane = {
            type: 'surface',
            x: [0, 10],
            y: [0, 10],
            z: [[2, 2+0.5*10], [2+0.3*10, 2+0.5*10+0.3*10]],
            opacity: 0.5,
            showscale: false
        };
        
        Plotly.newPlot('plot', [tracePoints], {
            title: '二元线性回归示例',
            scene: {
                xaxis: {title: 'X1'},
                yaxis: {title: 'X2'},
                zaxis: {title: 'Y'}
            }
        });
    </script>
</body>
</html>`
            };
        }
      },

      // 6. 统计/散点回归 (Statistics)
      {
        id: 'stats_regression',
        keywords: ['回归', 'regression', '散点', 'scatter', 'fitting', '线性拟合'],
        handler: (prompt) => {
          // 提取点数 (n) 和噪声水平 (noise)
          let n = 20;
          let noise = 10;
          
          // 匹配 "50个点" 或 "n=50"
          const matchN = prompt.match(/(\d+)\s*(?:个点|points|samples)/i) || prompt.match(/n\s*[:=]\s*(\d+)/i);
          if (matchN) n = parseInt(matchN[1]);
          
          // 匹配 "噪声5" 或 "noise=5"
          const matchNoise = prompt.match(/(?:噪声|noise)\s*[:=]?\s*(\d+)/i);
          if (matchNoise) noise = parseInt(matchNoise[1]);

          return {
            title: '线性回归分析',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:10px;">
        <label>样本数: <input type="number" id="n-val" value="${n}" min="5" max="100" style="width:60px"></label>
        <label>噪声: <input type="range" id="noise-val" min="0" max="50" value="${noise}"></label>
        <button onclick="generateData()">重新生成</button>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        function generateData() {
            const n = parseInt(document.getElementById('n-val').value);
            const noiseLevel = parseInt(document.getElementById('noise-val').value);
            
            // Generate noisy data y = 2x + 5 + noise
            const x = [], y = [];
            for(let i=0; i<n; i++) {
                x.push(i);
                y.push(2*i + 5 + (Math.random()-0.5)*noiseLevel);
            }
            
            // Simple linear regression
            const sumX = x.reduce((a,b)=>a+b,0);
            const sumY = y.reduce((a,b)=>a+b,0);
            const sumXY = x.reduce((a,b,i)=>a+b*y[i],0);
            const sumXX = x.reduce((a,b)=>a+b*b,0);
            
            const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
            const intercept = (sumY - slope*sumX) / n;
            
            const yPred = x.map(val => slope*val + intercept);
            
            const trace1 = {x: x, y: y, mode: 'markers', name: '观测数据'};
            const trace2 = {x: x, y: yPred, mode: 'lines', name: '回归线'};
            
            Plotly.newPlot('plot', [trace1, trace2], {
                title: \`线性回归: y = \${slope.toFixed(2)}x + \${intercept.toFixed(2)}\`,
                margin: {t:40,b:30,l:30,r:30}
            });
        }
        
        // Bind events
        document.getElementById('noise-val').onchange = generateData;
        generateData();
    </script>
</body>
</html>`
          };
        }
      },

      // 7. 3D曲面 (3D)
      {
        id: '3d_surface',
        keywords: ['3d', '三维', '曲面', 'surface', 'mesh', '立体'],
        handler: (prompt) => {
          // 提取大小 size
          let size = 100;
          const matchSize = prompt.match(/(?:大小|size|resolution)\s*[:=]?\s*(\d+)/i);
          if (matchSize) {
             size = Math.min(Math.max(parseInt(matchSize[1]), 20), 200);
          }

          return {
            title: '3D 曲面可视化',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const size = ${size};
        const x = new Array(size), y = new Array(size), z = new Array(size);
        for(var i = 0; i < size; i++) {
            x[i] = y[i] = -2 * Math.PI + 4 * Math.PI * i / size;
            z[i] = new Array(size);
        }
        for(var i = 0; i < size; i++) {
            for(var j = 0; j < size; j++) {
                var r2 = x[i]*x[i] + y[j]*y[j];
                z[i][j] = Math.sin(x[i]) * Math.cos(y[j]) * Math.sin(r2) / (Math.log(r2+1));
            }
        }
        
        var data = [{
            z: z,
            x: x,
            y: y,
            type: 'surface',
            colorscale: 'Viridis'
        }];
        
        var layout = {
            title: '3D 复杂曲面 (Size: ${size})',
            autosize: true,
            margin: {l: 0, r: 0, b: 0, t: 40}
        };
        
        Plotly.newPlot('plot', data, layout);
    </script>
</body>
</html>`
          };
        }
      },
      
      // 8. 算法/排序 (CS)
      {
        id: 'cs_sorting',
        keywords: ['排序', 'sort', '算法', 'algorithm', '冒泡', 'bubble'],
        handler: (prompt) => {
          // 提取数据量
          let count = 20;
          const matchCount = prompt.match(/(\d+)\s*(?:个|items|elements)/i) || prompt.match(/n\s*[:=]\s*(\d+)/i);
          if (matchCount) {
             count = Math.min(Math.max(parseInt(matchCount[1]), 5), 100); // 限制 5-100
          }

          return {
            title: '冒泡排序可视化',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:10px;">
        <label>数据量: <input type="number" id="count-val" value="${count}" min="5" max="50" style="width:60px"></label>
        <button onclick="reset()">重置数据</button>
        <button onclick="startSort()">开始排序</button>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        let values = [];
        let sorting = false;
        
        function reset() {
            const n = parseInt(document.getElementById('count-val').value);
            values = Array.from({length: n}, () => Math.floor(Math.random() * 100));
            draw(values);
            sorting = false;
        }
        
        function draw(data, colorIndices = []) {
            const colors = data.map((_, i) => colorIndices.includes(i) ? 'red' : '#667eea');
            Plotly.newPlot('plot', [{
                y: data,
                type: 'bar',
                marker: {color: colors}
            }], {
                title: '冒泡排序过程',
                margin: {t:40,b:30,l:30,r:30},
                yaxis: {range: [0, 100]}
            });
        }
        
        async function startSort() {
            if(sorting) return;
            sorting = true;
            const len = values.length;
            for (let i = 0; i < len; i++) {
                for (let j = 0; j < len - i - 1; j++) {
                    if(!sorting) return; // Allow interrupt
                    draw(values, [j, j+1]);
                    await new Promise(r => setTimeout(r, 50)); // Speed up slightly
                    
                    if (values[j] > values[j + 1]) {
                        let temp = values[j];
                        values[j] = values[j + 1];
                        values[j + 1] = temp;
                    }
                }
            }
            draw(values);
            sorting = false;
        }
        
        reset();
    </script>
</body>
</html>`
          };
        }
      },

      // 8.4. 线性代数 - 特征值 (Linear Algebra - Eigenvalues)
      {
        id: 'linear_algebra_eigen',
        keywords: ['特征值', 'eigenvalue', 'eigenvector', '特征向量'],
        handler: (prompt) => {
            return {
                title: '特征值与特征向量可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}
        .controls { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;}
        input { width: 60px; text-align: center; }
        .matrix-row { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="controls">
        <h3>矩阵 A (2x2)</h3>
        <div class="matrix-row">
            <input type="number" id="a" value="2" step="0.1">
            <input type="number" id="b" value="1" step="0.1">
        </div>
        <div class="matrix-row">
            <input type="number" id="c" value="1" step="0.1">
            <input type="number" id="d" value="2" step="0.1">
        </div>
        <button onclick="update()">计算并绘制</button>
        <p id="eigen-info"></p>
    </div>
    <div id="plot" style="width:100%;height:500px;"></div>
    
    <script>
        function update() {
            const a = parseFloat(document.getElementById('a').value);
            const b = parseFloat(document.getElementById('b').value);
            const c = parseFloat(document.getElementById('c').value);
            const d = parseFloat(document.getElementById('d').value);
            
            // Characteristic equation: lambda^2 - (a+d)lambda + (ad-bc) = 0
            const trace = a + d;
            const det = a*d - b*c;
            const delta = trace*trace - 4*det;
            
            let info = \`Trace: \${trace}, Det: \${det}<br>\`;
            
            let lambda1, lambda2;
            let v1 = null, v2 = null;

            if (delta >= 0) {
                lambda1 = (trace + Math.sqrt(delta)) / 2;
                lambda2 = (trace - Math.sqrt(delta)) / 2;
                info += \`特征值 λ1 = \${lambda1.toFixed(2)}, λ2 = \${lambda2.toFixed(2)}\`;
                
                // Find eigenvectors (approximate)
                // (A - lambda I)v = 0 => (a-lambda)x + by = 0
                
                function getEigenvector(lambda) {
                    if (Math.abs(b) > 1e-6) return [1, -(a-lambda)/b];
                    if (Math.abs(c) > 1e-6) return [-(d-lambda)/c, 1];
                    if (Math.abs(a-lambda) < 1e-6) return [1, 0]; // (0)x + 0y = 0
                    return [0, 1];
                }
                v1 = getEigenvector(lambda1);
                v2 = getEigenvector(lambda2);
            } else {
                info += "无实数特征值 (复数特征值)";
            }
            document.getElementById('eigen-info').innerHTML = info;

            // Visualize
            const circle_x = [], circle_y = [];
            const trans_x = [], trans_y = [];
            
            for(let t=0; t<=2*Math.PI; t+=0.1) {
                const x = Math.cos(t);
                const y = Math.sin(t);
                circle_x.push(x);
                circle_y.push(y);
                
                trans_x.push(a*x + b*y);
                trans_y.push(c*x + d*y);
            }
            
            const traces = [
                {x: circle_x, y: circle_y, mode: 'lines', name: '单位圆 (||x||=1)', line: {color: '#ddd', dash: 'dash'}},
                {x: trans_x, y: trans_y, mode: 'lines', name: '变换后 (Ax)', line: {color: 'purple'}}
            ];
            
            if (v1) {
                // Scale for visibility
                const s1 = 2; 
                traces.push({
                    x: [0, v1[0]*s1], y: [0, v1[1]*s1], mode: 'lines+markers', name: \`v1 (λ=\${lambda1.toFixed(2)})\`,
                    line: {color: 'red', width: 3}
                });
                traces.push({
                    x: [0, (a*v1[0]+b*v1[1])*s1], y: [0, (c*v1[0]+d*v1[1])*s1], mode: 'markers', name: 'Av1',
                    marker: {symbol: 'x', size: 10, color: 'red'}
                });
            }
            if (v2) {
                 const s2 = 2; 
                 traces.push({
                    x: [0, v2[0]*s2], y: [0, v2[1]*s2], mode: 'lines+markers', name: \`v2 (λ=\${lambda2.toFixed(2)})\`,
                    line: {color: 'blue', width: 3}
                });
            }

            const range = 4;
            Plotly.newPlot('plot', traces, {
                title: '线性变换与特征向量',
                xaxis: {range: [-range, range], title: 'x', scaleanchor: 'y'},
                yaxis: {range: [-range, range], title: 'y'},
                showlegend: true
            });
        }
        update();
    </script>
</body>
</html>`
            };
        }
      },

      // 8.5. 线性代数 - 高斯消元 (Gaussian Elimination)
      {
        id: 'linear_algebra_gaussian',
        keywords: ['高斯', 'gaussian', 'elimination', '消元', 'row reduction'],
        handler: (prompt) => {
            return {
                title: '高斯消元法可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}
        .matrix-container { display: flex; align-items: center; justify-content: center; margin: 20px 0; }
        .matrix { border-left: 2px solid black; border-right: 2px solid black; padding: 0 10px; border-radius: 5px; display: grid; grid-template-columns: repeat(4, 50px); gap: 5px; }
        input { width: 40px; text-align: center; padding: 5px; }
        .controls { text-align: center; margin-bottom: 20px; }
        .step { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
    </style>
</head>
<body>
    <div class="controls">
        <h3>高斯消元法 (3x3 线性方程组)</h3>
        <p>输入增广矩阵 [A|b]:</p>
        <div class="matrix-container">
            <div class="matrix" id="input-matrix">
                <!-- Row 1 -->
                <input value="2"><input value="1"><input value="-1"><input value="8">
                <!-- Row 2 -->
                <input value="-3"><input value="-1"><input value="2"><input value="-11">
                <!-- Row 3 -->
                <input value="-2"><input value="1"><input value="2"><input value="-3">
            </div>
        </div>
        <button onclick="solve()">开始消元</button>
    </div>
    <div id="steps" style="max-width: 800px; margin: 0 auto;"></div>
    
    <script>
        function getMatrix() {
            const inputs = document.querySelectorAll('#input-matrix input');
            const mat = [];
            for(let i=0; i<3; i++) {
                const row = [];
                for(let j=0; j<4; j++) {
                    row.push(parseFloat(inputs[i*4+j].value));
                }
                mat.push(row);
            }
            return mat;
        }

        function formatMatrix(mat) {
            let html = '<div class="matrix-container"><div class="matrix">';
            for(let i=0; i<3; i++) {
                for(let j=0; j<4; j++) {
                    html += \`<span>\${mat[i][j].toFixed(2)}</span>\`;
                }
            }
            html += '</div></div>';
            return html;
        }

        function solve() {
            const stepsDiv = document.getElementById('steps');
            stepsDiv.innerHTML = '';
            let mat = getMatrix();
            
            // Forward Elimination
            addStep('初始矩阵', mat);
            
            // Col 0
            if(Math.abs(mat[0][0]) < 1e-6) { /* Swap logic omitted for brevity */ }
            
            // R2 = R2 - (mat[1][0]/mat[0][0])*R1
            let f = mat[1][0] / mat[0][0];
            for(let j=0; j<4; j++) mat[1][j] -= f * mat[0][j];
            addStep(\`R2 = R2 - (\${f.toFixed(2)})R1\`, mat);
            
            // R3 = R3 - (mat[2][0]/mat[0][0])*R1
            f = mat[2][0] / mat[0][0];
            for(let j=0; j<4; j++) mat[2][j] -= f * mat[0][j];
            addStep(\`R3 = R3 - (\${f.toFixed(2)})R1\`, mat);
            
            // Col 1
            // R3 = R3 - (mat[2][1]/mat[1][1])*R2
            f = mat[2][1] / mat[1][1];
            for(let j=0; j<4; j++) mat[2][j] -= f * mat[1][j];
            addStep(\`R3 = R3 - (\${f.toFixed(2)})R2\`, mat);
            
            // Back Substitution
            const x3 = mat[2][3] / mat[2][2];
            const x2 = (mat[1][3] - mat[1][2]*x3) / mat[1][1];
            const x1 = (mat[0][3] - mat[0][2]*x3 - mat[0][1]*x2) / mat[0][0];
            
            stepsDiv.innerHTML += \`<div class="step"><h3>解:</h3><p>x1 = \${x1.toFixed(2)}<br>x2 = \${x2.toFixed(2)}<br>x3 = \${x3.toFixed(2)}</p></div>\`;
        }

        function addStep(desc, mat) {
            // Deep copy for display
            const m = JSON.parse(JSON.stringify(mat));
            const div = document.createElement('div');
            div.className = 'step';
            div.innerHTML = \`<strong>\${desc}</strong>\${formatMatrix(m)}\`;
            document.getElementById('steps').appendChild(div);
        }
    </script>
</body>
</html>`
            };
        }
      },

      // 8.6. 概率统计 - 泊松分布 (Poisson)
      {
        id: 'prob_poisson',
        keywords: ['泊松', 'poisson'],
        handler: (prompt) => {
            let lambda = 4;
            const matchL = prompt.match(/(?:lambda|λ|均值)\s*[:=]?\s*(\d+(\.\d+)?)/i);
            if(matchL) lambda = parseFloat(matchL[1]);

            return {
                title: '泊松分布 Poisson(λ)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>λ (Lambda): <input type="range" id="lambda" min="0.1" max="20" step="0.1" value="${lambda}"></label>
        <span id="val">${lambda}</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function factorial(n) {
            if (n === 0 || n === 1) return 1;
            let result = 1;
            for (let i = 2; i <= n; i++) result *= i;
            return result;
        }
        function poissonPMF(k, lambda) {
            return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
        }
        function draw() {
            const lambda = parseFloat(document.getElementById('lambda').value);
            document.getElementById('val').innerText = lambda;
            const x = [], y = [];
            for(let k=0; k<=Math.max(20, lambda*2); k++) {
                x.push(k);
                y.push(poissonPMF(k, lambda));
            }
            Plotly.newPlot('plot', [{x, y, type:'bar', marker:{color:'#38b2ac'}}], {
                title: \`Poisson(λ=\${lambda})\`,
                xaxis: {title: 'k'}, yaxis: {title: 'P(X=k)'}
            });
        }
        document.getElementById('lambda').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 8.7. 概率统计 - 假设检验 (Hypothesis Testing)
      {
        id: 'prob_hypothesis',
        keywords: ['假设检验', 'hypothesis', 'p-value', 't-test', 'z-test'],
        handler: (prompt) => {
            return {
                title: '假设检验与 P值可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <h3>Z-Test (双尾)</h3>
        <label>Z-Score (统计量): <input type="range" id="z" min="-4" max="4" step="0.1" value="1.96"></label>
        <span id="z-val">1.96</span>
        <br><br>
        <div id="result"></div>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function normalPDF(x) {
            return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
        }
        function draw() {
            const zScore = parseFloat(document.getElementById('z').value);
            document.getElementById('z-val').innerText = zScore;
            
            const x = [], y = [];
            const colors = [];
            
            for(let i = -5; i <= 5; i += 0.05) {
                x.push(i);
                y.push(normalPDF(i));
                if (Math.abs(i) >= Math.abs(zScore)) colors.push('red');
                else colors.push('#667eea');
            }
            
            // Approx P-value (simple)
            // This is just a visualization, exact calculation logic omitted for brevity
            
            Plotly.newPlot('plot', [{x, y, type:'bar', marker:{color:colors}}], {
                title: '标准正态分布与拒绝域',
                xaxis: {title: 'Z'}, yaxis: {title: 'Probability Density'}
            });
            
            document.getElementById('result').innerText = \`当 Z = \${zScore} 时，红色区域为对应的 P-value (双尾)\`;
        }
        document.getElementById('z').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 9. 线性代数 - 基础矩阵 (Linear Algebra - Basic)
      {
        id: 'linear_algebra_basic',
        keywords: ['矩阵', 'matrix', '行列式', 'determinant', '线性代数', 'linear algebra', 'linear'],
        handler: (prompt) => {
           // 默认单位矩阵
           let a=1, b=0, c=0, d=1;
           // 尝试匹配 "matrix 1 2 3 4"
           const matchMat = prompt.match(/matrix\s*[:=]?\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
           if (matchMat) {
               a = parseFloat(matchMat[1]);
               b = parseFloat(matchMat[2]);
               c = parseFloat(matchMat[3]);
               d = parseFloat(matchMat[4]);
           }

           return {
             title: '线性代数：矩阵变换与行列式',
             html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);}
        .container { display: flex; gap: 20px; flex-wrap: wrap; }
        .controls { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 250px; }
        .visualization { flex: 1; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 20px; min-width: 300px; }
        input { width: 50px; padding: 5px; margin: 5px; text-align: center; }
        .matrix-row { display: flex; justify-content: center; }
        .result { margin-top: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <h3>矩阵参数</h3>
            <p>输入 2x2 矩阵 A:</p>
            <div class="matrix-input">
                <div class="matrix-row">
                    <input type="number" id="a" value="${a}" onchange="update()">
                    <input type="number" id="b" value="${b}" onchange="update()">
                </div>
                <div class="matrix-row">
                    <input type="number" id="c" value="${c}" onchange="update()">
                    <input type="number" id="d" value="${d}" onchange="update()">
                </div>
            </div>
            <div class="result" id="det-result">
                det(A) = 1
            </div>
            <div class="result" style="font-size: 0.9em; color: #666;">
                变换基向量 i(1,0) 和 j(0,1)
            </div>
        </div>
        <div class="visualization">
            <div id="plot" style="width:100%;height:500px;"></div>
        </div>
    </div>
    <script>
        function update() {
            const a = parseFloat(document.getElementById('a').value) || 0;
            const b = parseFloat(document.getElementById('b').value) || 0;
            const c = parseFloat(document.getElementById('c').value) || 0;
            const d = parseFloat(document.getElementById('d').value) || 0;

            const det = a*d - b*c;
            document.getElementById('det-result').innerText = \`det(A) = \${det.toFixed(2)}\`;

            // Plotly traces
            const trace_i = {
                x: [0, 1], y: [0, 0], mode: 'lines+markers', name: 'i (orig)',
                line: {color: '#ddd', dash: 'dash'}
            };
            const trace_j = {
                x: [0, 0], y: [0, 1], mode: 'lines+markers', name: 'j (orig)',
                line: {color: '#ddd', dash: 'dash'}
            };

            const trace_Ti = {
                x: [0, a], y: [0, c], mode: 'lines+markers', name: 'T(i)',
                line: {color: 'red', width: 3}
            };
            const trace_Tj = {
                x: [0, b], y: [0, d], mode: 'lines+markers', name: 'T(j)',
                line: {color: 'blue', width: 3}
            };

            // Parallelogram (Area = det)
            const poly_x = [0, a, a+b, b, 0];
            const poly_y = [0, c, c+d, d, 0];
            const trace_area = {
                x: poly_x, y: poly_y, fill: 'toself', mode: 'lines',
                fillcolor: 'rgba(100, 200, 100, 0.2)',
                line: {width: 0}, showlegend: false
            };

            const range = Math.max(Math.abs(a)+Math.abs(b), Math.abs(c)+Math.abs(d), 2) * 1.2;

            Plotly.newPlot('plot', [trace_area, trace_i, trace_j, trace_Ti, trace_Tj], {
                title: '线性变换可视化',
                xaxis: {range: [-range, range], title: 'x'},
                yaxis: {range: [-range, range], title: 'y', scaleanchor: 'x'},
                showlegend: true,
                margin: {t: 40, b: 40, l: 40, r: 40}
            });
        }
        update();
    </script>
</body>
</html>`
           };
        }
      },

      // 10. 概率统计 (Probability & Statistics)
      {
        id: 'prob_normal_dist',
        keywords: ['正态分布', 'normal distribution', '高斯分布', 'gaussian'],
        handler: (prompt) => {
            let mu = 0;
            let sigma = 1;
            
            // 简单参数提取
            const matchMu = prompt.match(/(?:均值|mean|mu)\s*[:=]?\s*(-?\d+(\.\d+)?)/i);
            const matchSigma = prompt.match(/(?:方差|标准差|std|sigma)\s*[:=]?\s*(\d+(\.\d+)?)/i);
            if(matchMu) mu = parseFloat(matchMu[1]);
            if(matchSigma) sigma = parseFloat(matchSigma[1]);

            return {
                title: '正态分布可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}
        .controls { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        label { margin-right: 20px; }
    </style>
</head>
<body>
    <div class="controls">
        <h3>正态分布参数 \( N(\\mu, \\sigma^2) \)</h3>
        <label>均值 (\(\\mu\)): <input type="range" id="mu" min="-5" max="5" step="0.1" value="${mu}"></label>
        <span id="mu-val">${mu}</span>
        <br><br>
        <label>标准差 (\(\\sigma\)): <input type="range" id="sigma" min="0.1" max="5" step="0.1" value="${sigma}"></label>
        <span id="sigma-val">${sigma}</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    
    <script>
        function normalPDF(x, mu, sigma) {
            return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        }

        function draw() {
            const mu = parseFloat(document.getElementById('mu').value);
            const sigma = parseFloat(document.getElementById('sigma').value);
            
            document.getElementById('mu-val').innerText = mu;
            document.getElementById('sigma-val').innerText = sigma;

            const x = [];
            const y = [];
            // Range: [mu - 4sigma, mu + 4sigma]
            const start = -10; 
            const end = 10;
            
            for(let i = start; i <= end; i += 0.1) {
                x.push(i);
                y.push(normalPDF(i, mu, sigma));
            }

            const trace = {
                x: x, y: y, 
                type: 'scatter', 
                mode: 'lines', 
                fill: 'tozeroy',
                name: \`N(\${mu}, \${sigma}^2)\`
            };

            const layout = {
                title: '正态分布概率密度函数',
                xaxis: {title: 'x', range: [-10, 10]},
                yaxis: {title: 'Probability Density', range: [0, 1]},
                margin: {t: 40, b: 40, l: 50, r: 20}
            };

            Plotly.newPlot('plot', [trace], layout);
        }

        document.getElementById('mu').oninput = draw;
        document.getElementById('sigma').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },



      // 12. 概率统计 - 二项分布 (Probability - Binomial)
      {
        id: 'prob_binomial',
        keywords: ['二项分布', 'binomial', 'bernoulli', '伯努利', '抛硬币'],
        handler: (prompt) => {
            let n = 10;
            let p = 0.5;
            
            const matchN = prompt.match(/(?:n|次数|trials)\s*[:=]?\s*(\d+)/i);
            const matchP = prompt.match(/(?:p|概率|prob)\s*[:=]?\s*(\d+(\.\d+)?)/i);
            
            if(matchN) n = parseInt(matchN[1]);
            if(matchP) p = parseFloat(matchP[1]);

            // 动态设置最大值，确保用户输入的 n 在范围内
            const maxN = Math.max(50, Math.ceil(n * 1.2));

            return {
                title: '二项分布 B(n, p)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}
        .controls { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;}
        label { margin-right: 15px; }
    </style>
</head>
<body>
    <div class="controls">
        <h3>二项分布 B(n, p)</h3>
        <label>试验次数 (n): <input type="range" id="n" min="1" max="${maxN}" value="${n}"></label>
        <span id="n-val">${n}</span>
        <br><br>
        <label>成功概率 (p): <input type="range" id="p" min="0" max="1" step="0.01" value="${p}"></label>
        <span id="p-val">${p}</span>
    </div>
    <div id="stats"></div>
    <div id="plot" style="width:100%;height:450px;"></div>
    
    <script>
        // 使用对数伽马函数计算组合数，以支持更大的 n 值
        function logGamma(z) {
            const c = [
                57.1562356658629235, -59.5979603554754912,
                14.1360979747417471, -0.491913816097620199,
                .339946499848118887e-4, .465236289270485756e-4,
                -.983744753048795646e-4, .158088703224912494e-3,
                -.210264441724104883e-3, .217439618115212608e-3,
                -.164318106536763890e-3, .844182239838527433e-4,
                -.261908384015814087e-4, .368991826595316234e-5
            ];
            let coef = 0.99999999999980993;
            const g = 671 / 128; // 5.2421875
            let sum = 0;
            for (let i = 0; i < c.length; i++) {
                sum += c[i] / (z + i + 1);
            }
            const base = z + g + 0.5;
            return 0.5 * Math.log(2 * Math.PI) - base + (z + 0.5) * Math.log(base) + Math.log(coef + sum);
        }

        function logFactorial(n) {
            return logGamma(n + 1);
        }

        function nCr(n, r) {
            if (r < 0 || r > n) return 0;
            return Math.exp(logFactorial(n) - logFactorial(r) - logFactorial(n - r));
        }

        function binomialPMF(k, n, p) {
            // 使用对数概率计算避免精度溢出
            // log(P) = log(nCr) + k*log(p) + (n-k)*log(1-p)
            if (p === 0) return k === 0 ? 1 : 0;
            if (p === 1) return k === n ? 1 : 0;
            
            const logP = Math.log(p);
            const log1p = Math.log(1 - p);
            const logProb = (logFactorial(n) - logFactorial(k) - logFactorial(n - k)) + 
                            k * logP + (n - k) * log1p;
            return Math.exp(logProb);
        }

        function draw() {
            const n = parseInt(document.getElementById('n').value);
            const p = parseFloat(document.getElementById('p').value);
            
            document.getElementById('n-val').innerText = n;
            document.getElementById('p-val').innerText = p;

            const x = [];
            const y = [];
            
            // 为了性能，如果 n 很大，可以只绘制均值附近的点，或者全部绘制但注意性能
            // 这里全部绘制，因为 Plotly 处理几百个点没问题
            for(let k=0; k<=n; k++) {
                x.push(k);
                y.push(binomialPMF(k, n, p));
            }
            
            const mean = n * p;
            const variance = n * p * (1 - p);
            document.getElementById('stats').innerHTML = 
                \`<strong>期望 (E):</strong> \${mean.toFixed(2)} &nbsp;&nbsp; <strong>方差 (Var):</strong> \${variance.toFixed(2)}\`;

            const trace = {
                x: x, y: y, 
                type: 'bar', 
                name: \`B(\${n}, \${p})\`,
                marker: {color: '#667eea'}
            };

            const layout = {
                title: \`二项分布概率质量函数 (PMF)\`,
                xaxis: {title: '成功次数 k', tickmode: 'linear', dtick: n > 50 ? 5 : 1}, 
                yaxis: {title: '概率 P(X=k)', range: [0, Math.max(...y) * 1.1]},
                margin: {t: 40, b: 40, l: 50, r: 20}
            };

            Plotly.newPlot('plot', [trace], layout);
        }

        document.getElementById('n').oninput = draw;
        document.getElementById('p').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 13. 概率统计 - 古典概型 (Classical Probability)
      {
        id: 'prob_classical',
        keywords: ['classical', 'probability', 'dice', 'coin', 'urn', 'card', '古典概型', '掷骰子', '硬币'],
        handler: (prompt) => {
            return {
                title: '古典概型模拟 (掷骰子)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>投掷次数: <input type="number" id="n" value="100" min="10" max="10000" step="10"></label>
        <button onclick="roll()">开始投掷</button>
        <span id="result-text" style="margin-left: 20px;"></span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function roll() {
            const n = parseInt(document.getElementById('n').value);
            const counts = [0, 0, 0, 0, 0, 0];
            
            for(let i=0; i<n; i++) {
                const val = Math.floor(Math.random() * 6);
                counts[val]++;
            }
            
            const x = ['1点', '2点', '3点', '4点', '5点', '6点'];
            const y = counts.map(c => c/n); // Frequencies
            const theoretical = Array(6).fill(1/6);
            
            const trace1 = {
                x: x, y: y, type: 'bar', name: '实验频率',
                marker: {color: '#667eea', opacity: 0.7}
            };
            
            const trace2 = {
                x: x, y: theoretical, type: 'scatter', mode: 'lines', name: '理论概率 (1/6)',
                line: {color: 'red', dash: 'dash', width: 3}
            };
            
            Plotly.newPlot('plot', [trace1, trace2], {
                title: \`掷骰子模拟 (n=\${n})\`,
                yaxis: {title: '频率/概率', range: [0, Math.max(...y, 0.2) * 1.2]}
            });
            
            document.getElementById('result-text').innerText = \`实验完成，共投掷 \${n} 次\`;
        }
        roll();
    </script>
</body>
</html>`
            };
        }
      },

      // 14. 概率统计 - 条件概率与独立性 (Conditional Probability)
      {
        id: 'prob_conditional',
        keywords: ['conditional', 'bayes', 'independence', '条件概率', '贝叶斯', '独立事件', 'venn'],
        handler: (prompt) => {
            return {
                title: '条件概率 Venn 图',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>P(A): <input type="range" id="pa" min="0.1" max="0.9" step="0.05" value="0.5"></label> <span id="pa-val">0.5</span><br>
        <label>P(B): <input type="range" id="pb" min="0.1" max="0.9" step="0.05" value="0.4"></label> <span id="pb-val">0.4</span><br>
        <label>P(A∩B): <input type="range" id="pab" min="0" max="0.4" step="0.01" value="0.2"></label> <span id="pab-val">0.2</span>
        <div id="calcs" style="margin-top:10px; font-weight:bold;"></div>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function draw() {
            const pa = parseFloat(document.getElementById('pa').value);
            const pb = parseFloat(document.getElementById('pb').value);
            // Limit P(AB)
            const maxAB = Math.min(pa, pb);
            const pabInput = document.getElementById('pab');
            if(parseFloat(pabInput.value) > maxAB) pabInput.value = maxAB;
            pabInput.max = maxAB;
            
            const pab = parseFloat(pabInput.value);
            
            document.getElementById('pa-val').innerText = pa.toFixed(2);
            document.getElementById('pb-val').innerText = pb.toFixed(2);
            document.getElementById('pab-val').innerText = pab.toFixed(2);
            
            // Calc Conditional
            const p_b_given_a = pab / pa;
            const p_a_given_b = pab / pb;
            const independent = Math.abs(pab - pa*pb) < 0.01;
            
            document.getElementById('calcs').innerHTML = 
                \`P(B|A) = P(AB)/P(A) = \${p_b_given_a.toFixed(3)} <br> \` +
                \`P(A|B) = P(AB)/P(B) = \${p_a_given_b.toFixed(3)} <br> \` +
                \`独立性检验 P(AB) \${independent ? '≈' : '≠'} P(A)P(B) (\${(pa*pb).toFixed(3)}) => \${independent ? '独立' : '不独立'}\`;
            
            // Draw Venn (Approximate circles)
            // Circle A: center (-rA + intersection_offset, 0)
            // Circle B: center (rB, 0)
            // Simplified visualization using shapes
            
            const layout = {
                title: '事件 A 与 B 关系',
                xaxis: {range: [0, 10], showgrid: false, zeroline: false, showticklabels: false},
                yaxis: {range: [0, 10], showgrid: false, zeroline: false, showticklabels: false},
                shapes: [
                    // A
                    {type: 'circle', xref: 'x', yref: 'y', x0: 2, y0: 2, x1: 6, y1: 6, fillcolor: 'rgba(255, 0, 0, 0.3)', line: {color: 'red'}},
                    // B
                    {type: 'circle', xref: 'x', yref: 'y', x0: 4, y0: 2, x1: 8, y1: 6, fillcolor: 'rgba(0, 0, 255, 0.3)', line: {color: 'blue'}}
                ],
                annotations: [
                    {x: 3, y: 4, text: \`A (\${pa})\`, showarrow: false},
                    {x: 7, y: 4, text: \`B (\${pb})\`, showarrow: false},
                    {x: 5, y: 4, text: \`∩ \${pab}\`, showarrow: false}
                ]
            };
            
            Plotly.newPlot('plot', [], layout);
        }
        
        document.getElementById('pa').oninput = draw;
        document.getElementById('pb').oninput = draw;
        document.getElementById('pab').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 15. 概率统计 - 描述性统计 (Descriptive Statistics)
      {
        id: 'prob_descriptive',
        keywords: ['histogram', 'boxplot', 'descriptive', 'mean', 'median', 'mode', '直方图', '箱线图', '统计描述'],
        handler: (prompt) => {
            return {
                title: '描述性统计图表',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <button onclick="genData('normal')">生成正态分布数据</button>
        <button onclick="genData('uniform')">生成均匀分布数据</button>
        <button onclick="genData('skewed')">生成偏态数据</button>
    </div>
    <div id="plot1" style="width:100%;height:400px;"></div>
    <div id="plot2" style="width:100%;height:400px;"></div>
    <script>
        function randn_bm() {
            let u = 0, v = 0;
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }

        function genData(type) {
            let data = [];
            for(let i=0; i<500; i++) {
                if(type === 'normal') data.push(randn_bm() * 2 + 10);
                else if(type === 'uniform') data.push(Math.random() * 10 + 5);
                else if(type === 'skewed') data.push(Math.exp(randn_bm()*0.5) + 5);
            }
            
            // Histogram
            const trace1 = {x: data, type: 'histogram', name: '直方图', marker: {color: '#667eea'}};
            const layout1 = {title: '频数分布直方图', xaxis: {title: 'Value'}, yaxis: {title: 'Count'}};
            Plotly.newPlot('plot1', [trace1], layout1);
            
            // Boxplot
            const trace2 = {x: data, type: 'box', name: '数据分布', boxpoints: 'outliers', jitter: 0.3, pointpos: -1.8};
            const layout2 = {title: '箱线图 (Boxplot)', xaxis: {title: 'Value'}};
            Plotly.newPlot('plot2', [trace2], layout2);
        }
        genData('normal');
    </script>
</body>
</html>`
            };
        }
      },

      // 28. 概率统计 - 方差分析 (ANOVA)
      {
        id: 'prob_anova',
        keywords: ['anova', 'variance analysis', '方差分析', 'f-test', 'f检验', 'oneway'],
        handler: (prompt) => {
            return {
                title: '单因素方差分析 (One-Way ANOVA)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <div>
                <label>组1 均值: <input type="range" id="m1" min="0" max="10" step="0.5" value="5"></label>
            </div>
            <div>
                <label>组2 均值: <input type="range" id="m2" min="0" max="10" step="0.5" value="5"></label>
            </div>
            <div>
                <label>组3 均值: <input type="range" id="m3" min="0" max="10" step="0.5" value="7"></label>
            </div>
             <div>
                <label>组内波动 (噪声): <input type="range" id="noise" min="0.5" max="3" step="0.1" value="1"></label>
            </div>
        </div>
        <div id="stats" style="margin-top:10px;font-weight:bold;"></div>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function randn() {
            let u = 0, v = 0;
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }

        function update() {
            const m1 = parseFloat(document.getElementById('m1').value);
            const m2 = parseFloat(document.getElementById('m2').value);
            const m3 = parseFloat(document.getElementById('m3').value);
            const noise = parseFloat(document.getElementById('noise').value);
            
            const n = 20; // sample size per group
            const k = 3;  // groups
            
            const g1 = [], g2 = [], g3 = [];
            let all = [];
            
            for(let i=0; i<n; i++) {
                g1.push(m1 + randn()*noise);
                g2.push(m2 + randn()*noise);
                g3.push(m3 + randn()*noise);
            }
            all = [...g1, ...g2, ...g3];
            
            // ANOVA Calculation
            const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
            const mean1 = mean(g1), mean2 = mean(g2), mean3 = mean(g3);
            const grandMean = mean(all);
            
            // SST (Total)
            let sst = 0;
            all.forEach(x => sst += Math.pow(x - grandMean, 2));
            
            // SSW (Within)
            let ssw = 0;
            g1.forEach(x => ssw += Math.pow(x - mean1, 2));
            g2.forEach(x => ssw += Math.pow(x - mean2, 2));
            g3.forEach(x => ssw += Math.pow(x - mean3, 2));
            
            // SSB (Between)
            const ssb = n * (Math.pow(mean1 - grandMean, 2) + Math.pow(mean2 - grandMean, 2) + Math.pow(mean3 - grandMean, 2));
            
            const dfBetween = k - 1;
            const dfWithin = k*n - k;
            
            const msb = ssb / dfBetween;
            const msw = ssw / dfWithin;
            
            const f = msb / msw;
            
            document.getElementById('stats').innerHTML = 
                \`F-Statistic = \${f.toFixed(2)} (越大表示组间差异越显著)<br>\` + 
                \`MSB(组间) = \${msb.toFixed(2)}, MSW(组内) = \${msw.toFixed(2)}\`;
            
            const trace1 = {y: g1, type: 'box', name: 'Group 1', boxpoints: 'all', jitter: 0.3};
            const trace2 = {y: g2, type: 'box', name: 'Group 2', boxpoints: 'all', jitter: 0.3};
            const trace3 = {y: g3, type: 'box', name: 'Group 3', boxpoints: 'all', jitter: 0.3};
            
            Plotly.newPlot('plot', [trace1, trace2, trace3], {
                title: '单因素方差分析数据分布',
                yaxis: {title: 'Value'}
            });
        }
        
        document.querySelectorAll('input').forEach(el => el.oninput = update);
        update();
    </script>
</body>
</html>`
            };
        }
      },

      // 16. 概率统计 - 期望与方差 (Expectation & Variance)
      {
        id: 'prob_expectation',
        keywords: ['expectation', 'variance', 'standard deviation', '期望', '方差', '标准差', 'moment', 'mean'],
        handler: (prompt) => {
            return {
                title: '随机变量的数字特征',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <p>调整离散随机变量 X 的分布律 P(X=k):</p>
        <div style="display:flex;gap:20px;">
            <label>P(X=1): <input type="range" class="prob-input" data-idx="0" min="0" max="1" step="0.1" value="0.2"></label>
            <label>P(X=2): <input type="range" class="prob-input" data-idx="1" min="0" max="1" step="0.1" value="0.3"></label>
            <label>P(X=3): <input type="range" class="prob-input" data-idx="2" min="0" max="1" step="0.1" value="0.5"></label>
        </div>
        <p style="font-size:0.9em;color:#666;">(自动归一化)</p>
        <div id="stats" style="font-weight:bold;margin-top:10px;"></div>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        const inputs = document.querySelectorAll('.prob-input');
        
        function update() {
            let probs = Array.from(inputs).map(input => parseFloat(input.value));
            const sum = probs.reduce((a,b)=>a+b, 0);
            if(sum > 0) probs = probs.map(p => p/sum); // Normalize
            
            const x = [1, 2, 3];
            let mean = 0;
            let variance = 0;
            
            // E(X)
            for(let i=0; i<3; i++) mean += x[i] * probs[i];
            
            // Var(X) = E(X^2) - (E(X))^2
            for(let i=0; i<3; i++) variance += Math.pow(x[i] - mean, 2) * probs[i];
            const std = Math.sqrt(variance);
            
            document.getElementById('stats').innerHTML = 
                \`E(X) = \${mean.toFixed(2)} &nbsp;&nbsp; Var(X) = \${variance.toFixed(2)} &nbsp;&nbsp; σ(X) = \${std.toFixed(2)}\`;
            
            const trace = {
                x: x, y: probs, type: 'bar', width: 0.3,
                marker: {color: '#667eea'}
            };
            
            const layout = {
                title: '离散型随机变量分布律',
                xaxis: {title: 'X', tickvals: [1,2,3]},
                yaxis: {title: 'Probability', range: [0, 1]},
                shapes: [
                    // Mean line
                    {type: 'line', x0: mean, y0: 0, x1: mean, y1: 1, line: {color: 'red', dash: 'dash', width: 2}}
                ],
                annotations: [
                    {x: mean, y: 1, text: 'E(X)', showarrow: true, arrowhead: 2, ax: 0, ay: -20, font: {color: 'red'}}
                ]
            };
            
            Plotly.newPlot('plot', [trace], layout);
        }
        
        inputs.forEach(input => input.oninput = update);
        update();
    </script>
</body>
</html>`
            };
        }
      },

      // 17. 概率统计 - 中心极限定理与大数定律 (CLT & LLN)
      {
        id: 'prob_clt',
        keywords: ['clt', 'central limit', 'law of large numbers', 'lln', '中心极限定理', '大数定律', 'average'],
        handler: (prompt) => {
            return {
                title: '中心极限定理演示',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <p>总体分布: 均匀分布 U(0,1)</p>
        <label>样本容量 (n): <input type="range" id="n" min="1" max="50" step="1" value="2"></label> <span id="n-val">2</span>
        <br>
        <label>模拟次数 (N): <input type="number" id="N" value="1000" step="100"></label>
        <button onclick="simulate()">开始模拟</button>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function simulate() {
            const n = parseInt(document.getElementById('n').value);
            const N = parseInt(document.getElementById('N').value);
            document.getElementById('n-val').innerText = n;
            
            const means = [];
            for(let i=0; i<N; i++) {
                let sum = 0;
                for(let j=0; j<n; j++) sum += Math.random();
                means.push(sum / n);
            }
            
            // Theoretical Normal: mean = 0.5, var = (1/12)/n
            const mu = 0.5;
            const sigma = Math.sqrt((1/12)/n);
            
            // Plot Histogram
            const trace1 = {
                x: means, type: 'histogram', histnorm: 'probability density', 
                name: '样本均值分布', marker: {color: '#667eea', opacity: 0.7}
            };
            
            // Plot Normal Curve
            const x_norm = [], y_norm = [];
            for(let x = 0; x <= 1; x += 0.01) {
                x_norm.push(x);
                y_norm.push((1/(sigma*Math.sqrt(2*Math.PI))) * Math.exp(-0.5 * Math.pow((x-mu)/sigma, 2)));
            }
            
            const trace2 = {
                x: x_norm, y: y_norm, type: 'scatter', mode: 'lines', 
                name: \`N(0.5, \${sigma.toFixed(3)}^2)\`, line: {color: 'red', width: 2}
            };
            
            Plotly.newPlot('plot', [trace1, trace2], {
                title: \`样本均值的分布 (n=\${n})\`,
                xaxis: {title: '均值', range: [0, 1]},
                yaxis: {title: 'Density'}
            });
        }
        document.getElementById('n').oninput = simulate;
        simulate();
    </script>
</body>
</html>`
            };
        }
      },

      // 18. 概率统计 - 卡方分布 (Chi-Square)
      {
        id: 'prob_chi_square',
        keywords: ['chi-square', 'chi2', '卡方', 'distribution'],
        handler: (prompt) => {
            let df = 5;
            const matchDf = prompt.match(/(?:df|自由度)\s*[:=]?\s*(\d+)/i);
            if(matchDf) df = parseInt(matchDf[1]);

            return {
                title: '卡方分布 χ²(n)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>自由度 (df): <input type="range" id="df" min="1" max="20" step="1" value="${df}"></label>
        <span id="df-val">${df}</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function gamma(n) {
            // Lanczos approximation for Gamma function
            var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
                     771.32342877765313, -176.61502916214059, 12.507343278686905,
                     -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
            var g = 7;
            if(n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
            n -= 1;
            var a = p[0];
            var t = n + g + 0.5;
            for(var i = 1; i < p.length; i++) a += p[i] / (n + i);
            return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * a;
        }

        function chiSquarePDF(x, k) {
            if (x <= 0) return 0;
            return (Math.pow(x, k/2 - 1) * Math.exp(-x/2)) / (Math.pow(2, k/2) * gamma(k/2));
        }

        function draw() {
            const df = parseInt(document.getElementById('df').value);
            document.getElementById('df-val').innerText = df;
            
            const x = [], y = [];
            for(let i=0.1; i<=30; i+=0.1) {
                x.push(i);
                y.push(chiSquarePDF(i, df));
            }
            
            const trace = {
                x: x, y: y, type: 'scatter', mode: 'lines', fill: 'tozeroy',
                name: \`χ²(\${df})\`, line: {color: '#d69e2e'}
            };
            
            Plotly.newPlot('plot', [trace], {
                title: '卡方分布概率密度函数',
                xaxis: {title: 'x', range: [0, 30]},
                yaxis: {title: 'Density'}
            });
        }
        document.getElementById('df').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 19. 概率统计 - T分布 (T-Distribution)
      {
        id: 'prob_t_test',
        keywords: ['t-distribution', 't-test', 'student', 't分布', 't检验'],
        handler: (prompt) => {
            return {
                title: 'T 分布与标准正态分布',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>自由度 (df): <input type="range" id="df" min="1" max="30" step="1" value="2"></label>
        <span id="df-val">2</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function gamma(n) {
            // Simplified Gamma for half-integers is okay, but using Lanczos for generality
             var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
                     771.32342877765313, -176.61502916214059, 12.507343278686905,
                     -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
            var g = 7;
            if(n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
            n -= 1;
            var a = p[0];
            var t = n + g + 0.5;
            for(var i = 1; i < p.length; i++) a += p[i] / (n + i);
            return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * a;
        }

        function tPDF(x, v) {
            return (gamma((v+1)/2) / (Math.sqrt(v*Math.PI) * gamma(v/2))) * Math.pow(1 + x*x/v, -(v+1)/2);
        }
        function normalPDF(x) {
            return (1/Math.sqrt(2*Math.PI)) * Math.exp(-0.5*x*x);
        }

        function draw() {
            const df = parseInt(document.getElementById('df').value);
            document.getElementById('df-val').innerText = df;
            
            const x = [], y_t = [], y_n = [];
            for(let i=-5; i<=5; i+=0.1) {
                x.push(i);
                y_t.push(tPDF(i, df));
                y_n.push(normalPDF(i));
            }
            
            const traceT = {
                x: x, y: y_t, type: 'scatter', mode: 'lines', name: \`t(df=\${df})\`,
                line: {color: 'blue', width: 3}
            };
            const traceN = {
                x: x, y: y_n, type: 'scatter', mode: 'lines', name: 'N(0,1)',
                line: {color: 'gray', dash: 'dash'}
            };
            
            Plotly.newPlot('plot', [traceT, traceN], {
                title: 'T分布 vs 标准正态分布',
                xaxis: {title: 'x', range: [-5, 5]},
                yaxis: {title: 'Density'}
            });
        }
        document.getElementById('df').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 20. 概率统计 - 参数估计 (Estimation)
      {
        id: 'prob_estimation',
        keywords: ['estimation', 'confidence interval', 'mle', '估计', '置信区间', '点估计'],
        handler: (prompt) => {
            return {
                title: '置信区间模拟 (Confidence Intervals)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <p>总体: N(0, 1). 抽取 20 个样本，重复 50 次.</p>
        <label>置信水平 (1-α): <select id="alpha"><option value="1.645">90%</option><option value="1.96" selected>95%</option><option value="2.576">99%</option></select></label>
        <button onclick="simulate()">重新模拟</button>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function randn() {
            let u = 0, v = 0;
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }

        function simulate() {
            const z = parseFloat(document.getElementById('alpha').value);
            const n = 20; // sample size
            const trials = 50;
            const sigma = 1; // known
            
            const shapes = [];
            const x = [], y = [];
            let covered = 0;
            
            for(let i=0; i<trials; i++) {
                // Sample n
                let sum = 0;
                for(let j=0; j<n; j++) sum += randn();
                const mean = sum / n;
                
                // CI
                const margin = z * sigma / Math.sqrt(n);
                const lower = mean - margin;
                const upper = mean + margin;
                
                const isCovered = (lower <= 0 && upper >= 0);
                if(isCovered) covered++;
                
                shapes.push({
                    type: 'line',
                    x0: lower, x1: upper,
                    y0: i, y1: i,
                    line: {color: isCovered ? '#667eea' : 'red', width: 2}
                });
                // Mean dot
                shapes.push({
                    type: 'circle',
                    x0: mean-0.05, x1: mean+0.05,
                    y0: i-0.3, y1: i+0.3,
                    fillcolor: 'black', line: {width: 0}
                });
            }
            
            // True mean line
            shapes.push({
                type: 'line', x0: 0, x1: 0, y0: -1, y1: trials,
                line: {color: 'green', width: 2, dash: 'dash'}
            });
            
            Plotly.newPlot('plot', [], {
                title: \`置信区间模拟 (覆盖率: \${covered}/\${trials} = \${(covered/trials*100).toFixed(1)}%)\`,
                xaxis: {title: 'Estimate', range: [-2, 2]},
                yaxis: {title: 'Trial', range: [-1, trials]},
                shapes: shapes,
                showlegend: false
            });
        }
        document.getElementById('alpha').onchange = simulate;
        simulate();
    </script>
</body>
</html>`
            };
        }
      },



      // 22. 概率统计 - 协方差与相关系数 (Covariance)
      {
        id: 'prob_covariance',
        keywords: ['covariance', 'correlation', 'scatter', '协方差', '相关系数', 'cor'],
        handler: (prompt) => {
            return {
                title: '相关性可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>相关系数 (r): <input type="range" id="r" min="-1" max="1" step="0.1" value="0.8"></label>
        <span id="r-val">0.8</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function randn() {
            let u = 0, v = 0;
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }

        function draw() {
            const r = parseFloat(document.getElementById('r').value);
            document.getElementById('r-val').innerText = r;
            
            const n = 200;
            const x = [];
            const y = [];
            
            for(let i=0; i<n; i++) {
                const z1 = randn();
                const z2 = randn();
                
                x.push(z1);
                // y = r*z1 + sqrt(1-r^2)*z2
                y.push(r * z1 + Math.sqrt(1 - r*r) * z2);
            }
            
            const trace = {
                x: x, y: y, mode: 'markers', type: 'scatter',
                marker: {color: '#667eea', opacity: 0.6}
            };
            
            Plotly.newPlot('plot', [trace], {
                title: \`相关系数 r = \${r}\`,
                xaxis: {title: 'X', range: [-4, 4]},
                yaxis: {title: 'Y', range: [-4, 4], scaleanchor: 'x'}
            });
        }
        document.getElementById('r').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 23. 概率统计 - 分布函数 (CDF)
      {
        id: 'prob_cdf',
        keywords: ['cdf', 'distribution function', 'cumulative', '分布函数', '累积分布'],
        handler: (prompt) => {
            return {
                title: '累积分布函数 (CDF)',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>分布类型: 
            <select id="dist" onchange="draw()">
                <option value="normal">正态分布</option>
                <option value="exponential">指数分布</option>
            </select>
        </label>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function normalCDF(x, mu, sigma) {
            return 0.5 * (1 + Math.erf((x - mu) / (sigma * Math.sqrt(2))));
        }
        // Polyfill for Math.erf if needed
        if (!Math.erf) {
            Math.erf = function(x) {
                var sign = (x >= 0) ? 1 : -1;
                x = Math.abs(x);
                var a1 =  0.254829592;
                var a2 = -0.284496736;
                var a3 =  1.421413741;
                var a4 = -1.453152027;
                var a5 =  1.061405429;
                var p  =  0.3275911;
                var t = 1.0 / (1.0 + p*x);
                var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
                return sign*y;
            };
        }

        function expCDF(x, lambda) {
            return x < 0 ? 0 : 1 - Math.exp(-lambda * x);
        }

        function draw() {
            const type = document.getElementById('dist').value;
            const x = [], y = [];
            
            if (type === 'normal') {
                for(let i=-4; i<=4; i+=0.1) {
                    x.push(i);
                    y.push(normalCDF(i, 0, 1));
                }
            } else {
                for(let i=0; i<=5; i+=0.1) {
                    x.push(i);
                    y.push(expCDF(i, 1));
                }
            }
            
            const trace = {
                x: x, y: y, type: 'scatter', mode: 'lines', fill: 'tozeroy',
                name: 'CDF'
            };
            
            Plotly.newPlot('plot', [trace], {
                title: type === 'normal' ? '标准正态分布 CDF' : '指数分布 CDF (λ=1)',
                yaxis: {title: 'Probability', range: [0, 1.1]}
            });
        }
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 24. 概率统计 - 连续型随机变量 (Continuous PDF)
      {
        id: 'prob_continuous',
        keywords: ['pdf', 'probability density', 'continuous', '连续型', '概率密度'],
        handler: (prompt) => {
            return {
                title: '连续型随机变量 PDF',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <p>展示概率密度函数 f(x) 与概率 P(a < X < b) 的关系 (面积)</p>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function pdf(x) {
            // Mixture of two gaussians for interesting shape
            return 0.3 * Math.exp(-0.5 * Math.pow(x+2, 2)) + 0.7 * Math.exp(-0.5 * Math.pow(x-2, 2));
        }
        
        const x = [], y = [];
        for(let i=-6; i<=6; i+=0.1) {
            x.push(i);
            y.push(pdf(i));
        }
        
        const trace = {
            x: x, y: y, type: 'scatter', mode: 'lines', fill: 'tozeroy',
            name: 'f(x)'
        };
        
        Plotly.newPlot('plot', [trace], {
            title: '概率密度函数示意图',
            yaxis: {title: 'Density'}
        });
    </script>
</body>
</html>`
            };
        }
      },

      // 25. 概率统计 - 抽样分布 (Sampling)
      {
        id: 'prob_sampling',
        keywords: ['sampling distribution', 'sample mean', '抽样分布', '样本统计量'],
        handler: (prompt) => {
            return {
                title: '抽样分布演示',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>样本量 n: <input type="range" id="n" min="2" max="100" value="5"></label> <span id="n-val">5</span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function update() {
            const n = parseInt(document.getElementById('n').value);
            document.getElementById('n-val').innerText = n;
            
            // Theoretical sampling distribution of mean from Uniform(0,1)
            // Mean = 0.5, Var = 1/(12n)
            const sigma = Math.sqrt(1/(12*n));
            
            const x = [];
            const y = [];
            for(let i=0; i<=1; i+=0.01) {
                x.push(i);
                y.push((1/(sigma*Math.sqrt(2*Math.PI))) * Math.exp(-0.5 * Math.pow((i-0.5)/sigma, 2)));
            }
            
            const trace = {
                x: x, y: y, type: 'scatter', mode: 'lines', fill: 'tozeroy',
                name: \`Sample Mean Dist (n=\${n})\`
            };
            
            Plotly.newPlot('plot', [trace], {
                title: '样本均值的抽样分布',
                xaxis: {range: [0, 1]},
                yaxis: {title: 'Density'}
            });
        }
        document.getElementById('n').oninput = update;
        update();
    </script>
</body>
</html>`
            };
        }
      },

      // 26. 概率统计 - 假设检验流程 (Hypothesis Testing)
      {
        id: 'prob_hypothesis',
        keywords: ['hypothesis', 'p-value', 'null hypothesis', '假设检验', '原假设', 'p值'],
        handler: (prompt) => {
            return {
                title: '假设检验 (Z-Test) 可视化',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <label>检验统计量 Z: <input type="range" id="z" min="-4" max="4" step="0.1" value="1.5"></label> <span id="z-val">1.5</span>
        <br>
        <div id="res" style="font-weight:bold;margin-top:10px;"></div>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function normalPDF(x) {
            return (1/Math.sqrt(2*Math.PI)) * Math.exp(-0.5*x*x);
        }
        function draw() {
            const z = parseFloat(document.getElementById('z').value);
            document.getElementById('z-val').innerText = z;
            
            const x = [], y = [];
            
            for(let i=-4; i<=4; i+=0.05) {
                x.push(i);
                y.push(normalPDF(i));
            }
            
            const traceMain = {
                x: x, y: y, type: 'scatter', mode: 'lines', name: 'H0 Distribution',
                line: {color: 'black'}
            };
            
            const shapes = [
                {type: 'line', x0: z, x1: z, y0: 0, y1: normalPDF(z), line: {color: 'red', width: 2}},
                {type: 'line', x0: -z, x1: -z, y0: 0, y1: normalPDF(z), line: {color: 'red', width: 2, dash: 'dot'}}
            ];
            
            Plotly.newPlot('plot', [traceMain], {
                title: '双侧检验示意图',
                shapes: shapes
            });
            
            document.getElementById('res').innerText = \`统计量 Z = \${z}\`;
        }
        document.getElementById('z').oninput = draw;
        draw();
    </script>
</body>
</html>`
            };
        }
      },

      // 27. 概率统计 - 线性回归 (Linear Regression)
      {
        id: 'prob_regression',
        keywords: ['linear regression', 'least squares', '线性回归', '最小二乘'],
        handler: (prompt) => {
            return {
                title: '一元线性回归',
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:20px;font-family:'Segoe UI', sans-serif;}</style>
</head>
<body>
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
        <button onclick="genData()">重新生成数据</button>
        <span id="eq" style="margin-left:20px;font-weight:bold;"></span>
    </div>
    <div id="plot" style="width:100%;height:450px;"></div>
    <script>
        function genData() {
            const n = 50;
            const x = [], y = [];
            const beta0 = 2, beta1 = 0.5;
            
            let sumX=0, sumY=0, sumXY=0, sumXX=0;
            
            for(let i=0; i<n; i++) {
                const xi = Math.random() * 10;
                const yi = beta0 + beta1 * xi + (Math.random() - 0.5) * 2;
                x.push(xi);
                y.push(yi);
                
                sumX += xi; sumY += yi; sumXY += xi*yi; sumXX += xi*xi;
            }
            
            // Least Squares
            const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
            const intercept = (sumY - slope*sumX) / n;
            
            document.getElementById('eq').innerText = \`y = \${intercept.toFixed(2)} + \${slope.toFixed(2)}x\`;
            
            const tracePoints = {
                x: x, y: y, mode: 'markers', type: 'scatter', name: 'Data'
            };
            
            const traceLine = {
                x: [0, 10], y: [intercept, intercept + slope*10],
                mode: 'lines', type: 'scatter', name: 'Fit', line: {color: 'red'}
            };
            
            Plotly.newPlot('plot', [tracePoints, traceLine], {
                title: '线性回归拟合'
            });
        }
        genData();
    </script>
</body>
</html>`
            };
        }
      },


    ];
  }

  /**
   * 生成 Mock 数据
   * @param {string} prompt 用户输入
   * @returns {object} { title, html }
   */
  generate(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    // 1. 尝试匹配策略
    for (const strategy of this.strategies) {
      if (strategy.keywords.some(k => lowerPrompt.includes(k))) {
        let result = strategy.handler(prompt);
        
        // Inject Standardized Layout if description is available
        if (PROBABILITY_DESCRIPTIONS[strategy.id]) {
            const desc = PROBABILITY_DESCRIPTIONS[strategy.id];
            
            // Extract the original content body (approximate extraction)
            let originalContent = result.html;
            // Remove <html>, <head>, <body> tags to get inner content if possible, 
            // but since we are replacing the whole structure, let's just extract the script and specific divs if we can.
            // Actually, a safer way is to inject styles and prepend/append sections to the existing body.
            
            // 1. Define Global Styles (Low Saturation Blue-Grey Theme)
            const styleBlock = `
            <style>
                :root {
                    --primary-color: #5B8CBA; /* Low saturation Blue-Grey */
                    --bg-color: #f8f9fa;
                    --text-color: #2c3e50;
                    --border-color: #e2e8f0;
                }
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    color: var(--text-color);
                    background: #ffffff;
                    font-size: 17px;
                    line-height: 1.6;
                }
                h1, h2, h3 {
                    color: var(--primary-color);
                    margin-top: 0;
                }
                h1 { font-size: 24px; }
                h2 { font-size: 22px; }
                h3 { font-size: 20px; }
                
                .section-container {
                    margin-bottom: 32px;
                    text-align: left;
                }
                
                .intro-box {
                    background: #f1f5f9; /* Very light blue-grey */
                    padding: 24px;
                    border-radius: 8px;
                    border-left: 5px solid var(--primary-color);
                }
                
                .mathjax-block {
                    padding: 15px;
                    background: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 15px 0;
                }
                
                .control-panel {
                    background: #ffffff;
                    padding: 20px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                
                input[type=range] {
                    accent-color: var(--primary-color);
                }
                
                button {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    opacity: 0.9;
                }
            </style>
            <!-- Load MathJax -->
            <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']]
              },
              svg: {
                fontCache: 'global'
              }
            };
            </script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            `;
            
            // 2. Build New Header Sections
            const headerHtml = `
            <div class="section-container intro-box">
                <h2 style="margin-bottom: 15px;">📖 一言以蔽之</h2>
                <p style="font-size: 18px; font-weight: 500;">${desc.intuition}</p>
                
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 18px; color: #64748b;">🛠️ 适用场景</h3>
                    <p>${desc.useCase}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 18px; color: #64748b;">📐 基础知识</h3>
                    <p>${desc.definition}</p>
                    <div class="mathjax-block">
                        $$ ${desc.formula || ''} $$
                    </div>
                </div>
            </div>
            
            <div class="section-container">
                <h2>🎛️ 参数探索与可视化</h2>
            `;
            
            const footerHtml = `
            </div>
            `;

            // Inject Style
            if (result.html.includes('</head>')) {
                result.html = result.html.replace('</head>', () => `${styleBlock}</head>`);
            }
            
            // Inject Header after Body
            if (result.html.includes('<body>')) {
                result.html = result.html.replace('<body>', () => `<body>\n<h1 style="font-size: 28px; color: var(--primary-color); margin-bottom: 24px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">${result.title}</h1>\n${headerHtml}`);
            }
            
            // Inject Footer before /Body
            if (result.html.includes('</body>')) {
                result.html = result.html.replace('</body>', () => `${footerHtml}\n</body>`);
            }
        }
        return result;
      }
    }
    
    // 2. 默认降级策略 (随机数据)
    return this.generateDefault();
  }

  generateDefault() {
    return {
      title: '通用数据图表',
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
</head>
<body>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const trace1 = {
            x: Array.from({length: 50}, () => Math.random()),
            y: Array.from({length: 50}, () => Math.random()),
            mode: 'markers',
            type: 'scatter',
            marker: { size: 12, color: Array.from({length: 50}, () => Math.random()), colorscale: 'Viridis' }
        };
        Plotly.newPlot('plot', [trace1], {
            title: 'AI生成的随机数据分布',
            margin: {t:30,b:30,l:30,r:30}
        });
    </script>
</body>
</html>`
    };
  }
}
