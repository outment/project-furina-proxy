# PROJECT FURINA PROXY
Project Furina Proxy is a simple piece of code that allows the proxying of Project Furina Servers directly to the Public Internet.

How it works:
Host <--> PlayIt (FireWalled) <--> OnRender <--> Public Internet

Essentially, we can firewall PlayIt to only allow access from OnRender IP addresses since they are static. This allows us to essentially only allow traffic coming from OnRender directly to PlayIt.

PlayIt Firewall:
```
35.160.120.126/32 allow
44.233.151.27/32 allow
34.211.200.85/32 allow
0.0.0.0/0 deny
::/0 deny
```
This ensures only OnRender can access it, and we can proxy to and from PlayIt, and therefore our servers accordingly.

-# For those of you who want to visit the website, it is firewalled.
