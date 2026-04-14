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
// CLIENT (WORKER SAFE - NO PORT)
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

// =========================
// MEMORY
// =========================
const userData = new Map();
let messaggioInviato = false;

// =========================
// INFO PATENTE (AGGIORNATA COMPLETA)
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
📌 Procedura:
1) Completa il quiz patente  
2) Invia pagamento 3k a Lessimanuardi123  
3) Carica screenshot pagamento  
4) Attendi verifica staff  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.
`;

// =========================
// QUIZ
// =========================
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
    "La freccia è obbligatoria?",
    "Il casco deve essere allacciato?",
    "Posso guidare contromano?",
    "Il limite urbano è 50 km/h?",
    "Si può guidare senza patente?",
    "Con pioggia aumenta distanza?",
    "Il clacson è solo per emergenza?"
  ],
  B: [
    "Il casco è obbligatorio in auto?",
    "In città il limite è 50 km/h?",
    "La cintura va sempre allacciata?",
    "Posso sorpassare con linea continua?",
    "La distanza di sicurezza serve?",
    "Il semaforo rosso significa stop?",
    "Posso usare il telefono senza vivavoce?",
    "I fari vanno accesi di notte?",
    "La frenata sul bagnato è più lunga?",
    "I bambini devono usare seggiolini?",
    "La precedenza a destra vale sempre?",
    "Il parcheggio vietato è segnalato?",
    "Il sorpasso a sinistra è obbligatorio?",
    "Bisogna rispettare i limiti?",
    "Autostrada limite 130 km/h?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi anabbaglianti?",
    "Come comportarsi con ambulanza?",
    "Veicolo per più persone?",
    "Cos’è distanza sicurezza?",
    "Cos’è freno motore?",
    "Dove parcheggiano camion?",
    "Significato segnale camion?"
  ]
};

// =========================
// READY (NO PORT -> SAFE RENDER)
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messaggioInviato) {
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
    messaggioInviato = true;
  }
});

// =========================
// INTERACTION SYSTEM (STABILE)
// =========================
client.on("interactionCreate", async interaction => {
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

    // SELECT PATENTE (START QUIZ)
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      return showQuestion(interaction);
    }

    // QUIZ ANSWER
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answer = interaction.fields.getTextInputValue("answer");

      data.answers.push({
        q: quiz[data.type][data.step],
        a: answer
      });

      data.step++;

      if (data.step >= quiz[data.type].length) {
        return finishQuiz(interaction, data);
      }

      return showQuestion(interaction);
    }

    // PAYMENT
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

    // PAYMENT SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const photo = interaction.fields.getTextInputValue("photo");

      const staff = await client.channels.fetch(CANALE_STAFF);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("📄 NUOVA PATENTE")
        .setDescription(
          `👤 Utente: <@${interaction.user.id}>
🏷️ Tipo: ${data.type}

📋 RISPOSTE:
` +
          data.answers.map((x, i) => `${i + 1}. ${x.q}\n➡️ ${x.a}`).join("\n\n")
        )
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

      return interaction.reply({
        content: "✔ Richiesta inviata allo staff",
        ephemeral: true
      });
    }

    // STAFF ACTION
    if (
      interaction.isButton() &&
      (interaction.customId.startsWith("accetta_") ||
       interaction.customId.startsWith("rifiuta_"))
    ) {

      await interaction.deferUpdate();

      const id = interaction.customId.split("_")[1];
      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(id).catch(() => null);

      const data = userData.get(id);

      if (interaction.customId.startsWith("accetta_")) {
        if (member && data?.type && RUOLI[data.type]) {
          await member.roles.add(RUOLI[data.type]);
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

// =========================
// QUIZ FUNCTION (STEP SYSTEM)
// =========================
async function showQuestion(interaction) {
  const data = userData.get(interaction.user.id);

  const domanda = quiz[data.type][data.step];

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle(`Domanda ${data.step + 1}`);

  const input = new TextInputBuilder()
    .setCustomId("answer")
    .setLabel(domanda)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  return interaction.showModal(modal);
}

// =========================
// FINISH QUIZ
// =========================
async function finishQuiz(interaction, data) {

  const text = data.answers
    .map((x, i) => `${i + 1}. ${x.q}\n➡️ ${x.a}`)
    .join("\n\n");

  const btn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pay")
      .setLabel("📸 Carica pagamento (OBBLIGATORIO)")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.reply({
    content: "✔ Quiz completato. Ora procedi al pagamento.",
    embeds: [
      new EmbedBuilder()
        .setTitle("RISULTATI QUIZ")
        .setDescription(text)
        .setColor("Blue")
    ],
    components: [btn],
    ephemeral: true
  });
}

client.login(process.env.TOKEN);
