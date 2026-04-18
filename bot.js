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
const CANALE_FOTO = "1494066451152240650";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
const pending = new Map();

require("http")
  .createServer((req, res) => res.end("OK"))
  .listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrarci?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata è più lunga?"
  ],
  B: [
    "Il casco è obbligatorio in auto?",
    "In città il limite è 50 km/h?",
    "La cintura va sempre allacciata?",
    "Posso sorpassare con linea continua?",
    "La distanza di sicurezza serve?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi anabbaglianti?",
    "Come comportarsi con ambulanza?"
  ]
};

// ================= READY =================
client.once("ready", async () => {

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setTitle("🏛️ Dipartimento Trasporti — Sud Italy RP")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente

__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.

__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri.

__🅲 Patente C-D__
Permette di guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste

• Essere un __cittadino__ registrato  
• Avere un __comportamento civile__  
• Non essere __sospeso__  
• Conoscere le norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico.`);

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

  try {

    // ================= START =================
    if (interaction.isButton() && interaction.customId === "start") {

      const member = interaction.member;

      const options = [
        { label: "Patente A", value: "A", description: "Moto" },
        { label: "Patente B", value: "B", description: "Auto" },
        { label: "Patente C-D", value: "CD", description: "Camion / Bus" }
      ];

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions(options)
      );

      return interaction.reply({
        content: "Seleziona patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // ================= SELECT FIX DEFINITIVO =================
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "select"
    ) {

      const type = interaction.values[0];
      const member = interaction.member;

      // 🔒 BLOCCO REALE (SERVER SIDE)
      if (type === "A" && member.roles.cache.has(RUOLI.A)) {
        return interaction.reply({ content: "❌ Hai già la Patente A", ephemeral: true });
      }

      if (type === "B" && member.roles.cache.has(RUOLI.B)) {
        return interaction.reply({ content: "❌ Hai già la Patente B", ephemeral: true });
      }

      if (type === "CD" && member.roles.cache.has(RUOLI.CD)) {
        return interaction.reply({ content: "❌ Hai già la Patente C-D", ephemeral: true });
      }

      if (!QUESTIONS[type]) {
        return interaction.reply({ content: "❌ Patente non valida", ephemeral: true });
      }

      userData.set(interaction.user.id, {
        type,
        answers: []
      });

      const q = QUESTIONS[type];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("q0")
            .setLabel(q[0])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("q1")
            .setLabel(q[1])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("q2")
            .setLabel(q[2])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("q3")
            .setLabel(q[3])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("q4")
            .setLabel(q[4])
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      data.answers = QUESTIONS[data.type].map((_, i) =>
        interaction.fields.getTextInputValue(`q${i}`)
      );

      data.waitingPhoto = true;

      return interaction.reply({
        content: `📸 Vai nel canale <#${CANALE_FOTO}> e carica la foto del pagamento.`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }

});

client.login(process.env.TOKEN);
