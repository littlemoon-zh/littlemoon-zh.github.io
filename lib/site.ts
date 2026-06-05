export const site = {
  name: 'Littlemoon',
  owner: 'Yuhang Xiao',
  role: 'AI Engineer',
  url: 'https://littlemoon-zh.github.io',
  email: 'yuhangxiaocs@gmail.com',
  github: 'https://github.com/littlemoon-zh',
  description:
    'Littlemoon is Yuhang Xiao’s personal notebook for AI engineering, agent systems, evaluation loops, and model internals.',
  chineseDescription:
    '一个面向 AI 工程实践的个人笔记站：记录 agent 系统、评测闭环、视频 AI 与模型机制中的可复用判断。',
  image: '/hero-workspace.jpg',
}

export const focusAreas = [
  'Agent Systems',
  'Evaluation Loops',
  'Video AI',
  'Model Internals',
] as const

export const readingPaths = [
  {
    title: 'AI 工程闭环',
    description: '从需求、生成、检查到人类反馈，拆解让 AI 产出可持续变好的系统。',
    tags: ['ai-engineering', 'quality-system', 'video-ai'],
  },
  {
    title: '模型机制笔记',
    description: '用代码和直觉解释 Transformer、attention、MLP 等基础结构。',
    tags: ['transformer', 'attention', 'deep-learning'],
  },
  {
    title: '可运行原型',
    description: '把 prompt、数据表达和交互想法做成轻量 demo，验证后再产品化。',
    tags: ['prompt-design', 'dataviz', 'typescript'],
  },
] as const
