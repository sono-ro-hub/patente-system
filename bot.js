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

require("http").createServer((req,res)=>res.end("OK"))
.listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = {
A:[
"Il casco è obbligatorio quando guidi la moto?",
"I fari devono essere accesi anche di giorno?",
"In curva bisogna rallentare prima di entrarci?",
"Posso guidare senza guanti?",
"Su strada bagnata la frenata è più lunga?"
],
B:[
"Il casco è obbligatorio in auto?",
"In città il limite è 50 km/h?",
"La cintura va sempre allacciata?",
"Posso sorpassare con linea continua?",
"La distanza di sicurezza serve?"
],
CD:[
"Limite camion in città?",
"Cosa fai al semaforo rosso?",
"Chi ha precedenza agli incroci?",
"Quando accendi anabbaglianti?",
"Come comportarsi con ambulanza?"
]
};

// ================= READY =================
client.once("ready", async () => {

  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#87CEFA")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente
__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.

__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri.

__🅲 Patente C-D__
Permette di far guidare __camion__, __pullman__ o __autobus__, utili per il trasporto delle merci e delle persone.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato e approvato all’interno del server  
• Avere un __comportamento civile__ e rispettoso delle regole RP  
• Non essere __soggetto__ a __sospensioni__ o provvedimenti attivi  
• Dimostrare una __conoscenza adeguata__ delle norme di circolazione

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.

**📄INFORMAZIONI PATENTE📄**
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz per la patente che volete fare e attendere che lo staff member lo corregga***

**2) Inviare 3k in game all'id Lessimanuardi123 e inviare la foto su PAGAMENTI PATENTE e attendere che lo staff member applichi la tipologia di patente desiderata***

**3) Invitiamo tutti a fare la patente per viaggiare in maniera sicura e in maniera indipendente, Il consiglio che possiamo è quando vi ferma un agente delle FDO per una controllo dovete fornire il nome discord e per vedere se avete la tipologia di patente per la quale state usando il veicolo se vi vedranno senza patente dovrete pagare __**1k di multa**__`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION =================
client.on("interactionCreate", async interaction => {

try {

  // ================= START (FIX CORRETTO) =================
  if (interaction.isButton() && interaction.customId === "start") {

    const member = await interaction.guild.members.fetch(interaction.user.id);

    const requestedTypes = ["A", "B", "CD"];

    // controlla SOLO se ha già quella specifica patente
    const hasAll = {
      A: member.roles.cache.has(RUOLI.A),
      B: member.roles.cache.has(RUOLI.B),
      CD: member.roles.cache.has(RUOLI.CD)
    };

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions([
          {
            label: hasAll.A ? "Patente A (GIÀ POSSEDUTA)" : "Patente A",
            value: "A",
            description: hasAll.A ? "Già possiedi questa patente" : "Moto"
          },
          {
            label: hasAll.B ? "Patente B (GIÀ POSSEDUTA)" : "Patente B",
            value: "B",
            description: hasAll.B ? "Già possiedi questa patente" : "Auto"
          },
          {
            label: hasAll.CD ? "Patente C-D (GIÀ POSSEDUTA)" : "Patente C-D",
            value: "CD",
            description: hasAll.CD ? "Già possiedi questa patente" : "Camion/Bus"
          }
        ])
    );

    return interaction.reply({
      content: "Seleziona patente:",
      components: [menu],
      ephemeral: true
    });
  }

  // ================= BLOCCO PER SINGOLA PATENTE =================
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(RUOLI[type])) {
      return interaction.reply({
        content: "❌ Hai già questa patente e non puoi rifarla.",
        ephemeral: true
      });
    }

    userData.set(interaction.user.id, {
      type,
      answers: []
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    QUESTIONS[type].forEach((q, i) => {
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

  // ================= STAFF BUTTON =================
  if (interaction.isButton()) {

    if (
      interaction.customId.startsWith("accetta_") ||
      interaction.customId.startsWith("rifiuta_")
    ) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo obbligatorio");

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
  }

  // ================= FINAL EMBED =================
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("motivo_")
  ) {

    const full = interaction.customId.replace("motivo_", "");
    const last = full.lastIndexOf("_");

    const action = full.slice(0, last);
    const id = full.slice(last + 1);

    const req = pending.get(id);
    if (!req) return;

    const reason = interaction.fields.getTextInputValue("reason");

    const member = await interaction.guild.members.fetch(id).catch(() => null);

    const qa = req.answers.map((a, i) =>
      `**${QUESTIONS[req.type][i]}**\n${a}`
    ).join("\n\n");

    const decision = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

    const embed = new EmbedBuilder()
      .setTitle(`📄 PATENTE ${decision}`)
      .setColor(decision === "APPROVATA" ? "Green" : "Red")
      .addFields(
        { name: "👤 Utente", value: `<@${id}>` },
        { name: "🚗 Patente", value: req.type, inline: true },
        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true },
        { name: "━━━━━━━━━━━━", value: " " },
        { name: "📋 Quiz", value: qa.slice(0, 1024) },
        { name: "📝 Motivo", value: reason }
      )
      .setImage("attachment://pagamento.png");

    const staff = await client.channels.fetch(CANALE_STAFF);

    await staff.send({
      embeds: [embed],
      files: [{ attachment: req.photo, name: "pagamento.png" }]
    });

    if (member && action === "accetta") {
      await member.roles.add(RUOLI[req.type]);
    }

    pending.delete(id);

    return interaction.reply({
      content: "✔ Fatto",
      ephemeral: true
    });
  }

} catch (err) {
  console.log(err);
}
});

// ================= FOTO =================
client.on("messageCreate", async msg => {

try {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const res = await fetch(attachment.url);
  const buffer = Buffer.from(await res.arrayBuffer());

  pending.set(msg.author.id, {
    type: data.type,
    answers: data.answers,
    photo: buffer
  });

  userData.delete(msg.author.id);

} catch (err) {
  console.log(err);
}
});

client.login(process.env.TOKEN);
