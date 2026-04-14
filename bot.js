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
  TextInputStyle,
  AttachmentBuilder
} = require("discord.js");

// =========================
// EXPRESS (FIX RENDER PORT)
// =========================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot attivo");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Web server attivo su porta " + PORT));

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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

const userData = new Map();
let messaggioInviato = false;

// =========================
// INFO PATENTE + DIPARTIMENTO (COMPLETO)
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
Permette di far guidare camion, pullman o autobus, utili per il trasporto delle merci e delle persone.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Essere un cittadino registrato e approvato all’interno del server  
• Avere un comportamento civile e rispettoso delle regole RP  
• Non essere soggetto a sospensioni o provvedimenti attivi  
• Dimostrare una conoscenza adeguata delle norme di circolazione  
• Essere disponibile a sostenere sia una prova teorica che una pratica  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.

━━━━━━━━━━━━━━━━━━
📌 Procedura:
1) Completa il quiz patente  
2) Invia pagamento 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi verifica staff  
`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: [
    "1. Il casco è obbligatorio quando guidi la moto?",
    "2. I fari devono essere accesi anche di giorno?",
    "3. In curva bisogna rallentare prima di entrarci?",
    "4. Posso guidare senza guanti?",
    "5. Su strada bagnata, la frenata è più lunga?",
    "6. Il freno anteriore è più potente del posteriore?",
    "7. È vietato superare a destra?",
    "8. Pneumatici lisci sono sicuri?",
    "9. La freccia serve a indicare la direzione?",
    "10. Il casco deve essere allacciato?"
  ],
  B: [
    "1. Il casco è obbligatorio in auto?",
    "2. In città il limite è 50 km/h?",
    "3. La cintura di sicurezza va sempre allacciata?",
    "4. Posso sorpassare con linea continua?",
    "5. Il semaforo rosso significa stop?",
    "6. Posso usare telefono senza vivavoce?",
    "7. I fari vanno accesi di notte?",
    "8. I bambini devono stare nel seggiolino?"
  ],
  CD: [
    "1. Limite camion in città?",
    "2. Cosa fai al semaforo rosso?",
    "3. Chi ha precedenza?",
    "4. Cos’è il freno motore?",
    "5. Dove parcheggiano camion?"
  ]
};

// =========================
// READY
// =========================
client.once("clientReady", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messaggioInviato) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription(INFO_PATENTE);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Success)
    );

    await ch.send({ embeds: [embed], components: [row] });
    messaggioInviato = true;
  }
});

// =========================
// INTERACTION FIXED
// =========================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
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

    // SELECT
    if (interaction.isStringSelectMenu()) {
      const type = interaction.values[0];
      userData.set(interaction.user.id, { type });

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      const input = new TextInputBuilder()
        .setCustomId("answers")
        .setLabel("Rispondi alle domande")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // QUIZ
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      data.answers = interaction.fields.getTextInputValue("answers");

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("📸 Carica pagamento")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: "Ora invia UNO SCREENSHOT del pagamento in chat",
        components: [btn],
        ephemeral: true
      });
    }

    // PAY
    if (interaction.isButton() && interaction.customId === "pay") {

      await interaction.reply({
        content: "📤 Invia ora lo screenshot del pagamento qui in chat (file immagine)",
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0;

      const collected = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000
      });

      if (!collected.size) return;

      const msg = collected.first();
      const photo = msg.attachments.first().url;

      const data = userData.get(interaction.user.id);
      const staff = await client.channels.fetch(CANALE_STAFF);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 NUOVA PATENTE")
        .setDescription(`
👤 Utente: <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
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

      return;
    }

    // STAFF
    if (
      interaction.isButton() &&
      (interaction.customId.startsWith("accetta_") ||
       interaction.customId.startsWith("rifiuta_"))
    ) {

      await interaction.deferUpdate();

      const id = interaction.customId.split("_")[1];
      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(id).catch(() => null);

      if (!member) return;

      const tipo = userData.get(id)?.type;

      if (interaction.customId.startsWith("accetta_")) {
        if (tipo && RUOLI[tipo]) {
          await member.roles.add(RUOLI[tipo]).catch(() => {});
        }
      }

      return interaction.editReply({
        content: interaction.customId.startsWith("accetta_")
          ? `✅ ACCETTATO da ${interaction.user.tag}`
          : `❌ RIFIUTATO da ${interaction.user.tag}`,
        components: []
      });
    }

  } catch (err) {
    console.log("ERROR:", err);
  }
});

client.login(process.env.TOKEN);
