import { getCollection, render, type CollectionEntry } from "astro:content";
import jsdom from "jsdom";
import { DESCRIPTION_TRIM_LENGTH } from "./constants";

/**
 * Gives plain text output of a rendered HTML document. Based on https://stackoverflow.com/questions/74116249
 *
 * @export
 * @param {CollectionEntry<"blog">} [post] Post to get content from
 * @return {string} The content itself
 */
export async function getPostText(post: CollectionEntry<"blog">): Promise<string> {
  await render(post);

  const htmlString = post.rendered!.html;

  const dom = new jsdom.JSDOM(htmlString);
  const { document, NodeFilter } = dom.window
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);

  const textList: string[] = [];
  let currentNode: Node | null = walker.currentNode;

  while (currentNode) {
    // ! because we know node will exist from being in a while loop
    textList.push(currentNode!.textContent ?? "");
    currentNode = walker.nextNode();
  }

  return textList.join("");
}

export async function getDescription(post: CollectionEntry<"blog">): Promise<string> {
  let desc = post.data.description;

  if (!desc) {
    desc = await getPostText(post);
  }

  return desc.length > DESCRIPTION_TRIM_LENGTH
    ? desc.substring(0, DESCRIPTION_TRIM_LENGTH) + "..."
    : desc;
}

/**
 * Returns all published blog posts, sorted from most to least recent publishing date.
 *
 * @returns Filtered and sorted blog posts
 */
export async function getPublishedPosts(): Promise<Array<CollectionEntry<"blog">>> {
  return (await getCollection("blog"))
    .filter((post) => post.data.published)
    .sort((a, b) => (a.data.pubDate > b.data.pubDate ? -1 : 1))
}
