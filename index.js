const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');

// OpenAI 初始化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// 4. OpenAI 翻譯函式
async function translate(text, targetLang) {
  try {
    const languageMap = {
      'zh-TW': 'Traditional Chinese',
      'zh-CN': 'Simplified Chinese',
      'en': 'English',
      'vi': 'Vietnamese'
    };

    const targetLanguage = languageMap[targetLang] || targetLang;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 💡 修正了模型名稱
      messages: [
        {
          role: "system",
          content: "You are a professional translator for a gaming guild. Translate accurately and naturally."
        },
        {
          role: "user",
          content: `Translate this text to ${targetLanguage}:\n\n${text}`
        }
      ],
      temperature: 0.2
    });

    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Translation error:", e);
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
    const translation = await translate(msg.content, targetMap[langKey].lang);
    if (translation) {
      const targetChannel = client.channels.cache.get(channels[langKey]);
      if (targetChannel) {
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        await targetChannel.send(`${targetMap[sourceLang].emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
