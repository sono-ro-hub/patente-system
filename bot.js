const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const { QUIZ } = require("./quiz");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ========================= CONFIG
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();

// ========================= KEEP ALIVE (RENDER)
const http = require("http");
http.createServer((req, res) => {
  res.end("Bot attivo");
}).listen(process.env.PORT || 3000);

// ========================= READY
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription("🏛️ Dipartimento Trasporti — Sud Italy RP");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ========================= FUNZIONE STEP
function getStepQuestions(type, step) {
  return QUIZ[type].slice(step * 5, (step + 1) * 5);
}

// ========================= INTERACTION
client.on("interactionCreate", async (interaction) => {
  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions([
            { label: "Patente A", value: "A" },
            { label: "Patente B", value: "B" },
            { label: "Patente C-D", value: "CD" }
          ])
      );

      return interaction.reply({
        content: "Seleziona la patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // SELECT
    if (interaction.isStringSelectMenu() && interaction.customId === "select") {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      const questions = getStepQuestions(type, 0);

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente - Step 1");

      questions.forEach((q, i) => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i + 1}`)
              .setLabel(q.slice(0, 45))
              .setStyle(TextInputStyle.Short)
          )
        );
      });

      return interaction.showModal(modal);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);

      const answers = [
        interaction.fields.getTextInputValue("q1"),
        interaction.fields.getTextInputValue("q2"),
        interaction.fields.getTextInputValue("q3"),
        interaction.fields.getTextInputValue("q4"),
        interaction.fields.getTextInputValue("q5")
      ];

      data.answers.push(...answers);
      data.step++;

      // SE NON FINITO
      if (data.step < 3) {

        const questions = getStepQuestions(data.type, data.step);

        const modal = new ModalBuilder()
          .setCustomId("quiz")
          .setTitle(`Quiz Patente - Step ${data.step + 1}`);

        questions.forEach((q, i) => {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId(`q${i + 1}`)
                .setLabel(q.slice(0, 45))
                .setStyle(TextInputStyle.Short)
            )
          );
        });

        return interaction.reply({
          content: "➡️ Continua il quiz...",
          ephemeral: true
        }).then(() => interaction.showModal(modal));
      }

      // FINE QUIZ
      return interaction.reply({
        content: "📸 Invia ora lo screenshot del pagamento.",
        ephemeral: true
      });
    }

    // STAFF BOTTONI
    if (
      interaction.isButton() &&
      (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))
    ) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi il motivo")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return interaction.showModal(modal);
    }

    // MOTIVO
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];
      const reason = interaction.fields.getTextInputValue("reason");

      const member = await interaction.guild.members.fetch(id);
      const data = userData.get(id);

      if (action.startsWith("accetta")) {
        await member.roles.add(RUOLI[data.type]);
        await member.send(`✅ Patente APPROVATA\nMotivo: ${reason}`);
      } else {
        await member.send(`❌ Patente RIFIUTATA\nMotivo: ${reason}`);
      }

      return interaction.reply({ content: "✔️ Fatto" });
    }

  } catch (err) {
    console.log(err);
  }
});

// ========================= LOGIN
client.login(process.env.TOKEN);
