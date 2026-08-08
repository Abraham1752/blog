/**
 * rss.xml.ts · 全量 RSS（过滤 draft 与未来日期，zh-cn，atom:link 自引用）
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export const GET = async (context: { site: URL }) => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .filter((post) => post.data.pubDate.valueOf() <= Date.now())
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'TOYLOG · AI 小玩具开发日志',
    description: '用 AI 开发小玩具、小项目的完整历程：遇到的问题、使用的工具、得到的经验。',
    site: context.site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>zh-cn</language>',
      `<atom:link href="${context.site}${import.meta.env.BASE_URL}rss.xml" rel="self" type="application/rss+xml" />`,
    ].join('\n'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      customData: post.data.excerptEn
        ? `<dc:creator><![CDATA[Abraham1752]]></dc:creator><excerpt:encoded>${post.data.excerptEn}</excerpt:encoded>`
        : '<dc:creator><![CDATA[Abraham1752]]></dc:creator>',
    })),
  });
};
