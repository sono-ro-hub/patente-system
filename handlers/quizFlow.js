const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require("discord.js");

const quiz = require("../quiz");
const { CANALE_STAFF, GUILD_ID } = require("../config");

module.exports = (client) => {

  client.userData = new Map();

  client.on("interactionCreate", async (interaction) => {
    try {

      // START
      if (interaction.isButton() && interaction.customId === "start") {

        const embed = new EmbedBuilder()
          .setTitle("📄 INIZIO QUIZ PATENTE")
          .setDescription("Seleziona il tipo di patente");

        const menu = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("A").setLabel("Patente A").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("B").setLabel("Patente B").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("CD").setLabel("Patente C-D").setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
      }

      // SELECT PATENTE
      if (["A","B","CD"].includes(interaction.customId)) {

        client.userData.set(interaction.user.id, {
          type: interaction.customId,
          step: 0,
          answers: []
        });

        return showQuestion(interaction);
      }

      // ANSWER QUIZ
      if (interaction.isModalSubmit() && interaction.customId === "quiz") {

        const data = client.userData.get(interaction.user.id);
        if (!data) return;

        const answer = interaction.fields.getTextInputValue("answer");

        data.answers.push({
          q: quiz[data.type][data.step],
          a: answer
        });

        data.step++;

        if (data.step >= quiz[data.type].length) {
          return finishQuiz(interaction, data);
        }

        return showQuestion(interaction);
      }

      // PAYMENT BUTTON
      if (interaction.isButton() && interaction.customId === "pay") {

        const modal = new ModalBuilder()
          .setCustomId("payment")
          .setTitle("Pagamento");

        const input = new TextInputBuilder()
          .setCustomId("photo")
          .setLabel("Link screenshot pagamento")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // PAYMENT SEND STAFF
      if (interaction.isModalSubmit() && interaction.customId === "payment") {

        const data = client.userData.get(interaction.user.id);
        if (!data) return;

        const photo = interaction.fields.getTextInputValue("photo");

        const staff = await client.channels.fetch(CANALE_STAFF);

        const embed = new EmbedBuilder()
          .setTitle("📄 NUOVA PATENTE")
          .setDescription(
            data.answers.map((x,i)=>
              `${i+1}. ${x.q}\n➡️ ${x.a}`
            ).join("\n\n")
          )
          .setImage(photo);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`accetta_${interaction.user.id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`rifiuta_${interaction.user.id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
        );

        await staff.send({ embeds: [embed], components: [row] });

        return interaction.reply({ content: "Inviato allo staff", ephemeral: true });
      }

      // STAFF ACTION
      if (interaction.isButton() &&
        (interaction.customId.startsWith("accetta_") ||
         interaction.customId.startsWith("rifiuta_"))
      ) {

        const { PATENTE_ROLE } = require("../config");

        await interaction.deferUpdate();

        const id = interaction.customId.split("_")[1];
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(id).catch(() => null);

        if (interaction.customId.startsWith("accetta_") && member) {
          await member.roles.add(PATENTE_ROLE).catch(() => {});
        }

        return interaction.editReply({
          content: interaction.customId.startsWith("accetta_")
            ? "✅ ACCETTATO"
            : "❌ RIFIUTATO",
          components: []
        });
      }

    } catch (err) {
      console.log(err);
    }
  });

};

// QUIZ MODAL
async function showQuestion(interaction) {
  const data = interaction.client.userData.get(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle(`Domanda ${data.step + 1}`);

  const input = new TextInputBuilder()
    .setCustomId("answer")
    .setLabel(require("../quiz")[data.type][data.step])
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  return interaction.showModal(modal);
}

// FINISH
async function finishQuiz(interaction, data) {

  const btn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pay")
      .setLabel("📸 PAGA E CARICA FOTO (OBBLIGATORIO)")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.reply({
    content: "Quiz completato",
    embeds: [
      new EmbedBuilder().setDescription(
        data.answers.map(x=>`${x.q}\n➡️ ${x.a}`).join("\n\n")
      )
    ],
    components: [btn],
    ephemeral: true
  });
          }
