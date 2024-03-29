const { SlashCommandBuilder } = require('@discordjs/builders');
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');
const controller = require('../utilities/server_controller');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('valheim-status')
		.setDescription('Get the current status of the Valheim VPS.'),

	async execute(interaction) {

		console.log("Received command to check VPS status..");

		const status_searching = "Finding Valheim VPS...";
		const status_vpsStatus = "VPS Status...";

		await interaction.deferReply({ ephemeral: true });

		interaction.editReply(`${status_searching} ${controller.icons.loading}`);

		const droplet = await controller.GetDroplet(process.env.VALHEIM_SNAPSHOT_NAME);

		if (droplet == null) {
			console.log("No existing droplets found. Exiting command.")
			interaction.editReply(`Valheim VPS status:  ${controller.icons.offline}`);
			return;
		}

		var status = (droplet.status == 'active');
		status = status ? controller.icons.online : controller.icons.offline;

		let ipAddress = controller.GetPublicIp(droplet);
        const domainRecords = await controller.GetDomainRecords();
        let dRecId;
        domainRecords.forEach(element => {
            if(element.name == "valheim"){
                dRecId = element.id;
            }
        });

        if(dRecId !== 0){
            ipAddress = 'valheim.edgex.games';
        }

		interaction.editReply(`${status_searching} ${controller.icons.success}\n${status_vpsStatus} ${status}\nIP Address: **${ipAddress}:2456**\nPassword: **${process.env.VALHEIM_SERVER_PASSWORD}**`);
	},
};
