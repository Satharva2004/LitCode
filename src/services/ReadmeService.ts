import { analyzeComplexityWithApi, ComplexityResult } from './ComplexityAnalyzerService';
import { QuestionDifficulty } from '../types/Question';

type ReadmeInput = {
  title: string;
  slug: string;
  difficulty: QuestionDifficulty;
  problemContent: string;
  code: string;
  language: string;
  runtimeDisplay: string;
  memoryDisplay: string;
  runtimePercentile?: number;
  memoryPercentile?: number;
};

const decodeHtml = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const cleanProblemContent = (html: string) =>
  decodeHtml(html)
    .replace(/<pre>/g, '\n```text\n')
    .replace(/<\/pre>/g, '\n```\n')
    .replace(/<code>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<li>/g, '\n- ')
    .replace(/<\/li>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const codeFenceLanguage = (language: string) => {
  const normalized = language.toLowerCase();
  if (normalized.includes('python')) return 'py';
  if (normalized.includes('javascript')) return 'js';
  if (normalized.includes('typescript')) return 'ts';
  if (normalized.includes('c++')) return 'cpp';
  if (normalized.includes('c#')) return 'csharp';
  return normalized.replace(/[^a-z0-9]/g, '') || 'text';
};

const escapePipes = (value: string) => value.replace(/\|/g, '\\|');


const rawCurve = (complexity: string) => {
  const normalized = complexity.toLowerCase().replace(/\s+/g, '');
  const inputs = [1, 2, 4, 8, 16, 32];

  if (normalized.includes('o(1)') || normalized.includes('constant')) return inputs.map(() => 1);
  if (normalized.includes('logn')) return inputs.map((n) => Math.log2(n) + 1);
  if (normalized.includes('nlogn') || normalized.includes('n*logn')) {
    return inputs.map((n) => n * (Math.log2(n) + 1));
  }
  if (normalized.includes('n^2')) return inputs.map((n) => n * n);
  if (normalized.includes('n^3')) return inputs.map((n) => n * n * n);
  if (normalized.includes('2^n') || normalized.includes('exponential')) {
    return inputs.map((n) => Math.min(2 ** n, 4096));
  }
  return inputs;
};

const normalizedCurve = (complexity: string) => {
  const values = rawCurve(complexity);
  const max = Math.max(...values, 1);
  return values.map((value) => Math.max(1, Math.round((value / max) * 100)));
};

const complexityChart = (label: string, complexity: string, color: string, fill: string) => {
  const labels = [1, 2, 4, 8, 16, 32];
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${label} ${complexity}`,
          data: normalizedCurve(complexity),
          borderColor: color,
          backgroundColor: fill,
          borderWidth: 3,
          pointRadius: 3,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `${label}: ${complexity}`,
        fontSize: 14,
        fontColor: '#111827',
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 10,
          fontSize: 10,
        },
      },
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: 'input size n',
            },
            gridLines: {
              color: 'rgba(17,24,39,0.08)',
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              min: 0,
              max: 100,
              stepSize: 25,
            },
            scaleLabel: {
              display: true,
              labelString: 'relative cost',
            },
            gridLines: {
              color: 'rgba(17,24,39,0.08)',
            },
          },
        ],
      },
    },
  };
  const chartUrl = `https://quickchart.io/chart?width=310&height=190&backgroundColor=white&c=${encodeURIComponent(
    JSON.stringify(config),
  )}`;

  return `<img src="${chartUrl}" width="310" alt="${label} complexity graph for ${complexity}" />`;
};

const formatPercentile = (percentile?: number) =>
  typeof percentile === 'number' && Number.isFinite(percentile) ? `${percentile.toFixed(2)}%` : 'Not reported';

const renderReadme = (input: ReadmeInput, complexity: ComplexityResult) => {
  const problem = cleanProblemContent(input.problemContent);
  const language = codeFenceLanguage(input.language);
  const runtimePercentile = formatPercentile(input.runtimePercentile);
  const memoryPercentile = formatPercentile(input.memoryPercentile);

  return `<div align="center">

# ${input.title}

[![Difficulty](https://img.shields.io/badge/${input.difficulty}-${input.difficulty === 'Easy' ? '2ea44f' : input.difficulty === 'Medium' ? 'f59e0b' : 'ef4444'}?style=flat-square)](https://leetcode.com/problems/${input.slug})
![Language](https://img.shields.io/badge/${encodeURIComponent(input.language)}-111111?style=flat-square)
![Runtime](https://img.shields.io/badge/${encodeURIComponent(input.runtimeDisplay)}-ff5a1f?style=flat-square)
![Runtime Beats](https://img.shields.io/badge/beats-${encodeURIComponent(runtimePercentile)}-22c55e?style=flat-square)
![Memory](https://img.shields.io/badge/${encodeURIComponent(input.memoryDisplay)}-2563eb?style=flat-square)
![Memory Beats](https://img.shields.io/badge/beats-${encodeURIComponent(memoryPercentile)}-22c55e?style=flat-square)

</div>

## Quick View

| Problem | Difficulty | Language | Runtime | Memory |
| --- | --- | --- | --- | --- |
| [${input.title}](https://leetcode.com/problems/${input.slug}) | ${input.difficulty} | ${input.language} | ${input.runtimeDisplay} | ${input.memoryDisplay} |

## Performance

| Metric | Your result | Standing |
| --- | --- | --- |
| Runtime | **${input.runtimeDisplay}** | Beats **${runtimePercentile}** |
| Memory | **${input.memoryDisplay}** | Beats **${memoryPercentile}** |

## Complexity

<sub>Estimated from submitted code patterns. Each graph is normalized on its own x/y plane; lower and flatter is better.</sub>

| Time | Space |
| --- | --- |
| ${complexityChart('Time', complexity.timeComplexity, '#ff6b35', 'rgba(255,107,53,0.12)')} | ${complexityChart('Space', complexity.spaceComplexity, '#2563eb', 'rgba(37,99,235,0.1)')} |
| **\`${escapePipes(complexity.timeComplexity)}\`**<br>${escapePipes(complexity.timeExplanation)}<br><sub>Confidence: ${complexity.confidence}</sub> | **\`${escapePipes(complexity.spaceComplexity)}\`**<br>${escapePipes(complexity.spaceExplanation)}<br><sub>Confidence: ${complexity.confidence}</sub> |

<details>
<summary>Problem statement</summary>

## Problem Statement

${problem}

</details>

## Code

\`\`\`${language}
${input.code}
\`\`\`

---

<div align="center">
<sub>Generated by <strong>LitCode</strong></sub>
</div>
`;
};

export class ReadmeService {
  async generate(input: ReadmeInput): Promise<string> {
    const complexity = await analyzeComplexityWithApi(input);
    return renderReadme(input, complexity);
  }
}
