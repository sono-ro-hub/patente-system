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

const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot online ✔"));

app.listen(process.env.PORT || 3000, () => {
  console.log("Server attivo");
});

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
const CANALE_STAFF = "1493597555760824503";
const CANALE_FOTO = "1494066451152240650";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
const pending = new Map();

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

// ================= START =================
client.on("interactionCreate", async (interaction) => {

  try {

    if (interaction.isButton() && interaction.customId === "start") {

      const member = interaction.member;

      const options = [
        { label: member.roles.cache.has(RUOLI.A) ? "Patente A (GIÀ)" : "Patente A", value: "A" },
        { label: member.roles.cache.has(RUOLI.B) ? "Patente B (GIÀ)" : "Patente B", value: "B" },
        { label: member.roles.cache.has(RUOLI.CD) ? "Patente C-D (GIÀ)" : "Patente C-D", value: "CD" }
      ];

      return interaction.reply({
        content: "Seleziona patente:",
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select")
              .setPlaceholder("Scegli patente")
              .addOptions(options)
          )
        ],
        ephemeral: true
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];
      const member = interaction.member;

      // 🔒 BLOCCO SE GIÀ POSSEDUTA
      if (member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          ephemeral: true
        });
      }

      userData.set(interaction.user.id, {
        type,
        answers: []
      });

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
    if (interaction.isModalSubmit()) {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answers = [];

      for (let i = 0; i < 5; i++) {
        answers.push(interaction.fields.getTextInputValue(`q${i}`));
      }

      data.answers = answers;
      data.waitingPhoto = true;

      return interaction.reply({
        content: `📸 Ora vai nel canale <#${CANALE_FOTO}> e invia la foto del pagamento.`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: attachment.url
  });

  userData.delete(msg.author.id);

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  await staff.send({ embeds: [embed], components: [row] });
});

// ================= STAFF DECISION =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const [action, id] = interaction.customId.split("_");
  const req = pending.get(id);

  if (!req) return;

  const member = await interaction.guild.members.fetch(req.userId);

  if (action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

  const user = await client.users.fetch(req.userId);

  await user.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(action === "accetta" ? "✔ PATENTE APPROVATA" : "❌ PATENTE RIFIUTATA")
        .setDescription(`Patente: **${req.type}**`)
    ]
  }).catch(() => {});

  pending.delete(id);

  return interaction.reply({
    content: "✔ Fatto",
    ephemeral: true
  });
});

client.login(process.env.TOKEN);
