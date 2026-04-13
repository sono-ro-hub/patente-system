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

    // 🔧 FIX QUI
    const channel = interaction.guild.channels.cache.find(
      c => c.name === "patente"
    );

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale 'patente' non trovato",
        ephemeral: true
      });
    }

    await channel.send({
      content: "📋 **CLICCA QUI PER RICHIEDERE LA PATENTE**",
      components: [row]
    });

    return interaction.reply({
      content: "✅ Menu patente inviato nel canale!",
      ephemeral: true
    });
  }
};
