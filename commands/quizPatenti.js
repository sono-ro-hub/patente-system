const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quizpatenti")
    .setDescription("Mostra tutti i quiz patenti"),

  async execute(interaction) {

    await interaction.reply(`# 🚗 Quiz Patente B

__**Modulo patente B**__

1. Il casco è obbligatorio in auto?
2. In città il limite è 50 km/h?
3. La cintura di sicurezza va allacciata sempre?
4. Posso sorpassare con linea continua?
5. La distanza di sicurezza serve a fermarsi in tempo?
6. Il semaforo rosso significa fermo?
7. Posso usare il cellulare senza vivavoce mentre guido?
8. I fari vanno accesi di notte?
9. La frenata su strada bagnata è più lunga?
10. I bambini devono essere su seggiolini?
11. La precedenza a destra vale sempre?
12. Il parcheggio vietato è segnale blu con barra rossa?
13. Il sorpasso a sinistra è sempre obbligatorio?
14. Rispettare sempre i limiti?
15. In autostrada 130 km/h?


# 🚛 Quiz Patente C-D

__**Modulo Patente C-D**__

1. Limite camion in città?
a) 50 km/h
b) 80 km/h
c) 100 km/h

2. Semaforo rosso?
a) Passare
b) Fermarsi
c) Correre

3. Precedenza incrocio?
a) Destra
b) Sinistra
c) Chi va veloce

4. Luci quando?
a) Giorno
b) Notte/scarsa visibilità
c) Mai

5. Ambulanza?
a) Accelerare
b) Fermarsi
c) Suonare

6. Mezzo trasporto persone?
a) Auto
b) Autobus
c) Moto

7. Distanza?
a) 1m
b) Dipende
c) Nessuna

8. Freno camion?
a) Mano
b) Motore
c) Normale

9. Dove parcheggiare?
a) Solo parcheggi
b) Ovunque
c) Corsia emergenza

10. Segnale camion?
a) Divieto sorpasso
b) Benzina
c) Officina`);
  }
};
