---
title: How to configure Jellyfin with Authentik LDAP auth
pubDate: 2026-01-31T17:13:00.000+01:00
---
As of the time of this writing, Jellyfin's OAuth support is... disappointing, to say the least. There is [an SSO plugin](https://github.com/9p4/jellyfin-plugin-sso/tree/8e128932c4caa7297e9696111a04d7a7db4fa944), however it is not official and client support for it is very lacking. Therefore, the recommended route is to use LDAP instead, with all the hassles that brings with it.

Authentik is also a very common open-source project used in the self-hosting world, having [many auth providers](https://docs.goauthentik.io/providers/). Their LDAP setup documentation is however a bit confusing at times, which then led me to create this guide!

The general flow goes as follows:

1. Create an LDAP bind user, `ldap_bind_user`
2. Create
