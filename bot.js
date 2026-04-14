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

// =========================
// CLIENT (RENDER SAFE)
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =========================
// MEMORY
// =========================
const userData = new Map();
const quizProgress = new Map();
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
• Essere cittadino registrato nel server  
• Comportamento RP corretto  
• Nessuna sospensione attiva  
• Conoscenza base regole circolazione  
• Disponibilità esame teorico + pratico  

━━━━━━━━━━━━━━━━━━
📌 Procedura:
1) Completa quiz patente  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi staff
`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari anche di giorno?",
    "Rallentare in curva?",
    "Guida senza patente?",
    "Strada bagnata frena peggio?",
    "Freno anteriore più forte?",
    "Superare a destra?",
    "Pneumatici lisci ok?",
    "Freccia serve?",
    "Casco allacciato?",
    "Contromano permesso?",
    "Limite città 50?",
    "Pioggia aumenta distanza?",
    "Clacson solo emergenza?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare senza vivavoce?",
    "Fari di notte?",
    "Linea continua sorpasso?",
    "Autostrada 130?",
    "Seggiolino bambini?",
    "Precedenza destra?",
    "Parcheggio vietato?",
    "Distanza sicurezza?",
    "Sorpasso sempre sinistra?",
    "Rispettare limiti?"
  ],
  CD: [
    "Limite camion città?",
    "Cosa fai al rosso?",
    "Ambulanza priorità?",
    "Freno motore cos'è?",
    "Dove parcheggi camion?",
    "Segnale camion?",
    "Distanza sicurezza?",
    "Anabbaglianti quando?"
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
      .setDescription("Premi il bottone per iniziare");

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

    // =========================
    // START
    // =========================
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 INFORMAZIONI PATENTE")
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

    // =========================
    // START QUIZ (1 DOMANDA ALLA VOLTA)
    // =========================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      quizProgress.set(interaction.user.id, {
        type,
        index: 0,
        answers: []
      });

      const domanda = quiz[type][0];

      const modal = new ModalBuilder()
        .setCustomId("quiz_step")
        .setTitle("Quiz Patente");

      const input = new TextInputBuilder()
        .setCustomId("answer")
        .setLabel(domanda.slice(0, 45))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // =========================
    // QUIZ STEP
    // =========================
    if (interaction.isModalSubmit() && interaction.customId === "quiz_step") {

      const data = quizProgress.get(interaction.user.id);
      if (!data) return;

      const answer = interaction.fields.getTextInputValue("answer");

      data.answers.push({
        domanda: quiz[data.type][data.index],
        risposta: answer
      });

      data.index++;

      // FINE QUIZ
      if (data.index >= quiz[data.type].length) {

        quizProgress.set(interaction.user.id, data);

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("📸 Carica pagamento (OBBLIGATORIO)")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: "Quiz completato! Ora invia pagamento 3k",
          components: [btn],
          ephemeral: true
        });
      }

      // PROSSIMA DOMANDA
      const next = quiz[data.type][data.index];

      const modal = new ModalBuilder()
        .setCustomId("quiz_step")
        .setTitle("Quiz Patente");

      const input = new TextInputBuilder()
        .setCustomId("answer")
        .setLabel(next.slice(0, 45))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // =========================
    // PAYMENT BUTTON
    // =========================
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

    // =========================
    // PAYMENT SUBMIT
    // =========================
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = quizProgress.get(interaction.user.id);

      const staff = await client.channels.fetch(config.canaleStaff);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 NUOVA PATENTE")
        .setDescription(`
👤 <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
${data.answers.map(a => `Q: ${a.domanda}\nA: ${a.risposta}`).join("\n\n")}
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

      await staff.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: "Inviato allo staff",
        ephemeral: true
      });
    }

    // =========================
    // STAFF HANDLER
    // =========================
    await staffHandler(interaction, client, config, userData);

  } catch (err) {
    console.log("ERROR:", err);
  }
});

client.login(process.env.TOKEN);
