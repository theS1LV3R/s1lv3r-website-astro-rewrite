---
title: Tuning and performance optimizations in Arch Linux
pubDate: 2025-12-07T01:29:00.000+01:00
published: true
---

Recently, I decided to read up on the Arch Wiki because I was bored, and I decided to read on the [Improving performance](https://wiki.archlinux.org/title/Improving_performance) pages. I found some cool topics and settings, this post is simply an overview of the ones I use and have configured, and others that don't come from the wiki at all but that I have found *somewhere* on the internet.

Relevant links are added where available, expect this document to update frequently :3

## Kernel parameters

### Clock

Improves game performance at the cost of a small reduction in clock accuracy. Only in use on my laptop.

Sources:

- <https://wiki.archlinux.org/title/Gaming#Improve_clock_gettime_throughput>

```ini title="/etc/cmdline/clock.conf"
tsc=reliable clocksource=tsc
```

### zswap

TLDR for why zswap and not zram: zswap is best if you already have a swap device (e.g. a swapfile), zram works best if you don't have swap.

Sources:

- <https://askubuntu.com/questions/471912/zram-vs-zswap-vs-zcache-ultimate-guide-when-to-use-which-one>
- <https://wiki.archlinux.org/title/Zswap>

```ini title="/etc/cmdline/zswap.conf"
zswap.enabled=1 zswap.shrinker_enabled=1 zswap.compressor=lz4
```

### ACPI alarm

Sets the kernel to use ACPI alarms instead of HPET, enabled on my laptop.

Sources:

- <https://community.frame.work/t/resolved-systemd-suspend-then-hibernate-wakes-up-after-5-minutes/39392>

```ini title="/etc/cmdline/acpi.conf"
rtc_cmos.use_acpi_alarm=1
```

## Sysctl

### Swappiness

Lower the default swappiness to increase responsiveness, as i have 32G and up with system memory on all my systems.

Sources:

- <https://wiki.archlinux.org/title/Swap#Swappiness>

```ini title="/etc/sysctl.d/99-swappiness.conf"
vm.swappiness = 35
```

### Network tuning

A couple minor tweaks, TLDR:

- Enable TCP fast open
- Attempt to probe for largest possible MTU
- Set a larger starting MTU for probing

Sources:

- <https://wiki.archlinux.org/title/Sysctl#Improving_performance>
- <https://kernel.org/doc/html/latest/networking/ip-sysctl.html>
- <https://blog.cloudflare.com/path-mtu-discovery-in-practice/>

```ini title="/etc/sysctl.d/99-networking.conf"
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_base_mss = 1024
```

## Others

### Power profiles

I manage my power profiles manually using [Power-profiles-daemon](https://wiki.archlinux.org/title/CPU_frequency_scaling#power-profiles-daemon) and `powerprofilesctl`:

```shell
powerprofilesctl set <power-saver|balanced|performance>
```
