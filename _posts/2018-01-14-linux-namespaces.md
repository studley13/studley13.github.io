---
title: "Linux Namespaces"
tagline: "Isolating processes for cheap."
---

[Linux containers][linux-containers] have become popular in recent years
as an alternative to [virtualization][virtualization], providing
isolation of processes by creating lightweight machines in which to run
processes separated from each other.

[linux-containers]: https://linuxcontainers.org/
[virtualization]: https://en.wikipedia.org/wiki/Virtualization

# Emulating virtualization

The two most popular methods of achieving these isolated environments to
date have been [Docker][docker] and [LXC][lxc]. Both of these solutions
emulate the behaviour of virtualization. The provide an entire operating
system environment in the style of a virtual machine that you run your
process inside that is isolated from the system that they run on.

Both manage to achieve this with substantially less overhead than
what virtualization would normally require. The only catch is that both
the *host* machine and the *guest* machine have to be some variant of
Linux. Both provide a repository of complete guest machines you can also
download and start from, largely due to the complexity required to set
one up manually.

[docker]: https://www.docker.com/
[lxc]: https://linuxcontainers.org/lxc/introduction/

## But isn't Docker cross platform?

Yes, it is. It achieves this with a simple trick: start up a Linux
virtual machine using something like the [OS X
Hypervisor][osx-hypervisor] or Microsoft's [Hyper-V][hyper-v] and run
all of the containers from there.

This is a rather inelegant solution, especially considering the layers
of indirection through a [hypervisor][] that become hidden from the user
in the process. In general, you're probably better running Docker inside
an explicit Linux *host*.

[osx-hypervisor]: https://developer.apple.com/documentation/hypervisor
[hyper-v]: https://en.wikipedia.org/wiki/Hyper-V
[hypervisor]: https://en.wikipedia.org/wiki/Hypervisor

# Namespaces: the ace up Linux's sleeve

The reason that Linux is required to create these lightweight containers
is that it has a kernel-level feature that other operating systems lack:
namespace isolation.

Every process in Linux exists in one instance of each of the following
*namespaces*:

* [CGroup][] (or control groups); which controls physical system resource
  usage for resources such as CPU and memory,
* [IPC][]; which covers a set of mechanisms that allow processes
  communicate with each other,
* network; which covers the networking stacks and network devices
  available to a process,
* [Mount][]; which covers the file system tree that a process works
  within,
* [PID][]; which covers the unique numeric identifiers that are used to
  address each process,
* [User][uid]; Which covers the privileges an capabilities that a
  process has with regards to manipulating the system outside the
  process, and
* UTS; which covers the [hostname][] and [domain name][domain] of the system
  the process is running in.

Namespace isolation is the ability to provide processes a its own
instance of one or more of these namespaces. This can be used to
allocate a restricted set of CPU or memory resources to a set of
processes by placing them in the same *cgroup* namespace, give a set of
processes access to a restricted portion of the file system tree by
placing them in their own *mount* namespace, or give processes their own
system of which they are running as the [root user][root] (without having
root-level access to the whole system) by placing them in a *user*
namespace.

By placing a set of processes in a separate collection of these
namespaces, the processes look as though they exist in their own
entirely new system, there is no immediate indication that they were
started from a different set of namespaces.

The details of namespaces in Linux are documented in
[`namespaces(7)`][namespaces-7].

[cgroup]: https://en.wikipedia.org/wiki/Cgroups
[ipc]: https://en.wikipedia.org/wiki/Inter-process_communication
[mount]: https://en.wikipedia.org/wiki/Mount_(computing)
[pid]: https://en.wikipedia.org/wiki/Process_identifier
[uid]: https://en.wikipedia.org/wiki/User_identifier
[hostname]: https://en.wikipedia.org/wiki/Hostname
[domain]: https://en.wikipedia.org/wiki/Domain_name
[root]: https://en.wikipedia.org/wiki/Superuser
[namespaces-7]: http://man7.org/linux/man-pages/man7/namespaces.7.html

## BSD namespace isolation

For fans of FreeBSD, it may be tempting to say that BSD can achieve all of
this with [jails][freebsd-jails], but this is more of an all or nothing
game. The namespaces can be isolated on as granular a level and
namespaces can't be retroactively shared. FreeBSD's [Capsicum][] project
does go a long way to more granular capability control of processes, but
is still a long way from namespaces on Linux (which are separate to
Linux's  capability control mechanisms).

[freebsd-jails]: https://en.wikipedia.org/wiki/FreeBSD_jail
[capsicum]: https://wiki.freebsd.org/Capsicum

# Creating *namespaces*

The system generally runs all processes in the default instances of all
of the namespaces. Processes can, however, create new instances of any
of the Linux namespaces for itself or any child processes.

This means that a child is not aware of any parent namespaces it doesn't
share with its parent, but a parent is aware of the namespaces of its
direct children. This also means that namespaces can be easily nested.

There are three main ways that a process ends up in a new namespace:

* A process can remove itself from a set of namespaces, placing itself
  in a newly created set of namespaces using the
  [`unshare(2)`][unshare-2] [syscall][],
* A process can start a child process or thread and place inside a set
  of newly created namespaces using the [`clone(2)`][clone-2] syscall,
  or
* A process can swap the namespace it is in for the namespace of another
  process that it knows already exists, using the [`setns(2)`][setns-2]
  syscall.

Whilst all of these processes might observe different system resources
within their namespaces, it's important to note that they are all part
of the same operating system and all talking to the same Linux kernel.
All that is effectively occurring is some changes to tables in the
kernel here.

[unshare-2]: http://man7.org/linux/man-pages/man2/unshare.2.html
[clone-2]: http://man7.org/linux/man-pages/man2/clone.2.html
[setns-2]: http://man7.org/linux/man-pages/man2/setns.2.html
[syscall]: https://en.wikipedia.org/wiki/System_call

# Creating *containers*

Returning to Docker and LXC, it should be clear at this point that they
rely heavily on this namespace mechanism. It's the reason why the
overhead of their containers is so low. It's also the reason why they
both only work on Linux (although both create a complete isolation
system, similar mechanisms on other operating systems could still be
used to achieve a very similar result). 

The way that these tools seem to create a completely separate operating
system using this technology is largely through some mounting magic and
a whole lot of extra files. Simply create a copy of all of the system
files of the *guest* system somewhere in the *host* filesystem. After
that, you just need to create a process in a separate *mount* namespace
with the copied system files as the root.

# Even cheaper process isolation

In *most* cases, most of the processes you want to run will want to run
on almost identical systems. There's no reason to keep a complete copy
of the operating system they want to run on for each of them. Especially
when the *host* system is likely to be identical to the *guest*
operating systems. In most cases, virtualization (and anything that
mimics it) is probably overkill and a waste of resources.

Linux namespaces were designed as an inexpensive way to isolate
processes from each other, not as an inexpensive way to emulate the
rather expensive practice of running every service in its own virtual
machine. The most benefit will come from using this mechanism as it was
designed to be used. However, beyond calling the syscalls directly, there
isn't too many nice tools or libraries to assist with this in common
use.

If you can find such tools though, you can get all of the benefits you
care about from namespaces by dropping all of your processes into their
own namespaces, sharing the resources that they need to share and
isolating them from everything else.

------

I'm hoping to fix the tooling and library issue in a small way with my
[`isolate`][isolate] project, which will provide a nice library and command line
utility for using Linux namespace isolation and resource management.

[isolate]: https://github.com/xurtis/isolate
