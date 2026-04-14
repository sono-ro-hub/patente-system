module.exports = async (interaction, client, config, userData) => {

  if (!interaction.isButton()) return;

  if (
    !interaction.customId.startsWith("accetta_") &&
    !interaction.customId.startsWith("rifiuta_")
  ) return;

  const [action, userId] = interaction.customId.split("_");

  const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
  } = require("discord.js");

  const modal = new ModalBuilder()
    .setCustomId(`${action}_${userId}`)
    .setTitle(action === "accetta" ? "ACCETTA PATENTE" : "RIFIUTA PATENTE");

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Motivo obbligatorio")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reason));

  return interaction.showModal(modal);

  // =========================
  // MODAL
  // =========================
};

const handleModal = async (interaction, client, config, userData) => {

  if (!interaction.isModalSubmit()) return;

  if (
    !interaction.customId.startsWith("accetta_") &&
    !interaction.customId.startsWith("rifiuta_")
  ) return;

  const [type, userId] = interaction.customId.split("_");
  const reason = interaction.fields.getTextInputValue("reason");

  const guild = await client.guilds.fetch(config.guildId);
  const member = await guild.members.fetch(userId).catch(() => null);

  const data = userData.get(userId);

  const staffChannel = await client.channels.fetch(config.canaleStaff);
  const msg = data?.messageId
    ? await staffChannel.messages.fetch(data.messageId).catch(() => null)
    : null;

  if (type === "accetta") {

    await member?.roles.add(config.patenteRoleId).catch(() => {});

    if (msg) {
      msg.edit({
        content: `✅ ACCETTATO da ${interaction.user.tag}\n📝 Motivo: ${reason}`,
        components: []
      }).catch(() => {});
    }

    return interaction.reply({
      content: "Patente ACCETTATA",
      ephemeral: true
    });
  }

  if (type === "rifiuta") {

    if (msg) {
      msg.edit({
        content: `❌ RIFIUTATO da ${interaction.user.tag}\n📝 Motivo: ${reason}`,
        components: []
      }).catch(() => {});
    }

    return interaction.reply({
      content: "Patente RIFIUTATA",
      ephemeral: true
    });
  }
};

module.exports.handleModal = handleModal;
