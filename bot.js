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
    GatewayIntentBits.MessageContent
  ]
});

const userData = new Map();

// 🔥 ID
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";

const RUOLO_PATENTE_A = "1493609058438090773";
const RUOLO_PATENTE_B = "1493609132996165633";
const RUOLO_PATENTE_CD = "1493609213086142645";

// 📌 ANTI DOPPIA RICHIESTA
const richiesteAttive = new Set();

// 📌 QUIZ COMPLETO
const quiz = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrarci?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata è più lunga?",
    "Il freno anteriore è più potente?",
    "È vietato superare a destra?",
    "Pneumatici lisci sono sicuri?",
    "La freccia serve a indicare direzione?",
    "Il casco deve essere allacciato?",
    "Posso guidare contromano?",
    "Limite città 50 km/h?",
    "Guidare senza patente è permesso?",
    "Pioggia aumenta distanza?",
    "Clacson solo per pericolo?"
  ],
  B: [
    "Cintura sempre obbligatoria?",
    "Limite città 50 km/h?",
    "Semaforo rosso stop?",
    "Cellulare senza vivavoce?",
    "Frenata su bagnato più lunga?",
    "Bambini su seggiolino?",
    "Precedenza a destra sempre?",
    "Sorpasso a sinistra?",
    "Limite autostrada 130 km/h?",
    "Fari di notte obbligatori?",
    "Semaforo rosso significa stop?",
    "Parcheggio vietato segnale blu?",
    "Distanza sicurezza serve?",
    "Sorpasso linea continua?",
    "Rispetto limiti sempre?"
  ],
  CD: [
    "Limite camion città?",
    "Semaforo rosso cosa fai?",
    "Precedenza incrocio?",
    "Luci quando?",
    "Ambulanza cosa fai?",
    "Veicolo trasporto persone?",
    "Distanza sicurezza?",
    "Freno camion discesa?",
    "Dove parcheggiare camion?",
    "Segnale camion cosa significa?"
  ]
};

// =========================
// READY MESSAGE
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("RICHIESTA PATENTE")
    .setDescription("Clicca qui per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Richiedi patente")
      .setStyle(ButtonStyle.Success)
  );

  ch.send({ embeds: [embed], components: [row] });
});

// =========================
// INTERACTION
// =========================
client.on("interactionCreate", async interaction => {

  // START
  if (interaction.isButton() && interaction.customId === "start") {

    if (richiesteAttive.has(interaction.user.id))
      return interaction.reply({ content: "Hai già una richiesta attiva", ephemeral: true });

    richiesteAttive.add(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("INFORMAZIONI PATENTE")
      .setDescription(`__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz e attendere lo staff***

**2) Inviare 3k a Lessimanuardi123 e foto pagamento***

**3) Se senza patente multa 1k**
`);

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

    return interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
  }

  // SELECT PATENTE
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, { type });

    const domande = quiz[type].map((q, i) => `${i + 1}) ${q}`).join("\n");

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    const input = new TextInputBuilder()
      .setCustomId("answers")
      .setLabel("Rispondi a tutte le domande")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(domande)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // QUIZ SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    data.answers = interaction.fields.getTextInputValue("answers");

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pay")
        .setLabel("📸 Invia pagamento")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "Ora invia pagamento",
      components: [btn],
      ephemeral: true
    });
  }

  // PAYMENT BUTTON
  if (interaction.isButton() && interaction.customId === "pay") {

    const modal = new ModalBuilder()
      .setCustomId("payment")
      .setTitle("Pagamento");

    const input = new TextInputBuilder()
      .setCustomId("photo")
      .setLabel("Link foto pagamento")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // PAYMENT SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "payment") {

    const data = userData.get(interaction.user.id);
    const photo = interaction.fields.getTextInputValue("photo");

    const staff = await client.channels.fetch(CANALE_STAFF);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("NUOVA PATENTE")
      .setDescription(`
👤 Utente: <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 Risposte:
${data.answers}
`)
      .setImage(photo);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accetta_${interaction.user.id}`)
        .setLabel("ACCETTA")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`rifiuta_${interaction.user.id}`)
        .setLabel("RIFIUTA")
        .setStyle(ButtonStyle.Danger)
    );

    await staff.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "Inviato allo staff", ephemeral: true });
  }

  // STAFF ACCEPT / REJECT
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("accetta_")) {

      const member = await interaction.guild.members.fetch(interaction.customId.split("_")[1]);

      if (userData.get(member.id)?.type === "A") member.roles.add(RUOLO_PATENTE_A);
      if (userData.get(member.id)?.type === "B") member.roles.add(RUOLO_PATENTE_B);
      if (userData.get(member.id)?.type === "CD") member.roles.add(RUOLO_PATENTE_CD);

      richiesteAttive.delete(member.id);

      return interaction.update({
        content: `✅ ACCETTATO da ${interaction.user.tag}`,
        components: []
      });
    }

    if (interaction.customId.startsWith("rifiuta_")) {

      const memberId = interaction.customId.split("_")[1];
      richiesteAttive.delete(memberId);

      return interaction.update({
        content: `❌ RIFIUTATO da ${interaction.user.tag}`,
        components: []
      });
    }
  }
});

client.login(process.env.TOKEN);
