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
    .setDescription("Invia menu patenti (staff only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("req_A")
        .setLabel("🏍 Patente A")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("req_B")
        .setLabel("🚗 Patente B")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("req_C-D")
        .setLabel("🚛 Patente C-D")
        .setStyle(ButtonStyle.Secondary)
    );

    const channel = interaction.guild.channels.cache.find(
      c => c.name === "moduli-patente"
    );

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale moduli-patente non trovato",
        ephemeral: true
      });
    }

    await channel.send({
      content: "📋 **NUOVA RICHIESTA PATENTE**\nClicca sotto per iniziare:",
      components: [row]
    });

    return interaction.reply({
      content: "✅ Menu patente inviato nel canale!",
      ephemeral: true
    });
  }
};
