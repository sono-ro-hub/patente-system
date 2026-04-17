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
const CANALE_PATENTI = "1493595963942768860";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// ================= MEMORY =================
const userData = new Map();

// ================= KEEP ALIVE =================
require("http").createServer((req, res) => res.end("OK")).listen(process.env.PORT || 3000);

// ================= INFO =================
const INFO = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale.

━━━━━━━━━━━━━━━━━━
📋 Patenti:
A = moto
B = auto
C-D = camion/bus

━━━━━━━━━━━━━━━━━━
⚠️ Rispetta le regole del server
`;

// ================= QUIZ (5 DOMANDE FISSE PER STABILITÀ) =================
const QUESTIONS = [
  "Casco obbligatorio?",
  "Fari anche di giorno?",
  "Limite urbano 50?",
  "Cintura obbligatoria?",
  "Semaforo rosso = stop?"
];

// ================= READY =================
client.once("ready", async () => {
  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription(INFO);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= START =================
client.on("interactionCreate", async (interaction) => {

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
      content: "Seleziona patente:",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= SELECT -> QUIZ =================
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      answers: [],
      step: 0,
      waitingPhoto: false
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    QUESTIONS.forEach((q, i) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`q${i}`)
            .setLabel(q)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    });

    return interaction.showModal(modal);
  }

  // ================= QUIZ SUBMIT =================
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    for (let i = 0; i < QUESTIONS.length; i++) {
      data.answers.push(interaction.fields.getTextInputValue(`q${i}`));
    }

    data.waitingPhoto = true;

    return interaction.reply({
      content: "📸 Ora invia la foto pagamento nel canale patenti (solo allegato)",
      ephemeral: true
    });
  }
});

// ================= PHOTO HANDLER =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  if (msg.channel.id !== CANALE_PATENTI) return;

  const img = msg.attachments.first();
  if (!img) return;

  try { await msg.delete(); } catch {}

  data.photo = img.url;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields(
      { name: "Patente", value: data.type },
      { name: "Risposte", value: data.answers.join("\n") }
    )
    .setImage(img.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${msg.author.id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rifiuta_${msg.author.id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  await staff.send({ embeds: [embed], components: [row] });

  userData.delete(msg.author.id);
});

// ================= STAFF =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith("accetta_") &&
      !interaction.customId.startsWith("rifiuta_")) return;

  const id = interaction.customId.split("_")[1];
  const member = await interaction.guild.members.fetch(id).catch(() => null);

  const type = interaction.customId.startsWith("accetta_") ? "APPROVATA" : "RIFIUTATA";

  if (member) {
    if (type === "APPROVATA") {
      const data = userData.get(id);
      if (data) await member.roles.add(RUOLI[data.type]);

      await member.send("✅ Patente approvata");
    } else {
      await member.send("❌ Patente rifiutata");
    }
  }

  return interaction.reply({ content: "✔ Fatto", ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
