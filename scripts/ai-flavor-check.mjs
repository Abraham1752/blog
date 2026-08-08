/**
 * ai-flavor-check.mjs · AI 腔检查（§6.3 打磨阶段，仅警告非阻塞）
 * 清单：模板化过渡词 / 副词堆砌 / 缺数字 / 缺第一人称 / 段落 >5 行
 * 用法：node scripts/ai-flavor-check.mjs [--fail]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const postsDir = join(root, 'src', 'content', 'posts');
const FAIL_ON_VIOLATION = process.argv.includes('--fail');

const TRANSITION_WORDS = [
  '综上所述', '总而言之', '总的来说', '值得注意的是', '不难发现', '毋庸置疑',
  '首先', '其次', '最后', '总而言之', '换言之', '换句话说', '众所周知',
  '不仅如此', '除此之外', '值得一提的是', '从某种意义上说', '由此可见',
  '综上所述', '最终', '此外', '更重要的是',
];

const ADVERBS = ['非常', '十分', '极其', '相当', '非常地', '极度', '颇为', '着实'];

const scan = (content) => {
  const warnings = [];
  const body = content.replace(/^---[\s\S]*?---/, '');

  for (const w of TRANSITION_WORDS) {
    const count = (body.match(new RegExp(w, 'g')) ?? []).length;
    if (count > 0) warnings.push(`模板化过渡词「${w}」×${count}`);
  }

  let adverbTotal = 0;
  for (const a of ADVERBS) {
    const count = (body.match(new RegExp(a, 'g')) ?? []).length;
    adverbTotal += count;
  }
  if (adverbTotal >= 3) warnings.push(`副词堆砌（${adverbTotal} 处）`);

  const hasFirstPerson = /我/.test(body);
  if (!hasFirstPerson) warnings.push('全文无第一人称「我」');

  const numbers = body.match(/[0-9]+(\.[0-9]+)?%?/g) ?? [];
  if (numbers.length < 2) warnings.push(`数字过少（仅 ${numbers.length} 处）`);

  for (const [i, para] of body.split(/\n{2,}/).entries()) {
    const lines = para.trim().split('\n');
    if (lines.length > 5 && !/^\s*[|#>]/.test(para) && !para.startsWith('```')) {
      warnings.push(`第 ${i + 1} 段超过 5 行（${lines.length} 行）`);
    }
  }

  return warnings;
};

let totalIssues = 0;
for (const file of readdirSync(postsDir)) {
  if (!file.endsWith('.md') || file.startsWith('template-')) continue;
  const raw = readFileSync(join(postsDir, file), 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm && /draft:\s*true/.test(fm[1])) continue;
  const warnings = scan(raw);
  if (warnings.length > 0) {
    console.log(`WARN ${file}:`);
    for (const w of warnings) console.log(`   - ${w}`);
    totalIssues += warnings.length;
  }
}

if (totalIssues > 0) {
  console.log(`\n${totalIssues} AI 腔提示（非阻塞，发布前人工复核）`);
  if (FAIL_ON_VIOLATION) process.exit(1);
} else {
  console.log('AI 腔检查通过');
}
