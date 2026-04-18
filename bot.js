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

// ================= EXPRESS FIX (RENDER WEB SERVICE) =================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot online ✔");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo su porta", PORT);
});

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= CONFIG =================
const CANALE_RICHIESTE = "1493595963942768860";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Casco obbligatorio?",
    "Fari di giorno?",
    "Curva: rallentare?",
    "Guanti obbligatori?",
    "Strada bagnata?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Limite città 50?",
    "Sorpasso linea continua?",
    "Distanza sicurezza?",
    "Specchietti obbligatori?"
  ],
  CD: [
    "Limite camion città?",
    "Semaforo rosso?",
    "Precedenza incrocio?",
    "Ambulanza cosa fai?",
    "Velocità sicura?"
  ]
};

// ================= READY =================
client.once("ready", async () => {

  console.log("BOT ONLINE ✔");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setTitle("🏛️ Dipartimento Trasporti")
    .setDescription("Clicca per iniziare la patente.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("INIZIA PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {

  try {

    // ================= START =================
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
        content: "Scegli la patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu() && interaction.customId === "select") {

      const type = interaction.values[0];

      userData.set(interaction.user.id, { type });

      const q = QUESTIONS[type];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      const rows = [];

      for (let i = 0; i < 5; i++) {
        rows.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i}`)
              .setLabel(q[i].slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      }

      modal.addComponents(rows);

      return interaction.showModal(modal);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answers = [];

      for (let i = 0; i < 5; i++) {
        answers.push(interaction.fields.getTextInputValue(`q${i}`));
      }

      return interaction.reply({
        content: `✔ Hai completato il quiz per la patente **${data.type}**`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }

});

client.login(process.env.TOKEN);
