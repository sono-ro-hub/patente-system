require("http").createServer((req, res) => res.end("OK")).listen(3000);

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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// CONFIG
const config = {
  canaleRichieste: "1493595963942768860",
  canaleStaff: "1493597555760824503",
  guildId: "1484912853126221896"
};

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// MEMORY
const userData = new Map();
let sent = false;

// INFO (FIX RICHIESTO)
const INFO = `
🏛️ Dipartimento Trasporti — Sud Italy RP

📋 Tipi patente:
A → Moto
B → Auto
C-D → Camion/Bus

📝 Procedura:
1) Completa quiz
2) Invia 3000$
3) Carica screenshot
4) Attendi staff
`;

// QUIZ COMPLETO
const quiz = {
  A: [
    "Casco obbligatorio?",
    "Fari accesi sempre?",
    "Rallentare in curva?",
    "Contromano permesso?",
    "Frenata su bagnato aumenta?",
    "Serve patente?"
  ],
  B: [
    "Cintura obbligatoria?",
    "Semaforo rosso stop?",
    "Cellulare vietato?",
    "Fari notte obbligatori?",
    "Limite 130 autostrada?",
    "Sorpasso linea continua?"
  ],
  CD: [
    "Limite camion città?",
    "Ambulanza priorità?",
    "Cos’è freno motore?",
    "Distanza sicurezza?",
    "Parcheggio camion?",
    "Segnale camion?"
  ]
};

// READY
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(config.canaleRichieste);

  if (!sent) {
    const embed = new EmbedBuilder()
      .setColor("#0b3d91")
      .setTitle("📄 RICHIESTA PATENTE")
      .setDescription(INFO);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    sent = true;
  }
});

// INTERACTION
client.on("interactionCreate", async (interaction) => {

  try {

    // START
    if (interaction.isButton() && interaction.customId === "start") {

      return interaction.reply({
        content: "Seleziona patente",
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select")
              .setPlaceholder("Scegli patente")
              .addOptions([
                { label: "Patente A", value: "A" },
                { label: "Patente B", value: "B" },
                { label: "Patente C-D", value: "CD" }
              ])
          )
        ],
        ephemeral: true
      });
    }

    // SELECT
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        step: 0,
        answers: []
      });

      return sendModal(interaction);
    }

    // QUIZ MODAL
    if (interaction.isModalSubmit() && interaction.customId.startsWith("quiz_")) {

      const data = userData.get(interaction.user.id);

      const risposte = Object.values(interaction.fields.fields).map(f => f.value);

      data.answers.push(...risposte);
      data.step += 5;

      if (data.step >= quiz[data.type].length) {

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("pay")
            .setLabel("Carica pagamento 3000$")
            .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          content: "Quiz completato!",
          components: [btn],
          ephemeral: true
        });
      }

      return sendModal(interaction);
    }

    // PAY
    if (interaction.isButton() && interaction.customId === "pay") {

      const modal = new ModalBuilder()
        .setCustomId("payment")
        .setTitle("Pagamento");

      const file = new TextInputBuilder()
        .setCustomId("photo")
        .setLabel("Carica SCREENSHOT (galleria Discord)")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(file));

      return interaction.showModal(modal);
    }

    // PAYMENT
    if (interaction.isModalSubmit() && interaction.customId === "payment") {

      const data = userData.get(interaction.user.id);

      const staff = await client.channels.fetch(config.canaleStaff);

      const embed = new EmbedBuilder()
        .setColor("#0b3d91")
        .setTitle("NUOVA PATENTE")
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

      return interaction.reply({ content: "Inviato staff", ephemeral: true });
    }

  } catch (e) {
    console.log(e);
  }
});

// MODAL GENERATORE
function sendModal(interaction) {

  const data = userData.get(interaction.user.id);
  const domande = quiz[data.type].slice(data.step, data.step + 5);

  const modal = new ModalBuilder()
    .setCustomId(`quiz_${data.step}`)
    .setTitle("Quiz Patente");

  domande.forEach((q, i) => {
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

// LOGIN
client.login(process.env.TOKEN);
