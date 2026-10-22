---
title: Arma 3 head tracking on linux using OpenTrack
pubDate: 2026-01-27T21:05:00.000+01:00
updatedDate: 2026-10-22T13:33:21+02:00
published: true
---

I love playing Arma 3, and wanted to get myself a head tracking setup like a [TrackIR](https://www.trackir.com/) for more enjoyable gameplay. However due to it being decently expensive for my student self at €219, I bought a used [PlayStation Eye](https://en.wikipedia.org/wiki/PlayStation_Eye) camera for ~€20 instead. This camera, paired with a piece of software called [OpenTrack](https://github.com/opentrack/opentrack) allows me to get _basically_ the same experience as if I'd gotten a TrackIR instead :)

I found the setup for OpenTrack a bit tedious and kinda unintuitive, so I wrote it down to make the process easier for others :3

> The majority of this post was originally posted on steam: [Linux head tracking using Opentrack and its Neuralnet camera tracker](https://steamcommunity.com/sharedfiles/filedetails/?id=3599782753)

## Hardware selection

As mentioned, I got myself a PlayStation Eye, the camera for the PS3. It supports a _whopping_ `640×480@60` or `320×240@120`. You may note that these are very low resolutions, but that isn't that important in this case as the high frame rate is the important bit. The camera also has great low-light capabilities, making it a good match for late night gaming sessions.

Any camera supporting at least 60fps should be good, however the [AiTrack wiki](https://github.com/AIRLegend/aitrack/wiki/Common-camera-FOV-values) has a good list of cameras and their FOV values. Any camera on there _should_ be usable for OpenTrack, but YMMW.

## OpenTrack - Installation

First, ensure Opentrack is installed with the correct dependencies for the Neuralnet tracker. On Arch Linux, this involves installing it with any of the packages providing the `onnxruntime` optional dependency:

- `onnxruntime-cpu`
- `onnxruntime-cuda` (NVIDIA)
- `onnxruntime-rocm` (AMD)
- `onnxruntime-opt-cuda` (NVIDIA + AVX2 CPU optimizations)
- `onnxruntime-opt-rocm` (AMD + AVX2 CPU optimizations)

The package naming and availability may vary by distro.

```bash
paru -S onnxruntime-<variant> opentrack
```

## Opentrack - Neuralnet configuration

In the Opentrack UI, select the neuralnet tracker in the Input field to enable it.

In the settings panel (hammer button) next to the input field, select the correct camera. Ideally it should be placed right in front of your face. Configure the FOV and resolution, and optionally any other settings through the Camera Settings button. This will open the Qt V4L2 test utility if installed.

See more configuration details in the [Opentrack wiki](https://github.com/opentrack/opentrack/wiki/AI-Face-Tracking/3d839e36c47074ad40de570e1abfb0dce865fd37), common FOV values can be found in the [AiTrack Wiki](https://github.com/AIRLegend/aitrack/wiki/Common-camera-FOV-values)

## Opentrack - Wine output configuration

For native Wine/proton output, select the Wine output module. Then click the hammer to open settings.

In here, we use the regular Wine variant, not the Proton output ([why?](#why-not-the-proton-output). Select Custom path to Wine executable. Then you will need to do some looking.

1. Find what version of Proton Arma is configured to use in the steam settings. In this example, that is Proton 9.0-4
2. Fill in the path to the wine binary in the proton installation, here that would be `/srv/steam_games/steamapps/common/Proton 9.0 (Beta)/files/bin/wine`, where `/srv/steam_games` is the steam library. Your location may wary.
3. Fill in the path to the Arma 3 proton directory. In this example: `/srv/steam_games/steamapps/compatdata/107410/pfx`.

### Why not the Proton output?

OpenTrack has a [hardcoded](https://github.com/opentrack/opentrack/blob/2d3ab7a61d2514ce51c9656908d33465a788763e/proto-wine/proton.cpp#L17-L27) list of locations for Steam libraries and Wine locations, which in many cases won't be applicable to where Arma 3 actually is installed. In my case, the dropdown allowed no selections due to me not having my Steam library in any of the hardcoded paths, so I had to use the Wine output.

As far as I can tell, the two are identical and use the same code except for the directory selection. Therefore there should be no negative effects from not using the Proton output.

## Arma 3 config

When running on Linux, it can be advantageous to use [arma3-unix-launcher](https://github.com/muttleyxd/arma3-unix-launcher) instead of the default launcher. Its more lightweight and launches quicker, and works better with external programs like OpenTrack or TeamSpeak 3 (installed in the proton prefix). Note however that when using a3ul, you do not launch Arma through Steam. You have to manually launch the program outside of steam.

Ensure OpenTrack is running **before** launching Arma (again, ideally through `a3ul`). Then, open Arma's input settings, and find the Controllers tab. From there two devices should be listed:

- Track IR
- FreeTrack

Ensure **Track IR** is **enabled**, and **FreeTrack** is **disabled**. Input bindings for analog head movement should be set up by default.

## Tuning/Mapping

After checking that the tracking works and your head turns in-game, its time for tuning. This will largely consist of setting how much the camera changes based on your head movements.

The tuning options can be accessed with the **Mapping** button on OpenTrack's main screen. This will open up a window with tabs for `Yaw`, `Pitch`, `Roll`, `X`, `Y`, and `Z`. Tuning each of these can take some time, but I've provided screenshots my own tuning parameters here:

- [yaw](/uploads/arma-3-head-tracking-on-linux-using-opentrack/1_yaw.png)
- [pitch](/uploads/arma-3-head-tracking-on-linux-using-opentrack/2_pitch.png)
- [roll](/uploads/arma-3-head-tracking-on-linux-using-opentrack/3_roll.png)

`X`, `Y`, and `Z` are all tuned completely flat to avoid head movement translating into the game as I am only interested in head rotation, but you may tune this as you wish.

## Acknowledgements

This guide was largely inspired by [robert](https://steamcommunity.com/profiles/76561199380829285)'s [Linux head tracking - simple, cost-free method using Proton and Opentrack](https://steamcommunity.com/sharedfiles/filedetails/?id=2972803012). Many thanks for that original, which made this one possible.

## Changelog

### 2026-10-22

- Removed instruction to set a variable that has been removed in an updated version of OpenTrack.
- Added recommendations to use arma3-unix-launcher over the default launcher.
- Misc wording improvements
