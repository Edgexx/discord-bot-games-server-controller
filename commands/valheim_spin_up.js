const { SlashCommandBuilder } = require('@discordjs/builders');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');
const controller = require('../utilities/server_controller');
// Tutorials for Valheim Server install https://gamingph.com/2021/03/how-to-setup-valheim-dedicated-server-using-digitalocean-or-vultr/
// https://gameplay.tips/guides/9765-valheim.html    <- This one for graceful server shutdown.. Add KillSignal=SIGINT to service unit [Service] section

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('valheim-startup')
		.setDescription('Starts up the virtual private server for Valheim. (Est. ~2mins)'),

	async execute(interaction) {

		console.log("Received command to spin up VPS..");

		const status_findingVps = "Finding Valheim VPS...";
		const status_vpsStatus = "Valheim VPS Status...";
		const status_findingSnapshot = "Finding Valheim server snapshot...";
		const status_spinningUp = "Spinning up Valheim VPS (~2mins)...";
		const status_assignFloatingIp = "Attempting to assign Floating IP...";


		interaction.deferReply({ ephemeral: true }).then(
			function(){
				interaction.editReply(`${status_findingVps} ${controller.icons.loading}`);
			}
		);

		const droplet = await controller.GetDroplet(process.env.VALHEIM_SNAPSHOT_NAME);

		if (droplet != null) {
			console.log("Existing droplet found. Exiting command!");

			const ipv40 = droplet["networks"]["v4"][0]["ip_address"];
			const ipv41 = droplet["networks"]["v4"][1]["ip_address"];
			var ipAddress = ipv40;
			if(droplet["networks"]["v4"][0]["type"] != "public"){
				ipAddress = ipv41;
			}

			interaction.editReply(`Valheim VPS is already online! ${controller.icons.online} via IP Address: **${ipAddress}:2465**\nFor easy connection, right-click game in Steam > Properties and add to \"Launch Options\" \`+connect ${ipAddress}:2456\``);
			return;
		}

		interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_findingSnapshot} ${controller.icons.loading}`);

		const snapshot = await controller.GetSnapshot(process.env.VALHEIM_SNAPSHOT_NAME);

		if (snapshot == null) {
			console.log("Could not find snapshot. Exiting command!");
			interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_findingSnapshot} ${controller.icons.warning}`);
			return;
		}

		interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_findingSnapshot} ${controller.icons.success}\n${status_spinningUp} ${controller.icons.loading}`);

			// Create new droplet from image
			var dropletOptions = {
				"name": process.env.VALHEIM_SNAPSHOT_NAME,
				"region": "sfo3",
				"size": "s-2vcpu-4gb-intel",
				"image": snapshot["id"],
				"backups": false,
				"ipv6": false,
				"monitoring": true
			}

			const newDroplet = await controller.CreateDroplet(dropletOptions);

			if(newDroplet == null){
				console.log(err);
				interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_findingSnapshot} ${controller.icons.success}\n${status_spinningUp} ${controller.icons.warning}`);
				return;
			}

			// Wait for droplet status to be 'active'
			console.log("Sleeping for 30s...");
			await sleep(30000);
			var notActive = true;
			var totalWaitTime = 30000;
			do {
				const droplet = await controller.GetDroplet(newDroplet["name"]);
				if(droplet["status"] == "active"){
					notActive = false;
					console.log("Droplet active!");
				}
				else{
					totalWaitTime += 10000;
					console.log("Not active yet. Checking again in 10s...");
					await sleep(10000);
				}
			} while (notActive);

			// Assign floating IP address to droplets [[SKIPPING THIS FOR NOW.. SEEMS TO BE ISSUES CONNECTING TO VALHEIM SERVER WITH FLOATING IP]]
			/*interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_findingSnapshot} ${controller.icons.success}\n${status_spinningUp} ${controller.icons.success}\n${status_assignFloatingIp} ${controller.icons.loading}`);
			const assigned = await controller.AssignFloatingIp(process.env.VALHEIM_FLOATING_IP, newDroplet["id"]);

			const ipv40 = newDroplet["networks"]["v4"][0]["ip_address"];
			const ipv41 = newDroplet["networks"]["v4"][1]["ip_address"];
			var ipAddress = ipv40;
			if(newDroplet["networks"]["v4"][0]["type"] != "public"){
				ipAddress = ipv41;
			}

			ipAddress = assigned ? process.env.VALHEIM_FLOATING_IP : ipAddress;*/

			const ipv40 = newDroplet["networks"]["v4"][0]["ip_address"];
			const ipv41 = newDroplet["networks"]["v4"][1]["ip_address"];
			var ipAddress = ipv40;
			if(newDroplet["networks"]["v4"][0]["type"] != "public"){
				ipAddress = ipv41;
			}

			sleep(3000).then(() => {
				interaction.editReply(`Valheim VPS spin up complete! ${controller.icons.success} Valheim server should be available soon via IP Address: **${ipAddress}:2456**\nFor easy connection, right-click game in Steam > Properties and add to \"Launch Options\" \`+connect ${ipAddress}:2456\``);
			});

			// Delete the image (new one will be created when spinning down)
			const deleted = await controller.DeleteSnapshot(snapshot["id"]);
	},
}
