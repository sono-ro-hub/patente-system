// =========================
// KEEP ALIVE (RENDER FIX)
// =========================
require("http").createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(process.env.PORT || 3000);

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

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =========================
// CONFIG
// =========================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const GUILD_ID = "1484912853126221896";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// =========================
// MEMORY
// =========================
const userData = new Map();
let sent = false;

// =========================
// QUIZ
// =========================
const quiz = {
  A: ["Casco obbligatorio?", "Fari di giorno?", "Rallentare in curva?", "Si può guidare senza patente?", "Strada bagnata = frenata lunga?"],
  B: ["Cintura obbligatoria?", "Semaforo rosso = stop?", "Cellulare senza vivavoce?", "Fari notte obbligatori?", "Limite autostrada 130?"],
  CD: ["Limite camion città?", "Rosso cosa fai?", "Ambulanza priorità?", "Freno motore cos'è?", "Distanza sicurezza?"]
};

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!sent) {
    const embed = new EmbedBuilder()
      .setColor("#0b3d91")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription(`
• 🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente

🅰️ Patente A → Moto  
🅱️ Patente B → Auto  
🅲 Patente C-D → Camion/Bus  

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste

• Essere cittadino registrato  
• Comportamento civile RP  
• Nessuna sospensione  
• Conoscenza norme  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto
`);

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
        content: "Seleziona la patente",
        components: [menu],
        ephemeral: true
      });
    }

    // SELECT → INFO PRIMA DEL QUIZ
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      const embed = new EmbedBuilder()
        .setColor("#0b3d91")
        .setTitle("📄 INFORMAZIONI PATENTE")
        .setDescription(`
INFORMAZIONI PATENTE

1) Completa il quiz  
2) Invia 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi staff  

⚠️ Senza patente → multa 1k
`);

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start_quiz")
          .setLabel("Inizia Quiz")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [btn],
        ephemeral: true
      });
    }

    // START QUIZ
    if (interaction.isButton() && interaction.customId === "start_quiz") {
      return sendQuiz(interaction, interaction.user.id);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      const risposte = interaction.fields.fields.map(f => f.value);

      data.answers.push(...risposte);
      data.step += 5;

      if (data.step >= quiz[data.type].length) {

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("Carica pagamento")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: "Quiz completato. Ora carica il pagamento.",
          components: [btn],
          ephemeral: true
        });

      } else {
        return sendQuiz(interaction, interaction.user.id);
      }
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
      const staff = await client.channels.fetch(CANALE_STAFF);

      const embed = new EmbedBuilder()
        .setColor("#0b3d91")
        .setTitle("📄 NUOVA PATENTE")
        .setDescription(`
👤 <@${interaction.user.id}>
Tipo: ${data.type}

Risposte:
${data.answers.join("\n")}
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

      return interaction.reply({ content: "Inviato allo staff", ephemeral: true });
    }

    // STAFF → CHIEDE MOTIVO
    if (interaction.isButton()) {

      if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

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
    }

    // MOTIVO + RUOLO AUTOMATICO
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const action = interaction.customId.replace("motivo_", "");
      const id = action.split("_")[1];

      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(id);

      const tipo = userData.get(id)?.type;

      if (action.startsWith("accetta_") && tipo) {
        await member.roles.add(RUOLI[tipo]).catch(() => {});
      }

      return interaction.reply({
        content: action.startsWith("accetta_")
          ? `✅ ACCETTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
          : `❌ RIFIUTATO\nMotivo: ${interaction.fields.getTextInputValue("reason")}`
      });
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// QUIZ FUNCTION
// =========================
function sendQuiz(interaction, userId) {

  const data = userData.get(userId);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  domande.forEach((d, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(d)
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
