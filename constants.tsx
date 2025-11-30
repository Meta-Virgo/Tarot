import { 
    Sparkles, Moon, Sun, Star, Heart, Skull, 
    Scale, Sword, Crown, Zap, Anchor, 
    Ghost, Eye, Cloud, RefreshCw, 
    Circle, Layout, Grid,
    Wand2, Coins, Globe
} from 'lucide-react';
import { CardDefinition, Spread } from './types';

// 大阿卡纳数据
const MAJORS: CardDefinition[] = [
    { id: 0, name: "愚者 (The Fool)", icon: Ghost, element: "Air", upright: "新的开始、冒险、天真、自由", reversed: "鲁莽、冒险过度、不成熟" },
    { id: 1, name: "魔术师 (The Magician)", icon: Sparkles, element: "Air", upright: "创造力、技能、意志力、自信", reversed: "欺骗、缺乏想象力、滥用能力" },
    { id: 2, name: "女祭司 (High Priestess)", icon: Moon, element: "Water", upright: "直觉、潜意识、神秘、智慧", reversed: "情绪不稳定、缺乏洞察力、肤浅" },
    { id: 3, name: "皇后 (The Empress)", icon: Heart, element: "Earth", upright: "丰收、母性、自然、繁荣", reversed: "依赖、创造力受阻、家庭问题" },
    { id: 4, name: "皇帝 (The Emperor)", icon: Crown, element: "Fire", upright: "权威、结构、控制、父亲形象", reversed: "专制、僵化、缺乏纪律" },
    { id: 5, name: "教皇 (The Hierophant)", icon: Anchor, element: "Earth", upright: "传统、精神指引、信仰、学习", reversed: "挑战传统、盲目信仰、叛逆" },
    { id: 6, name: "恋人 (The Lovers)", icon: Heart, element: "Air", upright: "爱、和谐、关系、价值观选择", reversed: "不和谐、分离、错误的选择" },
    { id: 7, name: "战车 (The Chariot)", icon: Sword, element: "Water", upright: "胜利、意志力、自律、决心", reversed: "失控、攻击性、缺乏方向" },
    { id: 8, name: "力量 (Strength)", icon: Zap, element: "Fire", upright: "勇气、耐心、控制、同情心", reversed: "自我怀疑、软弱、不安全感" },
    { id: 9, name: "隐士 (The Hermit)", icon: Eye, element: "Earth", upright: "内省、孤独、寻求真理、指引", reversed: "孤立、孤独、退缩" },
    { id: 10, name: "命运之轮 (Wheel of Fortune)", icon: RefreshCw, element: "Fire", upright: "改变、周期、命运、转折点", reversed: "坏运气、阻力、不受控制的改变" },
    { id: 11, name: "正义 (Justice)", icon: Scale, element: "Air", upright: "公正、真理、因果、法律", reversed: "不公、偏见、逃避责任" },
    { id: 12, name: "倒吊人 (The Hanged Man)", icon: Anchor, element: "Water", upright: "牺牲、放下、新视角、等待", reversed: "停滞、无谓的牺牲、拖延" },
    { id: 13, name: "死神 (Death)", icon: Skull, element: "Water", upright: "结束、转变、重生、新阶段", reversed: "抗拒改变、停滞、无法释怀" },
    { id: 14, name: "节制 (Temperance)", icon: Cloud, element: "Fire", upright: "平衡、适度、耐心、目的", reversed: "失衡、过度、缺乏长远眼光" },
    { id: 15, name: "恶魔 (The Devil)", icon: Ghost, element: "Earth", upright: "束缚、物质主义、上瘾、欲望", reversed: "打破束缚、重获自由、面对阴暗面" },
    { id: 16, name: "高塔 (The Tower)", icon: Zap, element: "Fire", upright: "突变、混乱、启示、觉醒", reversed: "避免灾难、恐惧改变、延迟的危机" },
    { id: 17, name: "星星 (The Star)", icon: Star, element: "Air", upright: "希望、灵感、宁静、精神力量", reversed: "绝望、缺乏信心、消极" },
    { id: 18, name: "月亮 (The Moon)", icon: Moon, element: "Water", upright: "幻觉、恐惧、潜意识、不安", reversed: "释放恐惧、清晰、混乱平息" },
    { id: 19, name: "太阳 (The Sun)", icon: Sun, element: "Fire", upright: "快乐、成功、活力、积极", reversed: "暂时的消极、缺乏热情、不切实际" },
    { id: 20, name: "审判 (Judgement)", icon: Scale, element: "Fire", upright: "重生、觉醒、原谅、召唤", reversed: "自我怀疑、拒绝改变、悔恨" },
    { id: 21, name: "世界 (The World)", icon: Globe, element: "Earth", upright: "完成、整合、成就、旅行", reversed: "未完成、缺乏封闭、停滞" },
];

