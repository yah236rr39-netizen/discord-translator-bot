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

    const targetLanguage = languageMap[targetLang];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator for a gaming guild."
        },
        {
          role: "user",
          content: `Translate this text to ${targetLanguage}: ${text}`
        }
      ],
      temperature: 0.2
    });

    return response.choices[0].message.content.trim();

  } catch (e) {

    console.error("❌ Translation error:");
    console.error(e.response?.data || e.message);

    return null;
  }
}

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
  // 1. 機器人說話不理它，避免無限循環
  if (msg.author.bot) return;

  // 2. 定義四個頻道的 ID 與對應語言名稱
 // 修正 langConfig（加入 langCode）

const langConfig = {
  '1496614451812503572': {
    name: 'Traditional Chinese',
    emoji: '🇹🇼',
    langCode: 'zh-TW'
  },
  '1496562571480666183': {
    name: 'English',
    emoji: '🇺🇸',
    langCode: 'en'
  },
  '1496562468707631205': {
    name: 'Vietnamese',
    emoji: '🇻🇳',
    langCode: 'vi'
  },
  '1496463528326991913': {
    name: 'Simplified Chinese',
    emoji: '🇨🇳',
    langCode: 'zh-CN'
  }
};

  // 3. 檢查目前發言的頻道 ID 是否在我們的清單中
  const source = langConfig[msg.channel.id];
  if (!source) return; // 如果不是這四個頻道，就不翻譯

  console.log(`[SUn 翻譯系統] 收到來自 ${source.emoji} 頻道的訊息，正在處理...`);

  // 4. 準備發送到其他三個頻道
  const targetIds = Object.keys(langConfig).filter(id => id !== msg.channel.id);

  for (const targetId of targetIds) {
    const target = langConfig[targetId];
    
    // 💡 這裡直接把目標語言的「英文全名」丟給 OpenAI，它最聽得懂
    const translation = await translate(msg.content, target.langCode);
    
    if (translation) {
      const targetChannel = client.channels.cache.get(targetId);
      if (targetChannel) {
        // 優先抓群組暱稱
        const senderName = msg.member ? msg.member.displayName : msg.author.username;
        
        // 發送格式：[來源國旗] **暱稱**: 翻譯內容
        await targetChannel.send(`${source.emoji} **${senderName}**: ${translation}`);
      }
    }
  }
});

client.login(process.env.TOKEN);
