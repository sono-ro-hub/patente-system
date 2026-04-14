const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { CANALE_RICHIESTE } = require("../config");

module.exports = (client) => {

  client.once("ready", async () => {

    const ch = await client.channels.fetch(CANALE_RICHIESTE);

    const embed = new EmbedBuilder()
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription("Premi il bottone per iniziare");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ embeds: [embed], components: [row] });
  });

};