// 生成完整牌组
export const generateDeck = (): { majors: CardDefinition[], full: CardDefinition[] } => {
    const suits = [
        { name: "Wands", cn: "权杖", element: "Fire", icon: Wand2, keywords: "行动、创意" },
        { name: "Cups", cn: "圣杯", element: "Water", icon: Heart, keywords: "情感、直觉" },
        { name: "Swords", cn: "宝剑", element: "Air", icon: Sword, keywords: "思想、理智" },
        { name: "Pentacles", cn: "星币", element: "Earth", icon: Coins, keywords: "物质、现实" }
    ];
    const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];
    
    let minors: CardDefinition[] = [];
    let idCounter = 22;

    suits.forEach(suit => {
        ranks.forEach(rank => {
            const name = `${suit.cn}${rank}`; 
            let upright = `${suit.keywords}，正向发展`;
            let reversed = `${suit.keywords}，受阻或过度`;
            
            if (rank === "Ace") upright = `${suit.cn}的新开始，能量涌动`;
            if (["Page", "Knight", "Queen", "King"].includes(rank)) upright = `宫廷牌：${suit.cn}领域的人物或特质`;
            
            minors.push({
                id: idCounter++, 
                name, 
                icon: suit.icon, 
                element: suit.element, 
                type: 'Minor', 
                suit: suit.name, 
                rank: rank, 
                upright, 
                reversed
            });
        });
    });

    return { majors: MAJORS, full: [...MAJORS, ...minors] };
};

export const SPREADS: Spread[] = [
    { 
        id: 'single', 
        name: '每日指引', 
        enName: 'Daily', 
        icon: Circle, 
        description: '单张牌，今日的核心课题。', 
        cardCount: 1, 
        positions: [{ id: 0, name: "指引", desc: "当下的核心能量" }], 
        layout: 'single' 
    },
    { 
        id: 'triangle', 
        name: '圣三角', 
        enName: 'Triangle', 
        icon: Layout, 
        description: '过去、现在与未来的流向。', 
        cardCount: 3, 
        positions: [
            { id: 0, name: "过去", desc: "根源与经验" }, 
            { id: 1, name: "现在", desc: "现状与挑战" }, 
            { id: 2, name: "未来", desc: "趋势与结果" }
        ], 
        layout: 'row' 
    },
    { 
        id: 'diamond', 
        name: '钻石阵', 
        enName: 'Diamond', 
        icon: Grid, 
        description: '全方位的深入分析。', 
        cardCount: 5, 
        positions: [
            { id: 0, name: "现状", desc: "真实状态" }, 
            { id: 1, name: "阻碍", desc: "挑战" }, 
            { id: 2, name: "建议", desc: "应对智慧" }, 
            { id: 3, name: "基础", desc: "潜意识" }, 
            { id: 4, name: "结果", desc: "最终导向" }
        ], 
        layout: 'diamond' 
    }
];

export const DECKS = generateDeck();