---
title: Automatic LetsEncrypt certificates with Tailscale and Traefik in Docker
pubDate: 2025-12-26T02:30:00.000+01:00
published: true
---

> Just want it to work? See [#The Solution](#the-solution). Want to know _why_ it works, along with some backstory? Read on :)

Recently (not really, 2022), Traefik released support for [obtaining LetsEncrypt certs for Tailscale hosts](https://traefik.io/blog/exploring-the-tailscale-traefik-proxy-integration). With this, Traefik gained the ability to automatically (if configured correctly) communicate with a locally running Tailscale daemon to request a certificate through the [Tailscale certificate cervices](https://tailscale.com/kb/1153/enabling-https) for the locally running machine.

Doing some research, this seemed to perfectly align with my goals, so I gave it a try. Reading up on documentation a bit, I figured it would be enough to just configure Traefik to be on the same network as Tailscale, so I tried the following:

```yaml
services:
  tailscale:
    # redacated for example
  traefik:
    network: service:tailscale
```

However, when trying this out I kept getting a strange error... Traefik was unable to communicate with the Tailscale daemon even though it was running on the same network!

Looking into the logs and source, I discovered that Traefik is trying to access Tailscale through the local socket on `/var/run/tailscale/tailscaled.sock`. This obviously isn't passed through through the above `network:` option, so I add some more:

```yaml
services:
  tailscale:
    volumes: [var_run_tailscale:/var/run/tailscale]
  traefik:
    volumes: [var_run_tailscale:/var/run/tailscale]

volumes:
  var_run_tailscale:
```

But, this also didn't work! At this point I got stumped for a solid while. It should've worked, no? Traefik has access to the Tailscale socket? But no! Digging into the containers themselves and checking the status of the socket, I see this:

```sh
❯ docker compose exec traefik sh
/ # stat /var/run/tailscale/tailscaled.sock
  File: '/var/run/tailscale/tailscaled.sock' -> '/tmp/tailscaled.sock'
#...
```

Aha! The socket, for whatever reason, is actually a symlink to `/tmp`?? This really confused me, as on my non-docker install of tailscale the socket is simply a regular socket.

> Talking with a friend, I was told that sockets are usually put in `/tmp` on rootless containers, however Tailscale seems to run as rootfull? Running `ps aux` in the container reveals `tailscaled` running as root, so I don't think that's the explanation in this case.

So, more source code digging is required. Looking into the container, I see it starts a binary called `containerboot`. I checked the tailscale repo, and found the matching file: [`cmd/containerboot/tailscaled.go`](https://github.com/tailscale/tailscale/blob/b21cba0921dfd4c8ac9cf4fa7210879d0ea7cf34/cmd/containerboot/tailscaled.go) Nestled in there, on lines 78-82, there is the following:

```go
case cfg.StateDir != "":
  args = append(args, "--statedir="+cfg.StateDir)
default:
  args = append(args, "--state=mem:", "--statedir=/tmp")
}
```

And where does `cfg.StateDir` come from? Well, `cfg` is initialized in [`cmd/containerboot/main.go`](https://github.com/tailscale/tailscale/blob/d451cd54a70152a95ad708592a981cb5e37395a8/cmd/containerboot/main.go#L154) by calling `configFromEnv()`, and that is defined in [`cmd/containerboot/settings.go`](https://github.com/tailscale/tailscale/blob/d451cd54a70152a95ad708592a981cb5e37395a8/cmd/containerboot/settings.go#L105) like this:

```go
func configFromEnv() (*settings, error) {
  cfg := &settings{
    // ...
    Socket: defaultEnv("TS_SOCKET", "/tmp/tailscaled.sock"),
    // ...
  }
}
```

Aha! It defaults to putting the socket in `/tmp` (for whatever reason)! Why this was introduced I have NO idea, I tried to dig around a bit and got nowhere[^1], however this does tell me what to change to get it to work properly.

[^1]: Well actually that's not _completely_ true. I did find a few issues on it, most notably [#6849 - Change default socket path in containers](https://github.com/tailscale/tailscale/issues/6849) as well as the commit where this was introduced ([`2c403cb`](https://github.com/tailscale/tailscale/commit/2c403cbb313c89741068c7d9d700169c1bbf3ad5)), however neither of these explain _why_ it was done the way it was.

## The solution

So with these in mind, there are a few required properties for the compose file:

- Traefik has to use Tailscale's networking to allow using the tailnet
- Traefik needs R/W access to `tailscale.sock` to be able to request a certificate
- Tailscale needs to put the socket in the correct location

This gives me the following file in the end (only including keys required for this specific config):

```yaml title="compose.yaml"
services:
  traefik:
    network: service:tailscale
    command:
      - --certificatesResolvers.tailscale.tailscale=true
      - --entrypoints.websecure.address=:443
      - --entrypoints.websecure.http.tls.certResolver=tailscale
    volumes:
      - var_run_tailscale:/var/run/tailscale:rw,Z
    depends_on:
      tailscale:
        required: true
        condition: service_healthy

  tailscale:
    volumes:
      - var_run_tailscale:/var/run/tailscale:rw,Z
    environment:
      TS_SOCKET: /var/run/tailscale/tailscale.sock
      TS_USERSPACE: false # Traffic goes through traefik, not directly through tailscale itself
      TS_HOSTNAME: your-app.tailscale-domain.ts.net
```

Those options will expose Traefik to the tailnet, and allow it to get certificates for itself. Note that Traefik can only ever get a single cert, namely whatever matches the `TS_HOSTNAME` env var. This is a limitation of Tailscale, and while there is an open issue to get this changed ([#7081](https://github.com/tailscale/tailscale/issues/7081)), it has not seen activity in almost two years as of this writing, so I am not hopeful for it being implemented anytime soon.
