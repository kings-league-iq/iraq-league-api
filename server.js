const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 1800 });

const standingsUrl = 'https://www.goal.com/ar-eg/الفريق/الموصل/جدول/Pgj8lTePBG51FlI3ezqp1';

async function scrapeStandings() {
    try {
        const { data } = await axios.get(standingsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
            timeout: 8000,
        });
        const $ = cheerio.load(data);
        let standings = [];

        $('table').each((i, table) => {
            $(table).find('tbody tr').each((rowIndex, row) => {
                const cells = $(row).find('td');
                if (cells.length > 3) {
                    let team = $(cells[1]).text().trim().split('\n')[0];
                    let pts = parseInt($(cells[cells.length - 1]).text().replace(/[^0-9]/g, '')) || 0;
                    if (pts === 0 && cells.length > 4) pts = parseInt($(cells[cells.length - 2]).text().replace(/[^0-9]/g, '')) || 0;
                    if (team.length > 2 && !team.includes('الترتيب')) standings.push({ team, points: pts });
                }
            });
            return false;
        });
        standings.sort((a, b) => b.points - a.points);
        return standings.map((item, index) => ({ pos: index + 1, team: item.team, points: item.points }));
    } catch (e) {
        return [];
    }
}

// قائمة اللاعبين الحقيقية (محدثة)
const realPlayers = [
    { id: "p1", name: "مهند علي", team: "الشرطة", position: "مهاجم", price: 12.5, totalPoints: 95, form: 5 },
    { id: "p2", name: "أيمن حسين", team: "الكرمة", position: "مهاجم", price: 12.0, totalPoints: 90, form: 5 },
    { id: "p3", name: "علي جاسم", team: "زاخو", position: "وسط", price: 10.0, totalPoints: 82, form: 4 },
    { id: "p4", name: "إبراهيم بايش", team: "أربيل", position: "وسط", price: 9.5, totalPoints: 78, form: 4 },
    { id: "p5", name: "حسن عبد الكريم", team: "القوة الجوية", position: "وسط", price: 8.5, totalPoints: 70, form: 3 },
    { id: "p6", name: "سعد ناطق", team: "الشرطة", position: "مدافع", price: 8.0, totalPoints: 65, form: 4 },
    { id: "p7", name: "ميرخاس دوسكي", team: "الشرطة", position: "مدافع", price: 7.5, totalPoints: 62, form: 3 },
    { id: "p8", name: "ريبين سولاقا", team: "الزوراء", position: "مدافع", price: 7.0, totalPoints: 60, form: 3 },
    { id: "p9", name: "علاء عباس", team: "القوة الجوية", position: "مهاجم", price: 6.5, totalPoints: 55, form: 3 },
    { id: "p10", name: "حسين جبار", team: "النجف", position: "وسط", price: 6.0, totalPoints: 52, form: 3 },
    { id: "p11", name: "علي فائز", team: "أربيل", position: "مدافع", price: 5.5, totalPoints: 48, form: 2 },
    { id: "p12", name: "أحمد ياسين", team: "دهوك", position: "حارس", price: 5.0, totalPoints: 45, form: 3 },
    { id: "p13", name: "جاسم كريم", team: "النجف", position: "حارس", price: 4.5, totalPoints: 42, form: 2 },
    { id: "p14", name: "حسن أحمد", team: "القوة الجوية", position: "مدافع", price: 4.0, totalPoints: 38, form: 2 },
    { id: "p15", name: "محمد قاسم", team: "الزوراء", position: "حارس", price: 4.0, totalPoints: 35, form: 2 },
    { id: "p16", name: "كرار نبيل", team: "الشرطة", position: "مهاجم", price: 6.5, totalPoints: 58, form: 3 },
    { id: "p17", name: "علي الحمادي", team: "الموصل", position: "وسط", price: 5.0, totalPoints: 44, form: 2 },
    { id: "p18", name: "أمجد عطوان", team: "زاخو", position: "مهاجم", price: 5.5, totalPoints: 50, form: 3 },
    { id: "p19", name: "سجاد جاسم", team: "الميناء", position: "مدافع", price: 3.5, totalPoints: 30, form: 2 },
    { id: "p20", name: "مصطفى كريم", team: "ديالى", position: "وسط", price: 3.0, totalPoints: 28, form: 1 },
    { id: "p21", name: "بشار رسن", team: "القوة الجوية", position: "وسط", price: 9.0, totalPoints: 75, form: 4 },
    { id: "p22", name: "عمر عبد الرحمن", team: "الزوراء", position: "وسط", price: 7.5, totalPoints: 60, form: 3 },
    { id: "p23", name: "علي عدنان", team: "الشرطة", position: "مدافع", price: 6.0, totalPoints: 50, form: 3 },
    { id: "p24", name: "فرانس بطرس", team: "القوة الجوية", position: "مدافع", price: 5.5, totalPoints: 45, form: 2 },
    { id: "p25", name: "رضا نصراوي", team: "الطلبة", position: "مهاجم", price: 6.0, totalPoints: 48, form: 3 },
    { id: "p26", name: "مهدي كامل", team: "النجف", position: "وسط", price: 5.0, totalPoints: 40, form: 2 },
    { id: "p27", name: "أمير العماري", team: "دهوك", position: "مهاجم", price: 4.5, totalPoints: 35, form: 2 },
    { id: "p28", name: "مؤمل عبد الرزاق", team: "أربيل", position: "وسط", price: 4.0, totalPoints: 32, form: 2 },
    { id: "p29", name: "حسن حمود", team: "الموصل", position: "مهاجم", price: 3.5, totalPoints: 28, form: 1 },
    { id: "p30", name: "أحمد فارس", team: "النفط", position: "مدافع", price: 3.0, totalPoints: 25, form: 1 },
    { id: "p31", name: "علي شلال", team: "الميناء", position: "وسط", price: 3.5, totalPoints: 26, form: 2 },
    { id: "p32", name: "حيدر عبد الأمير", team: "الكرمة", position: "مهاجم", price: 4.0, totalPoints: 30, form: 2 },
    { id: "p33", name: "مصطفى محمد", team: "نوروز", position: "وسط", price: 3.0, totalPoints: 22, form: 1 },
    { id: "p34", name: "كرار محمد", team: "زاخو", position: "مهاجم", price: 3.5, totalPoints: 25, form: 2 },
    { id: "p35", name: "أمير صباح", team: "أمانة بغداد", position: "مدافع", price: 2.5, totalPoints: 18, form: 1 },
    { id: "p36", name: "مروان حسين", team: "نوروز", position: "مهاجم", price: 7.0, totalPoints: 65, form: 4 },
    { id: "p37", name: "سيف رشيد", team: "القاسم", position: "مهاجم", price: 6.5, totalPoints: 60, form: 3 },
    { id: "p38", name: "غوستافو هنريكي", team: "زاخو", position: "مهاجم", price: 8.0, totalPoints: 72, form: 4 },
    { id: "p39", name: "يوسف بن سودة", team: "أربيل", position: "وسط", price: 6.0, totalPoints: 55, form: 3 },
    { id: "p40", name: "محمد داود", team: "دهوك", position: "وسط", price: 5.5, totalPoints: 50, form: 3 },
    { id: "p41", name: "بيتر كوركيس", team: "دهوك", position: "مهاجم", price: 5.0, totalPoints: 45, form: 2 },
    { id: "p42", name: "مصطفى قابيل", team: "أربيل", position: "مهاجم", price: 5.0, totalPoints: 45, form: 2 },
    { id: "p43", name: "علي علوان", team: "الرياض", position: "مهاجم", price: 4.5, totalPoints: 40, form: 2 },
    { id: "p44", name: "هيران أحمد", team: "الزوراء", position: "وسط", price: 4.0, totalPoints: 35, form: 2 },
    { id: "p45", name: "مهند أبو طه", team: "الكرخ", position: "وسط", price: 4.0, totalPoints: 35, form: 2 },
    { id: "p46", name: "عيد الرشيدي", team: "القوة الجوية", position: "وسط", price: 5.0, totalPoints: 45, form: 3 }
];

app.get('/standings', async (req, res) => {
    let data = cache.get('standings');
    if (!data) {
        data = await scrapeStandings();
        if (data.length > 0) cache.set('standings', data);
    }
    res.json({ data });
});

app.get('/players', (req, res) => {
    res.json({ data: realPlayers });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
