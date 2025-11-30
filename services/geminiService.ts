import { GoogleGenAI, Modality } from "@google/genai";
import { CardInstance, Spread } from "../types";

// Helper to initialize AI client
const getAiClient = () => {
  let apiKey = '';

  // 1. Try Vite standard (import.meta.env) - This is the CORRECT way for Vercel + Vite
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
      console.log("GeminiService: Using VITE_API_KEY from import.meta.env");
    }
  } catch (e) {}

  // 2. Fallback: Try process.env (Node/Legacy/Webpack)
  if (!apiKey) {
    try {
        if (typeof process !== 'undefined' && process.env) {
            // Check for both prefixed (standard) and non-prefixed (if manually configured)
            if (process.env.VITE_API_KEY) {
                apiKey = process.env.VITE_API_KEY;
                console.log("GeminiService: Using VITE_API_KEY from process.env");
            } else if (process.env.API_KEY) {
                apiKey = process.env.API_KEY;
                console.log("GeminiService: Using API_KEY from process.env");
            }
        }
    } catch (e) {}
  }

  // Check if key is empty
  if (!apiKey || apiKey.trim() === '') {
    console.warn("GeminiService: No API Key found in environment variables.");
    throw new Error("API_KEY_MISSING_PREFIX");
  }

  // Clean the key (remove quotes if user accidentally added them in Vercel)
  const cleanKey = apiKey.replace(/['"]/g, '').trim();
  
  // LOG THE KEY PREFIX FOR DEBUGGING (First 6 chars only)
  if (cleanKey.length > 10) {
      console.log(`GeminiService: Current Key starts with: ${cleanKey.substring(0, 8)}...`);
  }
  
  return new GoogleGenAI({ apiKey: cleanKey });
};

// Retry logic helper
async function generateContentWithRetry(modelName: string, params: any, maxRetries = 2) {
    const ai = getAiClient();
    let attempt = 0;
    
    while (attempt <= maxRetries) {
        try {
            return await ai.models.generateContent({
                model: modelName,
                ...params
            });
        } catch (error: any) {
            attempt++;
            
            const errorMessage = error.message || error.toString();

            // Check for specific error codes that are not retriable
            if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
                throw new Error("QUOTA_EXCEEDED");
            }
            if (errorMessage.includes("API Key") || errorMessage.includes("API_KEY")) {
                throw new Error("API_KEY_INVALID");
            }
            // Check for Location/Geo-blocking error
            if (errorMessage.includes("User location is not supported") || errorMessage.includes("FAILED_PRECONDITION")) {
                throw new Error("LOCATION_NOT_SUPPORTED");
            }

            // If max retries reached, throw the last error
            if (attempt > maxRetries) throw error;
            
            // Exponential backoff: 1s, 2s, 4s...
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
}

export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: CardInstance[]
): Promise<string> => {
  const cardDesc = cards
    .map((c, i) => {
      const cnName = c.name.split(" ")[0];
      const direction = c.isReversed ? "逆位" : "正位";
      const meaning = c.isReversed ? c.reversed : c.upright;
      const positionName = spread.positions[i].name;
      return `${i + 1}. [${positionName}] - ${direction}${cnName}: ${meaning}`;
    })
    .join("\n");

  const prompt = `你是一位专业、神秘且语气温和的塔罗牌占卜师。请根据以下信息为用户进行解读：
    用户问题：“${question || "近期指引"}”
    牌阵：${spread.name}
    抽取的牌面：
    ${cardDesc}
    
    请注意严格遵守以下**格式要求**：
    1. **绝对禁止**使用 Markdown 格式（如 **加粗**、*斜体* 等），请只输出纯文本。
    2. **绝对禁止**使用括号来标注正逆位，提及牌名时必须且只能使用“**正位XX**”或“**逆位XX**”的格式。
    3. 不要在回复中出现像 (6R)这样令人困惑的缩写符号。
    4. 语气要温暖、治愈且富有洞察力，字数控制在 300 字以内。
    请开始你的解读：`;

  try {
    const response = await generateContentWithRetry("gemini-2.5-flash", {
        contents: prompt
    });
    return response?.text || "星辰暂默...";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Customized error messages for the user
    if (error.message === "API_KEY_MISSING_PREFIX") {
        return "⚠️ 未能读取 API Key。请确保在 Vercel 环境变量设置中，变量名为 'VITE_API_KEY'。";
    }
    if (error.message === "API_KEY_INVALID") {
        return "⚠️ API Key 格式无效。请检查 Vercel 环境变量是否包含多余的引号、空格，或 Key 是否已失效。";
    }
    if (error.message === "QUOTA_EXCEEDED") {
        return "宇宙能量通道拥堵（API 配额已耗尽）。请更换新的 Google Gemini API Key。";
    }
    if (error.message === "LOCATION_NOT_SUPPORTED") {
        return "🚫 所在的星域受到干扰（地区不支持）。Google Gemini 服务在当前网络地区不可用，请尝试开启全球网络代理（VPN）后重试。";
    }
    
    return "连接宇宙能量时遇到干扰，请稍后再试。";
  }
};

export const getSpeechFromText = async (text: string): Promise<string | null> => {
    try {
        const response = await generateContentWithRetry("gemini-2.5-flash-preview-tts", {
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" }
                    }
                }
            }
        });
        
        const audioData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            return audioData;
        }
        return null;
    } catch (error) {
        console.error("TTS API Error:", error);
        return null;
    }
}