import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🧍 Stockage simple en mémoire (pour débuter)
const personnages = {}; // { discordId: personnage }

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const msg = message.content;

  // ------------------------------
  // CRÉER UN PERSONNAGE
  // ------------------------------
  if (msg.startsWith("/create ")) {
    if (personnages[userId] && personnages[userId].status === "Vivant") {
      return message.reply("❌ Tu as déjà un personnage vivant !");
    }

    const name = msg.replace("/create ", "").trim();
    if (!name) return message.reply("❌ Donne un nom à ton personnage !");

    personnages[userId] = {
      name: name,
      status: "Vivant",
      health: 100,
      coma: false,
      sequelees: [],
      createdAt: Date.now()
    };

    return message.channel.send(`🟢 Personnage **${name}** créé !`);
  }

  // ------------------------------
  // COMMANDE /ME RP
  // ------------------------------
  if (msg.startsWith("/me ")) {
    const perso = personnages[userId];
    if (!perso || perso.status !== "Vivant") {
      return message.reply("❌ Tu n'as pas de personnage vivant !");
    }

    const action = msg.replace("/me ", "");
    return message.channel.send(`🧍 **${perso.name}** ${action}`);
  }

  // ------------------------------
  // SIMPLIFICATION: MORT / COMA ALÉATOIRE
  // (pour montrer le fonctionnement)
  // ------------------------------
  if (msg.startsWith("/damage ")) {
    const perso = personnages[userId];
    if (!perso || perso.status !== "Vivant") {
      return message.reply("❌ Pas de personnage vivant !");
    }

    // inflige des dégâts aléatoires 10-50
    const dmg = Math.floor(Math.random() * 41) + 10;
    perso.health -= dmg;

    let reply = `⚔️ ${perso.name} prend ${dmg} points de dégâts ! Santé: ${perso.health}`;

    // check coma
    if (perso.health <= 0 && !perso.coma) {
      // 50% chance coma ou mort
      if (Math.random() < 0.5) {
        perso.coma = true;
        perso.health = 50;
        reply += `\n💤 ${perso.name} est maintenant en **coma** !`;
      } else {
        perso.status = "Mort";
        perso.health = 0;
        reply += `\n⚰️ ${perso.name} est **mort RP** !`;
        // on déclenche le délai de 10 min avant nouveau perso
        setTimeout(() => {
          delete personnages[userId];
        }, 10 * 60 * 1000);
      }
    }

    return message.channel.send(reply);
  }

  // ------------------------------
  // COMMANDE /status pour vérifier perso
  // ------------------------------
  if (msg === "/status") {
    const perso = personnages[userId];
    if (!perso) return message.reply("❌ Tu n'as pas de personnage.");
    return message.channel.send(`📊 **${perso.name}**
Status: ${perso.status}
Santé: ${perso.health}
Coma: ${perso.coma ? "Oui" : "Non"}
Séquelles: ${perso.sequelees.join(", ") || "Aucune"}`);
  }

});
client.login(process.env.TOKEN);
