# [Discord Bot] Game Server Controller

**Disclaimer - This was created for my specific use-case(s). However, with the current state it wouldn't require too much effort to expand and iterate upon. I'll probably only update this as I need it, personally.**

Description:
A Discord bot for the purposes of (very) simple management of a DigitalOcean droplet which has a game server installed.
Interactions with the Discord bot is through Discord slash commands. Can spin up or down a VPS ("droplet"), or check the status. Shutting down a droplet will actually delete the droplet, but the bot will first create an image/snapshot to then be used when spinning it back up. The main benefit of this is to not pay money for the 'offline' time where nobody is playing on the server. 'Startup' the server when wanting to play, then 'shutdown' when done playing.

Currently, the commands are only for Minecraft and Valheim.

`/valheim-startup`
`/valheim-shutdown`
`/valheim-status`

`/mc-startup`
`/mc-shutdown`
`/mc-status`

Prerequisites:
- A discord bot with slash command permission scope
- A DigitalOcean droplet with a either a Valheim or Minecraft server
