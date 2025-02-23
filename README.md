# PROJECT FURINA PROXY
Project Furina Proxy is a simple piece of code that allows the proxying of Project Furina Servers directly to the Public Internet.

How it works:
Host <--> Playit (FireWalled) <--> OnRender <--> Public Internet

Essentially, we can firewall Playit to only allow access from OnRender IP addresses since they are static. This allows us to essentially only allow traffic coming from OnRender directly to PlayIt.
