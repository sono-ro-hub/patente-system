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
const pending = new Map();

require("http").createServer((req, res) => res.end("OK")).listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrarci?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata è più lunga?",
    "Il freno anteriore è più potente?",
    "È vietato superare a destra?",
    "Pneumatici lisci sono sicuri?",
    "La freccia è obbligatoria?",
    "Il casco deve essere allacciato?",
    "Posso guidare contromano?",
    "Il limite urbano è 50 km/h?",
    "Si può guidare senza patente?",
    "Con pioggia aumenta distanza?",
    "Il clacson è solo per emergenza?"
  ],
  B: [
    "Il casco è obbligatorio in auto?",
    "In città il limite è 50 km/h?",
    "La cintura va sempre allacciata?",
    "Posso sorpassare con linea continua?",
    "La distanza di sicurezza serve?",
    "Il semaforo rosso significa stop?",
    "Posso usare telefono senza vivavoce?",
    "I fari vanno accesi di notte?",
    "La frenata sul bagnato è più lunga?",
    "I bambini devono usare seggiolini?",
    "La precedenza a destra vale sempre?",
    "Il parcheggio vietato è segnalato?",
    "Il sorpasso a sinistra è obbligatorio?",
    "Bisogna rispettare i limiti?",
    "Autostrada limite 130 km/h?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi anabbaglianti?",
    "Come comportarsi con ambulanza?",
    "Veicolo per più persone?",
    "Cos’è distanza sicurezza?",
    "Cos’è freno motore?",
    "Dove parcheggiano camion?",
    "Significato segnale camion?"
  ]
};

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

// ================= START MENU =================
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

  // ================= QUIZ =================
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      answers: []
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    QUESTIONS[type].slice(0, 5).forEach((q, i) => {
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

    const qs = QUESTIONS[data.type].slice(0, 5);

    data.answers = qs.map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.waitingPhoto = true;

    return interaction.reply({
      content: "📸 Invia la foto pagamento nel canale patenti (clicca + e allega immagine)",
      ephemeral: true
    });
  }
});

// ================= FOTO HANDLER (FIX VERO) =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_PATENTI) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  // 🔥 DOWNLOAD FOTO PRIMA DI DELETE
  const res = await fetch(attachment.url);
  const buffer = Buffer.from(await res.arrayBuffer());

  try { await msg.delete(); } catch {}

  pending.set(msg.author.id, {
    type: data.type,
    answers: data.answers,
    photo: buffer
  });

  userData.delete(msg.author.id);

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields(
      { name: "🚗 Patente", value: data.type },
      { name: "📸 Stato", value: "Foto ricevuta ✔" }
    )
    .setImage(attachment.url);

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

// ================= STAFF DECISION =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("accetta_") &&
      !interaction.customId.startsWith("rifiuta_")) return;

  const id = interaction.customId.split("_")[1];
  const req = pending.get(id);

  if (!req) return interaction.reply({ content: "❌ Dati non trovati", ephemeral: true });

  const modal = new ModalBuilder()
    .setCustomId(`motivo_${interaction.customId}`)
    .setTitle("Motivo obbligatorio");

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Scrivi il motivo")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  return interaction.showModal(modal);
});

// ================= RESULT =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("motivo_")) return;

  const actionFull = interaction.customId.replace("motivo_", "");
  const [action, id] = actionFull.split("_");

  const req = pending.get(id);
  if (!req) return;

  const reason = interaction.fields.getTextInputValue("reason");

  const member = await interaction.guild.members.fetch(id).catch(() => null);

  const qs = QUESTIONS[req.type].slice(0, 5);

  const qa = req.answers
    .map((a, i) => `**${qs[i]}** → ${a}`)
    .join("\n");

  const decision = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

  const embed = new EmbedBuilder()
    .setTitle(`📄 PATENTE ${decision}`)
    .setColor(decision === "APPROVATA" ? "Green" : "Red")
    .addFields(
      { name: "👤 Utente", value: `<@${id}>` },
      { name: "🚗 Patente", value: req.type },
      { name: "📋 QUIZ", value: qa },
      { name: "📝 Motivo", value: reason },
      { name: "👮 Staff", value: `<@${interaction.user.id}>` }
    )
    .setImage(req.photo ? "attachment://pagamento.png" : null);

  const staff = await client.channels.fetch(CANALE_STAFF);

  await staff.send({
    embeds: [embed],
    files: req.photo
      ? [{ attachment: req.photo, name: "pagamento.png" }]
      : []
  });

  if (member) {
    if (decision === "APPROVATA") {
      await member.roles.add(RUOLI[req.type]);
      await member.send("✅ Patente approvata");
    } else {
      await member.send("❌ Patente rifiutata");
    }
  }

  pending.delete(id);

  return interaction.reply({ content: "✔ Fatto", ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
