---
layout: post
title: Home rolled Linux Containers
tags:
	- container
	- linux
	- virtual machine
	- centos
	- rust
	- namespace
tagline: A simple Rust containerisation tool.
---

The code for this tool is availble on github at
[xurtis/container][container].

---

I've spoken about Linux containers before. There are a small set of
system calls in Linux (namely _clone(2)_, _unshare(2)_, and _setns(2)_)
which provide mechanisms to contol which namespace the running process
exists in. Additionally, the namespaces can be controlled for other
processes using the `proc` filesystem.

In this post, I want to talk about how I used these simple tools to
build lightweight containers myself.

# Why not use existing tools?

There are a number of existing tools to manage containers (and to manage
the tools that manage the containers) that already exist such as
[Docker][], [LXC and LXD][linux-containers], and [Kubernetes][]. These
tools all aim to orchestrate containers at a large scale, although the
Linux Containers group is falling behind the other two quite
substantially.

I run several (far too many) Linux systems myself. My laptop and desktop
computers, what I would refer to as my terminal machines, both run
[Fedora 28][fedora] and the remainder of my computers all run [CentOS
7][centos]. All of my machines are part of the community side of the
[Red Hat][red-hat] family of Linux distributions.

I really prefer the Red Hat ecosystem of software and the enhanced
security on these distributions from tools like [SELinux][].

What I would really like to be able to do is create _unpriviliged_
containers with my normal login user on these machines rather than have
to set up some large service on each of them to orchestrate them all. As
the machines all share an NFS server. I would ideally like to have one
container filesystem structure there which I can easily use from any of
my machines (which could even be used simultaneously on multiple
machines).

This is one of the main reason that I don't want to use the existing
tools. They rely on having a privileged service running that unprivilged
users connect to to request machines on. These systems work great for
running 'web-scale' services, where the machines don't interact with the
outside machine they are hosted on, but make for pretty terrible
development environments with many security hazards. LXC works a bit
better in this regard than others, although it is a [Canonical][]
project so the support on Red Hat distributions is terrible.

[docker]: https://www.docker.com/
[linux-containers]: https://linuxcontainers.org/
[kubernetes]: https://kubernetes.io/
[fedora]: https://getfedora.org/
[centos]: https://www.centos.org/
[red-hat]: https://www.redhat.com/
[selinux]: https://en.wikipedia.org/wiki/Security-Enhanced_Linux
[canonical]: https://www.canonical.com/

# New kernel features

The concept of _unprivileged_ containers is a fairly new one in terms of
stable kernel distributions (such as [Debian][] and [CentOS][]), so they
have limited or experimental support. In order to enable support for
this on CentOS 7, command line arguments have to be added to the kernel.

```bash
grubby \
	--args="user_namespace.enable=1 namespace.unpriv_enable=1" \
	--update-kernel="$(grubby --default-kernel)"
```

[debian]: https://www.debian.org/

# Harnessing the power of Rust

The [Rust][] programming language has quickly become my most favourite
to work with. I figured that I could make a tool myself that would
quickly and easily set up my containers for me with very little effort.
My initial thoughts for a design were to have a library for constructing
containers and take advantage of the blurry distinction between threads
and processes in Linux.

The design was to have a number of configurable namespaces with
associated configuration. Each would be able to pre and post configure a
namespace both externally and internally. This is important as user and
group ID maps (between the internal and external namespaces) have a
particular way of being set. They can only be properly set from outside
of the created namespace, meaning that you need a process that runs
_after_ the namespace has created to configure it from _outside_.

Linux will let you have multiple processes share a given virtual address
space (or have threads of a single process in separate namespaces with
separate PIDs?). The issue of managing thread-local storage to ensure
thread safety then arises. In most cases, your standard library and
language runtime will look after managing this for you. When you are
calling raw syscalls to create threads, you leave all of that behind.
As such, if you want to manage multiple threads in the same virtual
address space, you _must_ handle the thread local storage yourself.

An additional hurdle to building in this manner is that the concept of
address spaces is not well defined in Rust. The language as a whole
makes the assumption that everything will exist in the one virtual
address space. Creating a new address space (such as with _fork(2)_, is
effectively undefined or unhandled behaviour).

When you have a thread that exists in its own address space, the
language assumes that all of the references it has will still be valid
references to the old address space, or at least, it has no way of
enforcing the semantics of having 'shared' references to what actually
ends up being two different instances of data. (Adding the concept of
shared memory on top of this just adds even further confusion).

After a trying to make this work over a number of weeks, I came to the
conclusion that either this design would need far more design effort
than I had time for or was simply insufficient. Instead, I decided to
make use of the [`unshare`][unshare] library I had initially brushed off
but that I had initially brushed off.

[rust]: https://www.rust-lang.org/
[unshare]: https://docs.rs/unshare

# A multi-process approach

Due to the limitations of Rust's model of address spaces, I decided to
use [`unshare`][unshare] to manage the namespace isolation. The new
process would also have to make use of `newuidmap` and `newgidmap` from
the [shadow][] suite of tools (which do not happen to be available on
CentOS yet either).

The new tool would work in a much simpler manner in order to set up a
container.

1. The user calls the `container` tool with a command they would like to
   run within the container.
2. The tool reads a configuration file to configure the `unshare`
   library to set up the namespaces.
3. The tool then uses the `unshare` tool to execute _itself_ again,
   within the new container.
4. The tool then re-reads the configuration file to set up mounts,
   chroot, and working directory.
5. The tool then, finally, calls the command that was passed to it
   initally.

The code for this tool can be found [on github][container]. It's mostly
working now, but there are a few things that need to be redesigned and a
few small features I'd like to add.

[shadow]: https://github.com/shadow-maint/shadow
[container]: https://github.com/xurtis/container

