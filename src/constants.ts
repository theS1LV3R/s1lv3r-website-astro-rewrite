import Github from "./components/icons/Github.astro";
import LinkIcon from "./components/icons/Link.astro";
import AtSign from "./components/icons/AtSign.astro";
import Matrix from "./components/icons/Matrix.astro";
import Signal from "./components/icons/Signal.astro";
import FediverseNocolor from "@components/icons/FediverseNocolor.astro";
import type { Badge, Link } from "@/types";

export type AstroComponent = (_props: Record<string, any>) => any;

export const SITE_NAME: string = "Silversys";
export const PRONOUNS: string = "it/she";
export const TAGLINE: string = "Autistic trans woman, working with DevOps, networks, and systems design, engineering, and administration.";
export const THEME_COLOR: string = "#744eb4";

export const HIRE_ME_ENABLED: boolean = false;
export const DESCRIPTION_TRIM_LENGTH: number = 180;
export const TOC_MAX_NESTED: number = 3;

export const RSS_AUTHOR_EMAIL: string = "me@s1lv3r.codes";

export const CONTACT_LINKS: Link[] = [
  {
    title: "Signal (Preferred)",
    link: "https://signal.me/#eu/uQnZe59M88FcFd2TTXyvtA03IppAUx3e-WyhlSN3Gxlnf2AFxKpLQ7AM1n-nP7-x",
    icon: Signal,
  },
  {
    title: "Email",
    link: "mailto:me@s1lv3r.codes",
    icon: AtSign,
  },
  {
    title: "GitHub",
    link: "https://github.com/theS1LV3R",
    icon: Github,
  },
  {
    title: "Matrix",
    link: "https://matrix.to/#/@s1lv3r:wolfgirl.pet",
    icon: Matrix,
  },
  {
    title: "Fedi",
    link: "https://wolfgirl.pet/@s1lv3r",
    icon: FediverseNocolor,
  },
];

export const RANDOM_LINKS: Link[] = [
  {
    icon: LinkIcon,
    title: "A Cypherpunk's Manifesto",
    link: "/cypherpunk.txt",
    description: '"A Cypherpunk\'s Manifesto" by Eric Hughes',
  },
  {
    icon: LinkIcon,
    title: "Hacker Manifesto",
    description: '"The Conscience of a Hacker" by Loyd Blankenship',
    link: "/the-conscience-of-a-hacker.txt"
  },
  {
    icon: LinkIcon,
    title: "nerd",
    link: "https://nerd.s1lv3r.codes",
    description: "nerd",
  },
  {
    icon: LinkIcon,
    title: "Team Corax",
    link: "https://corax.team",
    description: "The CTF team I'm a member of",
  },
];

// https://cyber.dabamos.de/88x31/, https://yesterweb.org/graphics/buttons
export const BADGES: Badge[] = [
  {
    image: "/88x31/best_viewed_with_pepsi.gif",
    alt: "This Site Best Viewed With Pepsi",
  },
  {
    image: "https://yesterweb.org/no-to-web3/img/roly-saynotoweb3.gif",
    alt: "Keep the Web Free, Say No To Web3",
    target: "https://yesterweb.org/no-to-web3/",
  },
  {
    image: "/88x31/rss.png",
    alt: "RSS Feed",
    target: "/blog/feed.rss",
  },
  {
    image: "/88x31/not_a_person.png",
    alt: "Not a Person",
    target: "https://voidgoddess.org/emptyspaces/notaperson/",
  },
  {
    image: "/88x31/this_machine_kills_fascists.png",
    alt: "This Machine Kills Fascists",
  },
  {
    image: "/88x31/pride-transgender.png", // https://qalle.neocities.org/88x31/
    alt: "Transgender flag",
    target: "https://en.pronouns.page/@thes1lv3r",
  },
  {
    image: "/88x31/s1lv3r.png",
    alt: "S1LV3R (my own 88x31)",
  },
  {
    image: "https://www.31a05b.net/a/8831/31a05b.png",
    alt: "rings of particles around disc; cat emoticons",
    target: "https://www.31a05b.net",
  },
  {
    image: "https://beeps.website/assets/images/88x31-n.gif",
    alt: "beeps.website - a site by a plural, furry, otherkin weirdo about web dev, identity and stuff",
    target: "https://beeps.website/",
  },
  {
    image: "https://timedout.uk/88x31s/nexy7574-new.gif",
    alt: "<Nexy/> <3",
    target: "https://timedout.uk/"
  },
  {
    image: "https://gingershaped.computer/8831/button.png",
    alt: "ginger's 88x31 button",
    target: "https://gingershaped.computer/"
  },
];
