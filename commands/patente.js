const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("patente")
    .setDescription("📋 Menu patenti")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("req_A")
        .setLabel("🏍 A")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("req_B")
        .setLabel("🚗 B")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("req_C-D")
        .setLabel("🚛 C-D")
        .setStyle(ButtonStyle.Secondary)
    );

    const channel = interaction.guild.channels.cache.find(c => c.name === "moduli-patente");

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale non trovato",
        ephemeral: true
      });
    }

    await channel.send({
      content: "📋 Clicca per richiedere patente",
      components: [row]
    });

    return interaction.reply({
      content: "✅ Menu inviato",
      ephemeral: true
    });
  }
};
