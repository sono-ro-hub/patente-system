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

      const options = [];

      // 🔒 PATENTE A
      options.push({
        label: member.roles.cache.has(RUOLI.A)
          ? "Patente A (GIÀ POSSEDUTA)"
          : "Patente A",
        value: "A",
        description: "Moto e veicoli a due ruote",
        disabled: member.roles.cache.has(RUOLI.A)
      });

      // 🔒 PATENTE B
      options.push({
        label: member.roles.cache.has(RUOLI.B)
          ? "Patente B (GIÀ POSSEDUTA)"
          : "Patente B",
        value: "B",
        description: "Auto e veicoli leggeri",
        disabled: member.roles.cache.has(RUOLI.B)
      });

      // 🔒 PATENTE CD
      options.push({
        label: member.roles.cache.has(RUOLI.CD)
          ? "Patente C-D (GIÀ POSSEDUTA)"
          : "Patente C-D",
        value: "CD",
        description: "Camion e autobus",
        disabled: member.roles.cache.has(RUOLI.CD)
      });

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

    // ================= SELECT =================
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "select"
    ) {

      const type = interaction.values[0];

      // 🔒 SICUREZZA
      if (!QUESTIONS[type]) {
        return interaction.reply({
          content: "❌ Patente non valida o già posseduta",
          ephemeral: true
        });
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

    // ================= STAFF =================
    if (interaction.isButton()) {

      const [action, userId] = interaction.customId.split("_");
      if (!action || !userId) return;

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${action}_${userId}`)
        .setTitle("Motivo decisione");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi il motivo")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // ================= FINAL =================
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const [, action, userId] = interaction.customId.split("_");

      const req = pending.get(userId);
      if (!req) {
        return interaction.reply({
          content: "❌ Richiesta non trovata",
          ephemeral: true
        });
      }

      const reason = interaction.fields.getTextInputValue("reason");

      const member = await interaction.guild.members.fetch(userId).catch(() => null);

      const decision = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

      const staffEmbed = new EmbedBuilder()
        .setTitle(`📄 PATENTE ${decision}`)
        .setColor(decision === "APPROVATA" ? "Green" : "Red")
        .addFields(
          { name: "👤 Utente", value: `<@${userId}>` },
          { name: "🚗 Patente", value: req.type },
          { name: "📝 Motivo", value: reason },
          { name: "👮 Staff", value: `<@${interaction.user.id}>` }
        );

      const staff = await client.channels.fetch(CANALE_STAFF);
      await staff.send({ embeds: [staffEmbed] });

      if (member && action === "accetta") {
        await member.roles.add(RUOLI[req.type]);
      }

      const user = await client.users.fetch(userId);
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`📄 Patente ${decision}`)
            .setColor(decision === "APPROVATA" ? "Green" : "Red")
            .setDescription(`La tua richiesta è stata **${decision}**`)
        ]
      }).catch(() => {});

      pending.delete(userId);

      return interaction.reply({
        content: "✔ Fatto",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }

});

client.login(process.env.TOKEN);
