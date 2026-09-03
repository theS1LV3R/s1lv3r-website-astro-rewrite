// @ts-check
import { defineConfig, svgoOptimizer } from "astro/config";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import sectionize from "remark-sectionize";
import externalLinks, { type Options as externalLinksOptions } from "rehype-external-links";
import rehypePrettyCode, { type Options as rehypePrettyCodeOptions } from "rehype-pretty-code"
import { transformerCopyButton } from "@rehype-pretty/transformers";
import { unified } from "@astrojs/markdown-remark";


// https://astro.build/config
export default defineConfig({
  site: "https://silversys.dev",
  trailingSlash: 'never',
  integrations: [mdx(), sitemap({
    serialize(item) {
      if (item.url.includes("/admin")) return undefined;
      if (["/testpage"].includes(item.url)) return undefined;

      return item;
    }
  })],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  devToolbar: { enabled: false },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [sectionize],
      rehypePlugins: [
        [
          externalLinks,
          {
            rel: ["noopener", "noreferrer"],
            target: "_blank"
          } as externalLinksOptions
        ],
        [
          rehypePrettyCode,
          {
            theme: "dark-plus",
            defaultLang: "plaintext",
            bypassInlineCode: true,
            transformers: [
              transformerCopyButton({
                visibility: "hover",
                feedbackDuration: 2_500,
              })
            ]
          } as rehypePrettyCodeOptions
        ],
      ]
    })
  },
});
