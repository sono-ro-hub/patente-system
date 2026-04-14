// =========================
// KEEP ALIVE (RENDER FIX)
// =========================
require("http").createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(3000);

// =========================
// IMPORT
// =========================
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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// =========================
// CONFIG MEMORY
// =========================
const userData = new Map();
let sent = false;

// =========================
// RUOLI
// =========================
const RUOLI = {
  A: config.patenteRoleId,
  B: config.patenteRoleId,
  CD: config.patenteRoleId
};

// =========================
// INFO PATENTE (COME CHIESTO)
// =========================
const INFO = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente
__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.
__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri. 
__🅲 Patente C-D__
Permette di far guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__
• Essere un __cittadino__ registrato nel server  
• Comportamento civile RP  
• Nessuna sospensione attiva  
• Conoscenza regole circolazione  
━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto automatico.
`;

// =========================
// QUIZ (COMPLETO A BLOCCHI)
// =========================
const quiz = {
  A: Array.from({ length: 30 }, (_, i) => `Domanda A ${i + 1}`),
  B: Array.from({ length: 30 }, (_, i) => `Domanda B ${i + 1}`),
  CD: Array.from({ length: 30 }, (_, i) => `Domanda CD ${i + 1}`)
};

// =========================
// READY (NO DUPLICATI)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(config.canaleRichieste);

  if (sent) return;

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("📄 RICHIESTA PATENTE")
    .setDescription("Premi il bottone per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
  sent = true;
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {

  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(INFO);

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
        embeds: [embed],
        components: [menu],
        ephemeral: true
      });
    }

    // SELECT → INFO + START QUIZ
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      const info = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("INFORMAZIONI PATENTE")
        .setDescription(`
1) Completa il quiz  
2) Invia 3000 al pagamento  
3) Carica screenshot  
4) Attendi staff
        `);

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start_quiz")
          .setLabel("Inizia quiz")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        embeds: [info],
        components: [btn],
        ephemeral: true
      });
    }

    // START QUIZ
    if (interaction.isButton() && interaction.customId === "start_quiz") {
      return sendQuiz(interaction);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId.startsWith("quiz_")) {

      const data = userData.get(interaction.user.id);
      const domande = quiz[data.type];

      const risposte = Object.values(interaction.fields.fields).map(f => f.value);
      data.answers.push(...risposte);

      data.step += 5;

      if (data.step >= domande.length) {

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("Paga 3000")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: "Quiz completato",
          components: [btn],
          ephemeral: true
        });
      }

      return sendQuiz(interaction);
    }

    // PAY
    if (interaction.isButton() && interaction.customId === "pay") {

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Pagamento 3000")
        .setDescription("Invia ORA lo screenshot nel messaggio del bot (come file Discord)");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("await_upload")
          .setLabel("Ho caricato lo screenshot")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }

    // UPLOAD STEP
    if (interaction.isButton() && interaction.customId === "await_upload") {

      return interaction.reply({
        content: "📸 Invia ora lo screenshot come ALLEGATO nel canale o DM del bot.",
        ephemeral: true
      });
    }

    // PAYMENT FINAL (staff)
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = userData.get(interaction.user.id);
      const staff = await client.channels.fetch(config.canaleStaff);

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("NUOVA PATENTE")
        .setDescription(`
👤 <@${interaction.user.id}>
Tipo: ${data.type}

Risposte:
${data.answers.join("\n")}
        `)
        .setImage("attachment://screenshot.png");

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

    // STAFF ACCEPT / REJECT + MOTIVO
    if (interaction.isButton() && (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo decisione");

      const input = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Scrivi il motivo")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];

      const guild = await client.guilds.fetch(config.guildId);
      const member = await guild.members.fetch(id).catch(() => null);

      const data = userData.get(id);
      const reason = interaction.fields.getTextInputValue("reason");

      if (member && data) {
        if (action.startsWith("accetta_")) {
          await member.roles.add(RUOLI[data.type]).catch(() => {});
        }
      }

      return interaction.reply({
        content: `${action.startsWith("accetta_") ? "ACCETTATO" : "RIFIUTATO"}\nMotivo: ${reason}`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// =========================
// QUIZ FUNCTION
// =========================
function sendQuiz(interaction) {

  const data = userData.get(interaction.user.id);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId(`quiz_${Date.now()}`)
    .setTitle("Quiz Patente");

  domande.forEach((q, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(q)
          .setStyle(TextInputStyle.Short)
      )
    );
  });

  return interaction.showModal(modal);
}

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
