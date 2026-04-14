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

const config = require("./config.json");
const staffHandler = require("./handlers/staff");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const userData = new Map();
let sent = false;

// =========================
// INFO PATENTE
// =========================
const INFO_PATENTE = `
🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
🅰️ Patente A
Consente la guida di motocicli e veicoli a due ruote.

🅱️ Patente B
Permette di guidare autovetture e veicoli leggeri.

🅲 Patente C-D
Permette camion, pullman e autobus.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Cittadino registrato nel server  
• Comportamento civile RP  
• Nessuna sanzione attiva  
• Conoscenza base codice stradale  
• Esame teorico + pratico

━━━━━━━━━━━━━━━━━━
📌 Procedura:
1) Quiz patente  
2) Pagamento 3k a Lessimanuardi123  
3) Screenshot pagamento  
4) Attesa staff
`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: [
    "Casco obbligatorio moto?",
    "Fari anche di giorno?",
    "Rallentare in curva?",
    "Guidare senza patente?",
    "Pioggia = più distanza?",
    "Freno anteriore più forte?",
    "Superare a destra?",
    "Pneumatici lisci ok?",
    "Frecce obbligatorie?",
    "Casco allacciato?",
    "Contromano permesso?",
    "Limite città 50?",
    "Clacson solo emergenza?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare senza vivavoce?",
    "Fari notte obbligatori?",
    "Linea continua sorpasso?",
    "Autostrada 130?",
    "Seggiolino bambini?",
    "Precedenza destra?",
    "Parcheggio vietato segnalato?",
    "Distanza sicurezza?",
    "Sorpasso sempre sinistra?"
  ],
  CD: [
    "Limite camion città?",
    "Rosso cosa fai?",
    "Ambulanza priorità?",
    "Freno motore cos’è?",
    "Dove parcheggi camion?",
    "Segnale camion?",
    "Distanza sicurezza?",
    "Anabbaglianti quando?"
  ]
};

// =========================
// READY (FIX RENDER NO PORT)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(config.canaleRichieste);

  if (!sent) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription("Premi per iniziare");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ embeds: [embed], components: [row] });
    sent = true;
  }
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🏛️ Dipartimento Trasporti — Sud Italy RP")
        .setDescription(INFO_PATENTE);

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

    // SELECT → QUIZ VISIBILE (DOMANDE + RISPOSTE)
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];
      userData.set(interaction.user.id, { type });

      const domande = quiz[type];

      let formatted = domande.map((q, i) =>
        `**${i + 1}) ${q}**\n✍️ Risposta:`
      ).join("\n\n");

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      const input = new TextInputBuilder()
        .setCustomId("answers")
        .setLabel("Rispondi a tutte le domande")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(formatted);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      data.answers = interaction.fields.getTextInputValue("answers");

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("Carica pagamento OBBLIGATORIO")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: "Ora carica lo screenshot del pagamento (3k)",
        components: [btn],
        ephemeral: true
      });
    }

    // PAY
    if (interaction.isButton() && interaction.customId === "pay") {

      const modal = new ModalBuilder()
        .setCustomId("payment")
        .setTitle("Pagamento");

      const input = new TextInputBuilder()
        .setCustomId("photo")
        .setLabel("Link screenshot pagamento")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // PAYMENT
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = userData.get(interaction.user.id);

      const staff = await client.channels.fetch(config.canaleStaff);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 NUOVA RICHIESTA PATENTE")
        .setDescription(`
👤 Utente: <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
${data.answers}
`)
        .setImage(interaction.fields.getTextInputValue("photo"));

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

      const msg = await staff.send({ embeds: [embed], components: [row] });

      // FIX IMPORTANTISSIMO: salviamo messageId per staff handler
      userData.set(interaction.user.id, {
        ...data,
        messageId: msg.id
      });

      return interaction.reply({
        content: "Inviato allo staff",
        ephemeral: true
      });
    }

    await staffHandler(interaction, client, config, userData);

  } catch (err) {
    console.log("ERROR:", err);
  }
});

client.login(process.env.TOKEN);
