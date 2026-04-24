const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
// 👈 重點是這一行，一定要有
],
});

// 這裡我加了一個啟動檢查
client.on('ready', () => {
  console.log('---------------------------------------');
  console.log(`✅ 兄弟！機器人 [${client.user.tag}] 已經成功上線了！`);
  console.log('現在去 Discord 頻道打字測試看看吧！');
  console.log('---------------------------------------');
});

// 🔑 你的頻道 ID（之後換）
const channels = {
  zh: '1496614451812503572',
  en: '1496562571480666183',
  vi: '1496562468707631205',
  cn: '1496463528326991913'
};

// 🌍 翻譯函式（Google Translate）
async function translate(text, target) {
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: target,
        dt: 't',
        q: text
      }
    }
  );

  return res.data[0][0][0];
  } catch (e) { return null; }
}

client.on('messageCreate', async (msg) => {
  // 這裡確保機器人會理你
  if (msg.author.bot || msg.channel.id !== '1496614451812503572') return;

  console.log(`收到訊息: ${msg.content}，正在翻譯中...`);

    const en = await translate(msg.content, 'en');
    const vi = await translate(msg.content, 'vi');
    const cn = await translate(msg.content, 'zh-CN');
    client.channels.cache.get(channels.en)?.send(`🇺🇸 ${en}`);
    client.channels.cache.get(channels.vi)?.send(`🇻🇳 ${vi}`);
    client.channels.cache.get(channels.cn)?.send(`🇨🇳 ${cn}`);
});

// 
client.login(process.env.TOKEN);
