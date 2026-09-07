---
title: Installing Arch Linux on BTRFS with LUKS and automatic TPM2 unlocking
description: My experience with installing Arch Linux on my Framework 13 with LUKS, BTRFS, and automatic unlocking using TPM2 similar to what BitLocker does.
pubDate: 2025-11-25T22:57:00.000+01:00
updatedDate: 2025-12-12T18:19:00.000+01:00
published: true
---

I recently got a new laptop, and figured I'd install Arch on it, just to have a functional system asap. Now that I have more time to tinker however, I have decided to re-install to get full disk encryption[^1]. That's what this blog post is!

[^1]: Technically I'm not using _full_ encryption here, as I am only encrypting the main data partition of the device and not the boot partition, however because I am signing the kernel and creating a unified image I deemed this an acceptable risk.

> \[NOTE]
> This isn't a _guide_ per say. This is simply my own experience with the setup, and it's the first time I've ever done this so there are likely to be issues. Regardless: Maybe you'll learn something!

Usually I wouldn't go for full encryption, however I chose encryption here for a few reasons:

1. As a challenge to myself, and to learn new technologies
2. The changing political climates and my status as a minority in more ways than one unfortunately result in me being more likely to be targeted by various actors, state or otherwise, and I figure I need to protect my privacy better.

## BTRFS configuration

