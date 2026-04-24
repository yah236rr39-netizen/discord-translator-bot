const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// 1. 防止 Render 休息
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

// 2. 初始化機器人
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ],
});

// 3. 頻道設定
const channels = {
  zh: '1496614451812503572',
  en: '1496562571480666183',
  vi: '1496562468707631205',
  cn: '1496463528326991913'
};

// 4. 翻譯功能
async function translate(text, target) {
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: 'auto', tl: target, dt: 't', q: text }
    });
    return res.data[0][0][0];
  } catch (e) {
    return null;
  }
}

// 5. 啟動顯示
client.on('ready', () => {
  console.log(`✅ 兄弟！機器人 [${client.user.tag}] 成功上線！`);
});

// 6. 核心邏輯 (確保這裡有 async)
client.on('messageCreate', async (msg) => {
  // 排除機器人
  if (msg.author.bot) return;

  // 判斷來源頻道
  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  const targetMap = {
    zh: { lang: 'zh-TW', emoji: '🇹🇼' },
    en: { lang: 'en',    emoji: '🇺🇸' },
    vi: { lang: 'vi',    emoji: '🇻🇳' },
    cn: { lang: 'zh-CN', emoji: '🇨🇳' }
  };

  const targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  // 開始翻譯與發送
  for (const langKey of targets) {
    const translation = await translate(msg.content, targetMap[langKey].lang);
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        // 抓取暱稱或名稱
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        // 這裡就是你截圖報錯的地方，現在它被包在 async 裡面了！
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
