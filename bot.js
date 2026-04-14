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

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ["CHANNEL"]
});

// =========================
// MEMORY
// =========================
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
Permette di far guidare camion, pullman o autobus.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• cittadino registrato nel server  
• comportamento civile RP  
• nessuna sospensione attiva  
• conoscenza regole circolazione  
• esame teorico + pratico  

━━━━━━━━━━━━━━━━━━
📌 Procedura:
1) Completa quiz patente  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi staff
`;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata aumenta?",
    "Il freno anteriore è più forte?",
    "Si può superare a destra?",
    "Pneumatici lisci sono sicuri?",
    "Le frecce servono?",
    "Casco va allacciato?",
    "Contromano è permesso?",
    "Limite città 50km/h?",
    "Guidare senza patente è legale?",
    "Pioggia aumenta distanza?",
    "Clacson solo emergenza?"
  ],
  B: [
    "Cintura sempre obbligatoria?",
    "Semaforo rosso = stop?",
    "Cellulare senza vivavoce?",
    "Fari di notte obbligatori?",
    "Sorpasso con linea continua?",
    "Limite autostrada 130?",
    "Seggiolino bambini?",
    "Precedenza a destra?",
    "Parcheggio vietato segnalato?",
    "Distanza sicurezza serve?",
    "Sorpasso sempre a sinistra?",
    "Rispettare limiti?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al rosso?",
    "Ambulanza ha priorità?",
    "Cos’è freno motore?",
    "Dove parcheggi camion?",
    "Segnale camion?",
    "Distanza sicurezza minima?",
    "Quando accendi luci?"
  ]
};

// =========================
// READY
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
// QUIZ START
// =========================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 INFORMAZIONI PATENTE")
        .setDescription(INFO_PATENTE);

      const menu = new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions([
          { label: "Patente A", value: "A" },
          { label: "Patente B", value: "B" },
          { label: "Patente C-D", value: "CD" }
        ]);

      return interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
    }

    // SELECT → START DM QUIZ
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      await interaction.reply({
        content: "📩 Controlla i DM per il quiz!",
        ephemeral: true
      });

      const dm = await interaction.user.createDM();
      await dm.send(`🏛️ Inizio quiz patente (${type})`);
      await dm.send(quiz[type][0]);
    }

    // DM ANSWERS (QUIZ FLOW)
    if (interaction.channel?.type === 1) {
      const data = userData.get(interaction.user.id);
      if (!data) return;

      const q = quiz[data.type];

      data.answers.push(interaction.content);
      data.step++;

      if (data.step < q.length) {
        return interaction.channel.send(q[data.step]);
      }

      return interaction.channel.send(
        "📸 Quiz completato!\nOra invia lo screenshot del pagamento 3k."
      );
    }

    // PAYMENT SUBMIT (SEMPLIFICATO)
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

    // SEND TO STAFF
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = userData.get(interaction.user.id);

      const staff = await client.channels.fetch(config.canaleStaff);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 NUOVA PATENTE")
        .setDescription(
`👤 <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
${data.answers.join("\n")}`
        )
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

      await staff.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: "Inviato allo staff",
        ephemeral: true
      });
    }

    // STAFF MOTIVO OBBLIGATORIO
    if (interaction.isButton() &&
      (interaction.customId.startsWith("accetta_") ||
       interaction.customId.startsWith("rifiuta_"))) {

      const modal = new ModalBuilder()
        .setCustomId(interaction.customId)
        .setTitle("Motivo obbligatorio");

      const input = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Scrivi il motivo")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // STAFF FINAL
    if (interaction.isModalSubmit() &&
      (interaction.customId.startsWith("accetta_") ||
       interaction.customId.startsWith("rifiuta_"))) {

      const userId = interaction.customId.split("_")[1];
      const reason = interaction.fields.getTextInputValue("reason");

      const guild = await client.guilds.fetch(config.guildId);
      const member = await guild.members.fetch(userId).catch(() => null);

      const ok = interaction.customId.startsWith("accetta_");

      if (ok && member) {
        await member.roles.add(config.patenteRoleId).catch(() => {});
      }

      const user = await client.users.fetch(userId).catch(() => null);

      if (user) {
        await user.send(
          ok
            ? `✅ Patente APPROVATA\nMotivo: ${reason}`
            : `❌ Patente RIFIUTATA\nMotivo: ${reason}`
        );
      }

      return interaction.reply({
        content: ok ? "Accettato" : "Rifiutato",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log("ERROR:", err);
  }
});

client.login(process.env.TOKEN);