Before setting up the system I'll pre-plan the BTRFS subvolumes I'll be using and the options I'll be applying to each of these, to simplify later setup. This is taken a lot from [Jordan Williams' post on Btrfs subvolumes](https://www.jwillikers.com/btrfs-layout), so I recommend going there if you want to replicate this yourself.

All volumes are mounted with the options `defaults,noatime,autodefrag,ssd,compress=lzo,commit=30` unless otherwise specified.

| Subvol name | Mount path                | Flags                    | Rationale                                                                                                                                                                   |
| ----------- | ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`      | `/`                       |                          |                                                                                                                                                                             |
| `snapshots` | `/.snapshots`             |                          | Having snapshots separated is highly recommended to avoid a snapshot-within-snapshot situation                                                                              |
| `home`      | `/home`                   |                          | Some people also recommend having a separate subvol for each user, however for my laptop there's only one user: me. So I stick to only having `/home` be its own subvolume. |
| `opt`       | `/opt`                    |                          | A lot of third-party apps are installed here, and we don't want those to be uninstalled in case of a rootfs rollback                                                        |
| `srv`       | `/srv`                    |                          | Similar reason to `opt`, as well as this being a mountpoint for other drives. Don't wanna take snapshots of everything here                                                 |
| `swap`      | `/swap`                   | Remove `compress` option | Swapfile                                                                                                                                                                    |
| `usr_local` | `/usr/local`              |                          | Similar reason to `opt`                                                                                                                                                     |
| `podman`    | `/var/lib/containers`     | `nodatacow`              | Podman images are stored here                                                                                                                                               |
| `docker`    | `/var/lib/docker`         | `nodatacow`              | Docker images are stored here                                                                                                                                               |
| `libvirt`   | `/var/lib/libvirt/images` | `nodatacow`              | Libvirt (qemu, virt-manager) stores data here                                                                                                                               |

Using `lzo` encryption won't save me a _lot_ of storage space, however it does have the highest transfer speeds out of the three available (ZLIB, LZO, ZSTD) according to [a test by TheLinuxCode](https://thelinuxcode.com/enable-btrfs-filesystem-compression/). With me having a 2TB drive, sacrificing some compression in favor of speed is therefore acceptable.

## Secure boot keys

As I already had a configured system with UKI and secure boot-signed images, I made sure to make a copy of the existing secureboot private key and certificates from `/etc/kernel/secure-boot-private-key.pem` and `secure-boot-certificate.pem`. These were previously generated with `ukify genkey` following the guide for [secure boot with systemd](https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot#Assisted_process_with_systemd) on the Arch Wiki. Later on, when setting up image signing, these will need to be put back in place.

## Installation

Before starting the install itself, I boot into my regular arch install to shrink the existing BTRFS partition down to roughly 500G, giving me ~1.5T to install the encrypted OS on: `btrfs filesystem resize 500G /`

Following that, installation starts off as usual. I download the latest [Arch ISO](https://archlinux.org/downloads), boot it, configure the keyboard, network, etc. All the usual stuff, including opening a `tmux` session (because not having scrollback is annoying).

### Partitions

First things first, I opened `/dev/nvme0n1` with `fdisk`. Since the BTRFS data has been shrunk to 500G already, I can shrink the partition to match and create a new partition following it for the new installation. Once this has been configured as a linux root partition, I write and close `fdisk`.

After setting up the partition, I configure it with `crypttab`. I pre-generated a passphrase to use through Bitwarden's [passphrase generator](https://bitwarden.com/passphrase-generator/#passphrase-generator), and input that when prompted:

```sh
cryptsetup luksFormat \
  --type luks2 \
  --cipher aes-xts-plain64 \
  --hash sha256 \
  --iter-time 2000 \
  --key-size 256 \
  --pbkdf argon2id \
  --use-urandom \
  --verify-passphrase \
  /dev/nvme0n1p3
```

Running this sets up encryption on the partition, requiring it to be opened with `cryptsetup` before any further configuration can be made. This will also require the password generated earlier:

```sh
cryptsetup open /dev/nvme0n1p3 root
```

This will create a device mapper on `/dev/mapper/root`, allowing the decrypted partition to be interacted with like any other. This gets followed up with creating a fresh BTRFS filesystem, which I mount at /mnt:

```sh
mkfs.btrfs /dev/mapper/root
mount /dev/mapper/root /mnt
```

I can then create the subvolumes defined [earlier](#btrfs-configuration), by running the following command with each of the volumes:

```sh
btrfs subvolume create /mnt/@$NAME
```

Then the root-volume gets unmounted, and I mount each of the subvolumes to their correct locations, putting in or removing the appropriate options as required:

```sh
umount /mnt
mount --mkdir /dev/mapper/root /mnt/$MOUNTPOINT -o defaults,noatime,autodefrag,ssd,compress=lzo,commit=30,subvol=@$NAME
```

> **Meaning of each option**
>
> - `defaults`: Default mount options from the mount.btrfs command? Honestly a bit unsure
> - `noatime`: Disables access time recording, see writeups on [reddit](https://www.reddit.com/r/linux/comments/imgler/) and [LWM](https://lwn.net/Articles/499293/) (lwm)
> - `autodefrag`: Small writes (64kb) are automatically queued for defrag? Again, not completely sure about the full effect from this, it is used in Jordan William's post linked to earlier
> - `ssd`: Enables some smaller optimizations ([StackExchange](https://unix.stackexchange.com/questions/752748/what-optimizations-are-turned-on-with-the-mount-option-ssd))
> - `compress` = Sets compression algorithm to use
> - `commit` = Sets how often periodic flushing to permanent storage should be performed
> - `subvol`: Tells btrfs what subvol to mount

This is followed up with creating and mounting a swapfile using BTRFS' [`filesystem mkswapfile`](https://wiki.archlinux.org/title/Btrfs#Swap_file) command:

```sh
btrfs filesystem mkswapfile /mnt/swap/swapfile --size 40G --uuid clear
swapon /mnt/swap/swapfile
```

And mounting the EFI partition of course:

```sh
mount /dev/nvme0n1p1 /mnt/boot --mkdir
```

### Base setup

After setting up all the partitions, I simply set up the system like any other:

```sh
# Generate new mirrorlist
reflector --save /etc/pacman.d/mirrorlist --protocol http,https --country Norway,Sweden,France,Germany,Finland,Iceland,US --latest 250 --sort score --ipv4 --threads 4 --fastest 50 --age 6


# Install base packages
# Further hyprland addons (like hyprshot, hyprpicker, various xdg-desktop-portals, etc are installed in the post-install section)
pacstrap -K /mnt base linux linux-firmware-amdgpu linux-firmware-mediatek systemd-ukify uwsm tmux kate zsh git sudo vim amd-ucode networkmanager btrfs-progs hyprland rofi dolphin man-db greetd-tuigreet fprintd efibootmgr alacritty base-devel

# Generate an initial fstab
genfstab -U /mnt >> /mnt/etc/fstab
```

After installing the base packages I `chroot`ed into the system with `arch-chroot /mnt`. Any commands after here are in the chroot unless otherwise specified.

In the chroot, I do some other post-config:

- Setup locales: `vim /etc/locale.gen` + `locale-gen` + `/etc/locale.conf` + `localectl set-locale`
- Setup keymap: `/etc/vconsole.conf` + `localectl set-keymap`
- Setup hostname: `/etc/hostname` + `hostnamectl hostname`
- Setup hosts file: `/etc/hosts`

### Mkinitcpio

Arch uses `mkinitcpio` to generate the kernel and initramfs images by default, so I'll just keep using it for simplicity's sake. I could've used an alternative like [`dracut`](https://wiki.archlinux.org/title/Dracut), but meh. `Mkinitcpio` works.

There are a few options I need to configure for mkinitcpio to

1. Have the required modules to boot the encrypted-signed image
2. Generate a [UKI](https://wiki.archlinux.org/title/Unified_kernel_image)
3. Sign the generated image for secure boot

First task is configuring `mkinitcpio` to have the required modules for my desired setup. Editing the configuration file, I make it look something like this:

```sh
MODULES=(btrfs tpm_crb)
BINARIES=(/usr/bin/btrfs)
FILES=()
HOOKS=(systemd autodetect microcode modconf kms keyboard sd-vconsole sd-encrypt block filesystems)
COMPRESSION="lz4"
COMPRESSION_OPTIONS=(-9)
```

This enables btrfs on root, sets up unlocking encryption through systemd, and increases compression ratio to around 2.5 while preserving the fastest decryption speeds ([Mkinitcpio#COMPRESSION on the Arch Wiki](https://wiki.archlinux.org/title/Mkinitcpio#COMPRESSION)).

Second is the UKI. For this, I installed `systemd-ukify` during pacstrap, which includes the `ukify` binary used by `mkinitcpio`. In the `/etc/mkinitcpio.d/linux.preset` file, I uncomment the `default_uki`, `default_options`, `fallback_uki`, and `fallback_options` lines, and comment out the `default_image` and `fallback_image` options. I then put in the correct paths in the `default_uki` and `fallback_uki` lines (in my case `/boot/EFI/Linux/arch-linux.efi` and `arch-linux-fallback.efi`).

Uncommenting these options tells `mkinitcpio` to generate a unified image instead of a separate kernel and initramfs. It can also be configured to automatically sign the generated image for secure boot, leading me into the final task of actually signing the images.

As mentioned in [Secure boot keys](#secure-boot-keys), I took a copy of the secure boot keys. I'll copy these over into the new system, making sure to set up `/etc/kernel/uki.conf` in the process. I'll need to set the `SecureBootSigningTool` to `systemd-sbsign`, and `SecureBootPrivateKey` + `SecureBootCertificate` to their appropriate files. `SignKernel` must also be set to true. Once this is done, `ukify` signs its generated images.

#### cmdline

Finally, I need to set up the cmdline. When using signed UKIs, the system cannot load boot options through the regular `/boot/loader/entries` files, as these can be tampered with. Instead the options are built in to the image itself, ensuring they are secure from tampering.

For my cmdline files I had a few requirements:

- The LUKS partition must be set as the root partition, and discovered for decryption
- The decrypted root partition must be properly mounted as BTRFS partitions from /etc/fstab
- Minor tuning must be done

For the first and second ones, the Arch wiki is a good resource. By following [Dm-crypt/System configuration](https://wiki.archlinux.org/title/Dm-crypt/System_configuration), I set up:

```ini title="/etc/cmdline.d/rootfs.conf"
rd.luks.name=UUID=root
# For later TPM2 unlocking
rd.luks.options=UUID=tpm2-device=auto

root=/dev/mapper/root
rootfstype=btrfs
rootflags=subvol=@
rw
```

The tuning I've gone into in [another post](/blog/tuning-and-performance-optimizations-in-arch-linux), so I'll avoid putting it here :3

### Signing the bootloader

So far I've only set up signing of the images themselves (which can _technically_ be booted directly), however if I want to ever use a bootloader for multiple OSes or kernels I'll have to sign it too (less I disable secure boot every time, which isn't particularly favorable).

For pacman, this is luckily decently simple. I'll need to install two hooks to `/etc/pacman.d/hooks/`:

- [`80-sign-systemd-boot.hook`](/uploads/80-sign-systemd-boot.hook) - As the name implies, this hook signs the systemd-boot efi binary.
- [`95-update-systemd-boot.hook`](/uploads/95-update-systemd-boot.hook) - This restarts the systemd-boot updater, ensuring the new version of the binary is put into place immediately

For simplicity's sake I've just uploaded the full files for download instead of putting them into the post itself.

I'll also make sure to reinstall systemd to make both hooks run once, so the binary gets signed and put into place: `sudo pacman -S systemd`

### Misc last touches

Before having a usable system, I'll need to configure a few smaller things:

- Greeter

  - Enable and create cache dir for remembering the last used session

    ```sh
    systemctl enable greetd
    mkdir /var/cache/tuigreet
    chown greeter:greeter /var/cache/tuigreet
    chmod 0755 /var/cache/tuigreet
    ```

  - Select the greeter to use by editing `/etc/greetd/config.toml`:

    ```toml
    command = "tuigreet --time --remember --remember-user-session --user-menu --user-menu-min-uid 1000 --asterisks --cmd 'uwsm start hyprland-uwsm.desktop'"
    ```

Once this is all completed: Reboot time!

## Post-install configuration

Now, this is where the actual TPM2 unlocking part comes into place. I'll skip all the boring "copy old home dir and struggle for 2 hours to configure dotfiles and install programs" stuff, and only focus on LUKS and TPM2 here.

### Keys

Once booted into the system I changed the boot order using `efibootmgr` to ensure sd-boot was first. Then I went into `/boot/loader/loader.conf`, and set `secure-boot-enroll force`. This makes sd-boot enroll the keys I copied over earlier, which I in all honesty don't know how got there (see `/boot/loader/keys/auto`). They kinda just appeared and I rolled with it.

Then I reboot and ensure:

1. The old keys are removed, leaving no secure boot keys at all
2. Secure boot enforcement is disabled

When sd-boot then loads it gives a message about keys being enrolled, which I don't interrupt. The system then reboots again, and I can re-activate secure boot. With the signed kernel I should then be put to the password prompt correctly.

### TPM2

First things first: Creating a recovery key using `systemd-cryptenroll`. This is essentially a long, easy to type, securely generated password. The command outputs a long string which should be written down someplace safe in case everything else fails:

```sh
systemd-cryptenroll /dev/nvme0n1p3 --recovery-key
```

Next, I enrolled the TPM2 itself in the LUKS volume, again with `systemd-cryptenroll`:

```sh
systemd-cryptenroll /dev/nvme0n1p3 --tpm2-device=auto --tpm2-pcrs=7+15:sha256=<64-zeroes>
```

Why 64 zeroes? Can't explain it myself, the [Arch Wiki](https://wiki.archlinux.org/title/Systemd-cryptenroll) does a much better job. TLDR: Something about ensuring a TPM measurement is empty.

## Acknowledgements

While setting up my own system I leaned heavily on a few other blogs, namely:

- [Btrfs Layout - Jordan Williams](https://www.jwillikers.com/btrfs-layout)
- [Arch Linux Installation Guide - mihirchanduka](https://gist.github.com/mihirchanduka/a9ba1c6edbfa068d2fbc2acb614c80e8)

There is also an almost 100% chance that this won't work properly. I have gone back and forth a bunch to set up my own laptop, a lot of which I unfortunately managed to forget to write down. Hopefully it helps somewhat at least!
