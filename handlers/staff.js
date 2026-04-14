module.exports = async (interaction, client, config, userData) => {

  // =========================
  // CLICK BOTTONI STAFF
  // =========================
  if (interaction.isButton()) {

    if (
      !interaction.customId.startsWith("accetta_") &&
      !interaction.customId.startsWith("rifiuta_")
    ) return;

    const [action, userId, messageId] = interaction.customId.split("_");

    const modal = {
      accetta: "staff_accept",
      rifiuta: "staff_reject"
    }[action];

    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

    const m = new ModalBuilder()
      .setCustomId(`${modal}_${userId}_${messageId}`)
      .setTitle(action === "accetta" ? "ACCETTA PATENTE" : "RIFIUTA PATENTE");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Motivo obbligatorio")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    m.addComponents(new ActionRowBuilder().addComponents(reason));

    return interaction.showModal(m);
  }

  // =========================
  // MODAL SUBMIT
  // =========================
  if (interaction.isModalSubmit()) {

    if (
      !interaction.customId.startsWith("staff_accept") &&
      !interaction.customId.startsWith("staff_reject")
    ) return;

    const [type, userId, messageId] = interaction.customId.split("_");

    const reason = interaction.fields.getTextInputValue("reason");

    const guild = await client.guilds.fetch(config.guildId);
    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "Utente non trovato",
        ephemeral: true
      });
    }

    const data = userData.get(userId);

    const channel = await client.channels.fetch(config.canaleStaff);
    const msg = await channel.messages.fetch(messageId).catch(() => null);

    // =========================
    // ACCETTA
    // =========================
    if (type === "staff_accept") {

      if (data?.type && config.patenteRoleId) {
        await member.roles.add(config.patenteRoleId).catch(() => {});
      }

      if (msg) {
        msg.edit({
          content: `✅ ACCETTATO da ${interaction.user.tag}\n📝 Motivo: ${reason}`,
          components: []
        }).catch(() => {});
      }

      return interaction.reply({
        content: "✔ Patente ACCETTATA con motivo registrato",
        ephemeral: true
      });
    }

    // =========================
    // RIFIUTA
    // =========================
    if (type === "staff_reject") {

      if (msg) {
        msg.edit({
          content: `❌ RIFIUTATO da ${interaction.user.tag}\n📝 Motivo: ${reason}`,
          components: []
        }).catch(() => {});
      }

      return interaction.reply({
        content: "✖ Patente RIFIUTATA con motivo registrato",
        ephemeral: true
      });
    }
  }
};
