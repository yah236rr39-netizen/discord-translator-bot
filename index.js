const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
// 1. 換掉 axios，改用這個
const { translate } = require('@vitalets/google-translate-api');

// 1. 防止 Render 休息 (維持原樣)
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 10000);

// 2. 初始化機器人 (維持原樣)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ],
});

// 3. 頻道設定 (維持原樣)
const channels = {
  zh: '1496614451812503572',
  en: '1496562571480666183',
  vi: '1496562468707631205',
  cn: '1496463528326991913'
};

// 4. 翻譯功能 (核心改造：換成新的引擎)
async function translateText(text, target) {
  try {
    const res = await translate(text, { 
      to: target, 
      autoCorrect: true,
      // 這裡加個偽裝，避免被 Google 當成機器人
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    });
    return res.text; // 新引擎回傳的是 .text
  } catch (e) {
    console.error('❌ 翻譯出包了:', e.message);
    return null;
  }
}

// 5. 啟動顯示
client.on('ready', () => {
  console.log(`✅ 兄弟！SUn 翻譯官 [${client.user.tag}] 成功上線！`);
});

// 6. 核心邏輯
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const sourceLang = Object.keys(channels).find(key => channels[key] === msg.channel.id);
  if (!sourceLang) return;

  const targetMap = {
    zh: { lang: 'zh-TW', emoji: '🇹🇼' },
    en: { lang: 'en',    emoji: '🇺🇸' },
    vi: { lang: 'vi',    emoji: '🇻🇳' },
    cn: { lang: 'zh-CN', emoji: '🇨🇳' }
  };

  const targets = Object.keys(channels).filter(lang => lang !== sourceLang);

  for (const langKey of targets) {
    // 調用我們改好的新翻譯函式
    const translation = await translateText(msg.content, targetMap[langKey].lang);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        // 加上來源國旗，讓公會兄弟知道是哪翻過來的
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
