const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("patente")
    .setDescription("📋 Menu patente A / B / C-D"),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("🏁 Sistema Patenti")
      .setDescription(`
Seleziona il tipo di patente:

🏍️ Patente A
🚗 Patente B
🚛 Patente C-D

⚠️ Obbligatorio:
- compilare quiz
- inviare pagamento (3k)
- inviare foto pagamento
- attesa approvazione staff
      `);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("req_A")
        .setLabel("🏍️ Patente A")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("req_B")
        .setLabel("🚗 Patente B")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("req_C")
        .setLabel("🚛 Patente C-D")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
