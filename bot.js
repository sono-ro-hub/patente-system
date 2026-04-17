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
const pendingRequests = new Map();

require("http").createServer((req, res) => res.end("OK")).listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = [
  "Casco obbligatorio?",
  "Fari anche di giorno?",
  "Limite urbano 50?",
  "Cintura obbligatoria?",
  "Semaforo rosso = stop?"
];

// ================= START =================
client.once("ready", async () => {
  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription("• 🏛️ Dipartimento Trasporti — Sud Italy RP");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {

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
      content: "Seleziona patente:",
      components: [menu],
      ephemeral: true
    });
  }

  // SELECT -> QUIZ
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      answers: []
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

  // QUIZ SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    for (let i = 0; i < QUESTIONS.length; i++) {
      data.answers.push(interaction.fields.getTextInputValue(`q${i}`));
    }

    data.waitingPhoto = true;

    return interaction.reply({
      content: "📸 Invia la foto pagamento nel canale patenti (clicca + e allega immagine)",
      ephemeral: true
    });
  }

  // ================= STAFF BUTTON =================
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("accetta_") &&
        !interaction.customId.startsWith("rifiuta_")) return;

    const id = interaction.customId.split("_")[1];

    const modal = new ModalBuilder()
      .setCustomId(`motivo_${interaction.customId}`)
      .setTitle("Motivo obbligatorio");

    const input = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Scrivi il motivo")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }

  // ================= MOTIVO =================
  if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

    const actionFull = interaction.customId.replace("motivo_", "");
    const [action, id] = actionFull.split("_");

    const req = pendingRequests.get(id);
    if (!req) return interaction.reply({ content: "❌ Richiesta non trovata", ephemeral: true });

    const reason = interaction.fields.getTextInputValue("reason");

    const member = await interaction.guild.members.fetch(id).catch(() => null);

    const decision = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

    const qa = req.answers
      .map((a, i) => `**${QUESTIONS[i]}** → ${a}`)
      .join("\n");

    // 🔥 FIX FOTO (FILE vero, NON URL)
    const file = req.photo ? [{ attachment: req.photo, name: "pagamento.png" }] : [];

    const embed = new EmbedBuilder()
      .setTitle(`📄 PATENTE ${decision}`)
      .setColor(decision === "APPROVATA" ? "Green" : "Red")
      .addFields(
        { name: "👤 Utente", value: `<@${id}>`, inline: true },
        { name: "🚗 Patente", value: req.type, inline: true },
        { name: "🧠 Quiz", value: qa },
        { name: "📝 Motivazione", value: reason },
        { name: "👮 Deciso da", value: `<@${interaction.user.id}>` }
      )
      .setFooter({ text: "Sistema Patenti Sud Italy RP" });

    const staff = await client.channels.fetch(CANALE_STAFF);

    await staff.send({
      embeds: [embed],
      files: file
    });

    if (member) {
      if (decision === "APPROVATA") {
        await member.roles.add(RUOLI[req.type]);
        await member.send("✅ Patente approvata");
      } else {
        await member.send("❌ Patente rifiutata");
      }
    }

    pendingRequests.delete(id);

    return interaction.reply({ content: "✔ Fatto", ephemeral: true });
  }
});

// ================= PHOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  if (msg.channel.id !== CANALE_PATENTI) return;

  const img = msg.attachments.first();
  if (!img) return;

  try { await msg.delete(); } catch {}

  pendingRequests.set(msg.author.id, {
    type: data.type,
    answers: data.answers,
    photo: img.url
  });

  userData.delete(msg.author.id);

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields(
      { name: "🚗 Patente", value: data.type },
      { name: "🧠 Risposte", value: data.answers.join("\n") },
      { name: "📸 Stato", value: "Foto ricevuta ✔" }
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
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
