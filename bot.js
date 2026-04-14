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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// evita crash listener
client.setMaxListeners(0);

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
// INFORMAZIONI PATENTE
// =========================
const INFO_PATENTE = `
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz per la patente che volete fare e attendere che lo staff member lo corregga***

**2)Inviare 3k in game all'id **Lessimanuardi123** e inviare la foto sul bot dove darà l'opzione**** ***e attendere che lo staff member applichi la tipologia di patente desiderata***

**3) Invitiamo tutti a fare la patente per viaggiare in maniera sicura e in maniera indipendente, Il consiglio che possiamo è quando vi ferma un agente delle FDO per una controllo dovete fornire il nome discord e per vedere se avete la tipologia di patente per la quale state usando il veicolo se vi vedranno senza patente dovrete pagare __**1k di multa**__
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
    "9. La freccia serve a indicare la direzione e i sorpassi?",
    "10. Il casco deve essere allacciato durante la guida?",
    "11. Posso guidare contromano in città?",
    "12. La velocità massima in città è di solito 50 km/h?",
    "13. Guidare senza patente è permesso?",
    "14. In caso di pioggia devo aumentare la distanza di sicurezza?",
    "15. Il clacson va usato solo per avvertire pericolo?"
  ],
  B: [
    "1. Il casco è obbligatorio in auto?",
    "2. In città il limite è 50 km/h?",
    "3. La cintura di sicurezza va allacciata sempre?",
    "4. Posso sorpassare con linea continua?",
    "5. La distanza di sicurezza serve a fermarsi in tempo?",
    "6. Il semaforo rosso significa fermo?",
    "7. Posso usare il cellulare senza vivavoce mentre guido?",
    "8. I fari vanno accesi di notte?",
    "9. La frenata su strada bagnata è più lunga?",
    "10. I bambini devono essere su seggiolini?",
    "11. La precedenza a destra vale sempre?",
    "12. Il parcheggio vietato è segnalato?",
    "13. Il sorpasso a sinistra è sempre obbligatorio?",
    "14. Il conducente deve rispettare i limiti?",
    "15. In autostrada il limite è 130 km/h?"
  ],
  CD: [
    "1. Qual è il limite di velocità per camion in città?",
    "2. Cosa fai al semaforo rosso?",
    "3. Chi ha precedenza agli incroci?",
    "4. Quando accendi luci anabbaglianti?",
    "5. Come ti comporti con ambulanza?",
    "6. Qual è il veicolo per più persone?",
    "7. Distanza minima di sicurezza?",
    "8. Cos’è il freno motore?",
    "9. Dove puoi parcheggiare camion?",
    "10. Cosa significa segnale camion?"
  ]
};

// =========================
// READY
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
// INTERACTIONS
// =========================
client.on("interactionCreate", async interaction => {

  // START BUTTON
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

  // SELECT MENU FIX
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, { type });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    const input = new TextInputBuilder()
      .setCustomId("answers")
      .setLabel("Rispondi a TUTTE le domande")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    try {
      await interaction.showModal(modal);
    } catch (err) {
      console.log("SHOWMODAL ERROR:", err);
    }

    return;
  }

  // QUIZ SUBMIT
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
      content: "Carica la foto del pagamento",
      components: [btn],
      ephemeral: true
    });
  }

  // PAY BUTTON
  if (interaction.isButton() && interaction.customId === "pay") {

    const modal = new ModalBuilder()
      .setCustomId("payment")
      .setTitle("Pagamento");

    const input = new TextInputBuilder()
      .setCustomId("photo")
      .setLabel("LINK immagine (upload discord)")
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

    return interaction.reply({ content: "Inviato allo staff", ephemeral: true });
  }

  // STAFF BUTTON FIX DEFINITIVO
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("accetta_") ||
     interaction.customId.startsWith("rifiuta_"))
  ) {

    await interaction.deferUpdate();

    const id = interaction.customId.split("_")[1];
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(id);

    const tipo = userData.get(id)?.type;

    if (interaction.customId.startsWith("accetta_")) {

      if (tipo && RUOLI[tipo]) {
        await member.roles.add(RUOLI[tipo]);
      }

      return interaction.editReply({
        content: `✅ ACCETTATO da ${interaction.user.tag}`,
        components: []
      });
    }

    return interaction.editReply({
      content: `❌ RIFIUTATO da ${interaction.user.tag}`,
      components: []
    });
  }

});

client.login(process.env.TOKEN);
