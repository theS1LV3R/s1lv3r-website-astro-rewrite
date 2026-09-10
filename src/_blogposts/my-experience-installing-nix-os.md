---
title: My experience installing Nix OS
pubDate: 2025-12-06T13:41:00.000+01:00
updatedDate: 2026-09-10T07:54:07+02:00
published: true
---

After some friends of mine started using and recommending [NixOS](https://nixos.org) to me I eventually got tempted enough by the sweet, sweet reproducibility and git-managed system that I decided to give it a try.

At first, I wasn't a massive fan. Configurations were archaic, the nix configuration language had some... quirks (?) that I weren't a big fan of (more on that at [#Nix language quirks](#nix-language-quirks)), and configuring flakes for git-managed configurations wasn't exactly intuitive.

Later though, I did start getting a bit used to the system. A lot of that was thanks to my friend [Soni](https://github.com/soni801) who helped me for hours on end with setting up the system, and answered every question I annoyed him with in our DMs. Thanks a lot :3

To put the TLDR at the start: I am likely not gonna be switching to Nix full time. It's good, just not quite for me. More on that at the end.

## Installation process

First of all, there's the installation process. Now, this was likely mostly an issue with my machine, but for some unknown reason WiFi was absolutely *refusing* to connect, whether I was using the Minimal or Graphical installer, and regardless of environment in the Graphical installer. This caused me about an hour of pain with trying, restarting, retrying, and repeat. In the end I just plugged the machine in with a cable, and that solved my issues, but not a "good" first experience at least.

Next, the installer itself was being kinda annoying. There was no ability to shrink my existing LUKS partition to make space for installing Nix itself, so I had to use GParted for this. That itself is fine, as shrinking a LUKS partition is decently niche. But when I then did shrink the partition to make space, the installer never refreshed the partition selection, forcing me to restart the installer completely. Again: Niche is, but a small annoyance either way.

Finally, and I noticed this only after the installation itself, it overwrote my `systemd-boot` config completely and changed the EFI parameters to ensure Nix was booted first instead of using the existing `sd-boot` entry and config. As I had customized my `loader.conf` a decent amount, this was kinda annoying. Nothing I couldn't fix, but another small annoyance. As I was quick to notice, there were a lot of those.

<!--
network issues
  - restarting installation repeatedly
- installer being dumb with partitions
  - shrinking luks
  - updating partition list after external changes
- overwriting sd-boot config and boot order
-->

## Nix language quirks

The Nix language itself is very good, I like it quite a lot. However, some small things kinda got to me.

First: The fact that there is a semicolon between `with pkgs` and an array. To me, coming from other languages (and even from the nix language itself), this seems incorrect. To me, a semicolon indicates "end of this statement", so in Nix' case "end of this variable or definition". It was not logical to me that in *this* case only, the statement continued after the semicolon. Once I got used to this it was no issue at all.

```nix
# How it is:
packages = with pkgs; [
  ...
];

# How it makes intuitive sense for me:
packages = with pkgs [
  ...
];
```

Second, and this is more a nitpick than anything: Indents and bracketing. Why does `nixfmt` insist on this pattern (pseudocode):

```nix
services.openssh =
  {
    enabled = true;
  };
```

instead of

```nix
services.openssh = {
  enabled = true;
};
```

Again: Preference, doesn't at all matter for the operation of the system, but just tiny nitpicks. I don't *have* to use `nixfmt` at all.

<!--
- semicolon after `with pkgs` into array
- issues with indents
-->

<!--
# Home-manager

- Config management
- Package installation
-->

## The good

Now for a change of pace: Some good things and things I liked with Nix!

First: I absolutely LOVE the declarative configuration. I am absolutely a fan of being able to define "I want foo, bar, and baz" and have only that be installed, and if I remove anything from that list, it gets removed automatically. I am ABSOLUTELY a fan of that, not a question about it.

Further: I love the ability to, with a tiny bit of config, have different setups for different machines while being able to share base configurations. Being able to add `nixosConfigurations` and run `nixos-rebuild switch --flake .#hostname` to have my desired configuration for my exact system: Absolutely love it. That is exactly what other dotfile managers and config managers should strive to be.

<!--
- Defining exactly what i need to install
- Different setups for different machines in the same repo
-->

## The bad

Now: Back to some more complaining (unfortunately). NixOS' lack of following the [FHS](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html) absolutely made the transition to Nix more difficult for me. Trying to find config files for programs and services (or really any files at all) was made incredibly difficult. I essentially needed to throw away everything I knew and start completely anew (which I guess is kinda the whole point of immutable systems?)

This leads me into my second main problem: The documentation is... something. Configuration documentation is seemingly spread across 10 different websites, all of which having something the others don't have. The [nix wiki](https://wiki.nixos.org/) is a good starting point and a good resource for basic configuration, but the second I needed anything else I found myself digging down GitHub issues, Nix search sites, and my friends' DMs.

Finally, and again, Nitpick (I do that a lot, huh): Running VSCode through the [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) extension was... not easy. Turns out the node binary that ships with that extension and the remote server is dynamically linked, which NixOS doesn't support without additional configuration. That in and of itself isn't necessarily bad, as there are workarounds.

The issue I encountered after that though, that was a bit annoying. Turns out if I choose the [patched binary workaround](https://github.com/K900/vscode-remote-workaround), the remote server gets ran in [bubblewrap](https://github.com/containers/bubblewrap), making `sudo` unavailable, meaning I had to have an open terminal on the laptop itself for rebuilding the system. Now I admit, my use case is... different than a lot of others'. But: Slight annoyance.

<!--
- lack of filesystem hierarchy standard following
- vscode remote in bwrap, sudo issues
-->

## The confusing

Then come the parts that are just kinda... confusing? They're not inherently bad, just not intuitive for a new user.

First: The (at least) 5 different way to install packages:

- `systemPackages`
- `packages`
- `programs`
- home-manager `packages`
- `wayland.windowManager`

After using and working with Nix a bit more I do understand *why* it is this way. All of them serve a different purpose, and configure a slightly different part of the system. But knowing which to use when was maybe one of the most confusing things for me as a new user.

Next: User services. Ohhh did I ever struggle with user services. I was thinking I was gonna install and use [SwayNotificationCenter](https://github.com/ErikReider/SwayNotificationCenter) for my notifications in Hyprland. So first I need to figure out what package to use. I try what seems like the most logical option, the [`pkgs.swaynotificationcenter`](https://mynixos.com/nixpkgs/package/swaynotificationcenter) package. That one did work if launched manually or through the hypr `exec-once` config, but as I was using [uwsm](https://github.com/Vladimir-csp/uwsm), I was thinking I could enable the user service. Only issue: There was none!

So I started digging. Was it in /etc...? No, right, Nix doesn't use FHS. /usr/lib/systemd..? Nope, nothing there either. I dug for about half an hour until I realized: The package itself doesn't include a service! So I started researching other methods, and saw that home-manager includes a `services` key. However it *clearly* (very sarcastic) uses a different format to regular flakes and nix config, and keys used in `nix` aren't available in `home-manager` despite using the same file format.

So, after another half hour of debugging, I did figure out how to get it running:

```nix
services.swaync.enable = true;
```

Easy enough, I guess, just not intuitive at all. I also have no idea where this has installed the binaries or programs themselves /shrug.

Finally, what seems like a packaging bug to me? The [`krunner`](https://search.nixos.org/packages?channel=unstable&query=krunner) package just... didn't install `krunner`? In fact, it doesn't install *anything*! I believe this is probably just a bug, but an annoying one nonetheless. Only way to get krunner was by installing the `kdePackages.plasma-workspace` package, but this also installed a lot of junk I didn't want at all. I dug into only including the `bin/krunner` part of the package, but that got me into [derivations](https://nix.dev/manual/nix/2.22/language/derivations) which I was not nearly ready for.

<!--
- systemPackages vs packages vs programs vs home-manager packages (e.g. sway) vs wayland.windowManager
- services
- weird packaging of binaries
  - krunner package not including krunner
-->

## Overall

So far it might've seemed like I've mostly complained, however: I do like Nix. It's confusing for sure, and not necessarily very intuitive even for seasoned Linux users like myself, but the ideas and concepts it brings to the table are ones I very much enjoy. I won't be switching to Nix full-time, but perhaps I'll be more open to dabbling around in it in the future? For now though, I'll be sticking to Arch, btw :3
