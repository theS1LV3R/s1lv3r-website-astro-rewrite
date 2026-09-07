---
title: "[Minipost] Fixing krunner not showing applications in hyprland"
pubDate: 2025-12-07T23:22:00.000+01:00
published: true
---

Quick one: If on hyprland (or likely any non-plasma WM/DE), krunner is likely to not be showing installed desktop applications. This is caused by a missing symlink in the `/etc/xdk/menus` directory.

Easy copy-paste fix:

```sh
sudo ln -s /etc/xdg/menus/plasma-applications.menu /etc/xdg/menus/applications.menu
sudo update-desktop-database -v
```

This rebuilds the cache and allows krunner to see the missing applications :3