# Constructing the filesystem tree

Now that we can create a container and `chroot`, the next thing we need
is a filesystem tree into which we can `chroot`. The first thing to keep
in mind is that the containers and namespaces will all still use the
same running kernel (which is why namespaces are so much more
lightweight than virtual machines).

Beyond this, any linux distribution that works with the given kernel can
be easily used within the container. The way that the filesystem is set
up is through a bootstrapping process. This basically involves tricking
a package manager of your choice into believing that a distribution
already exists in the directory structure you will use for your
container.

From the host distribution, you will need to run the package manager
with a configuration for the target distribution and set the root
directory to be the directory you will `chroot` into.

* The first package you will need to install in this manner is the
  package manager itself. You may also need a number of configuration
  files already there to help kick things off, such as
  `/etc/resolv.conf`.
* You will also probably want to install some kind of shell (`ksh` is
  usually a good place to start) and a `coreutils` package.

The above steps may need to be done as a root user as many package
managers believe that there is no reason to run them as a standard user.
There are two main options to get around this. The first is to do it as
the system's root user and `chown` them all to the desired user. The
second is to enter the target namespaces without chrooting and use the
root user provided there.

Once these base packages are installed, you should be able to chroot
into the container and continue to use it as a separate system.

# Configuring the container

The [`container`][container] tool uses [TOML][] configuration files to
set up namespaces. The configuration of namespaces will be described
here using the options provided in that file.

[toml]: https://github.com/toml-lang/toml

## Users and Groups

The first kind of namespace you will need if you wish to use
_unprivileged_ namespaces is a _user_ namespace. This is responsible for
setting up a mapping of user and group ids from the internal namespace
to the external namespace.

By default, this will put set the created process to `nobody` and map
that to the system's `nobody` user. The first user you will probably
want to use is actually `root` (the `container` tool actually tries to
set root by default).

In order to allow a root user to exist inside the namespace, it needs to
be mapped to a user in the external namespace.  The easiest way to do
this is to map the root user to the user that created the process. UID
and GID maps map continuous runs of users between namespaces, so mapping
just this one user and group would appear as follows.

```toml
namespaces = [
    # Unshare the user namespace.
    "user",
]

# Set the target user and group.
uid = 0
gid = 0

# Map root inside the namespace to the first user outside of the
# namespace.
[[uid_map]]
inside = 0
outside = 1000
count = 1

# Perform the same mapping for the group.
[[gid_map]]
inside = 0
outside = 1000
count = 1
```

However, if you want to simulate a full system, you would also need to
map users for system processes. To assist with this, Linux also provides
a _subuid(5)_ and _subgid(5)_ system which provides a range of UIDs and GIDs
to be assigned to unprivileged users for them to the remap as they
please.

You could instead map an entire range of addresses to ensure enough UIDs
and GIDs can be made for an entire set of system services as well.

```toml
# Map a whole system's worth of users to unsued UIDs in the parent
# namespace.
[[uid_map]]
inside = 0
outside = 100000
count = 65536

# Perform the same mapping for the group.
[[gid_map]]
inside = 0
outside = 100000
count = 65536
```

Any UIDs or GIDs from outside the namespace are then mapped to `nobody`
when they must be visible from inside the namespace. You may want to
ensure that in addition to the system UIDs, the data owned by the
creating user is also correctly mapped.

```toml
# System users
[[uid_map]]
inside = 0
outside = 100000
count = 1000

[[gid_map]]
inside = 0
outside = 100000
count = 1000

# External user
[[uid_map]]
inside = 1000
outside = 1000
count = 1

[[gid_map]]
inside = 1000
outside = 1000
count = 1

# Internal users
[[uid_map]]
inside = 2000
outside = 101000
count = 1000

[[gid_map]]
inside = 2000
outside = 101000
count = 1000
```

## Mountpoints

The _mount_ namespace is pretty straightforward. It inherits its
mountpoints from its parent and allows new mountpoints to be set to the
namespace without affecting the parent.

Setting up a container requires mounting parts of the external
filesystem into the chrooted filesystem and mounting the kernel provided
filesystems.

```toml
namespaces = [
	# Unshare the mount namespace
	"mount",
]

[[mount]]
option = "recursive_bind"
source = "/sys"
target = "/path/to/container/root/sys"

[[mount]]
option = "recursive_bind"
source = "/dev"
target = "/path/to/container/root/dev"

[[mount]]
option = "recursive_bind"
source = "/proc"
target = "/path/to/container/root/proc"

[[mount]]
option = "mount"
source = "tmpfs"
target = "/path/to/container/root/tmp"
filesystem_type = "tmpfs"
```

## Process Identification

To separate the processes inside the container from outside the
container, they must be placed into a new PID namespace. Processess from
one namespace cannot directly see the processes from another.

To ensure this is reflected in the filesystem, a new `proc` filesystem
should be mounted in the container rather than binding the existing
filesystem.

```toml
namespaces = [
	# Unshare the PID namespace
	"pid",
]

[[mount]]
option = "mount"
source = "proc"
target = "/path/to/container/root/proc"
filesystem_type = "proc"
```

## Hostname and Domain

The host that the system uses to identify itself to other computers and
applications are part of the Unix Time Sharing namespace.

```toml
namespaces = [
	# Unshare the UTS namespace
	"uts",
]

hostname = "container-name"
```

### Additional Namespaces

The network and cgroups namespaces can be unshared using the `container`
tool, although they have no associated configuration. The network cgroup
would require the internal and external processes to maintain a virtual
network connection between them to be fully useful for an unprivileged
user (the various container managers tend to use virtnet drivers to
assist with this).

---

Hopefully, this tool will enable me to make maximum utilisation of this
tool for setting up development environments on my server. It has
already proven to work so now I just need to prove it useful.
