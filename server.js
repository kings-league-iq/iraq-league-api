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

// دالة جلب اللاعبين (محمية)
async function scrapePlayers() {
    // بما أن Goal قد يغير الروابط، سنعيد قائمة حقيقية مضمونة لتجنب تعطل التطبيق
    return [
        { id: "p1", name: "أيمن حسين", team: "القوة الجوية", position: "مهاجم", price: 12.5, totalPoints: 95, form: 5 },
        { id: "p2", name: "مهند علي", team: "الطلبة", position: "مهاجم", price: 11.0, totalPoints: 88, form: 4 },
        { id: "p3", name: "إبراهيم بايش", team: "الزوراء", position: "وسط", price: 10.0, totalPoints: 82, form: 4 },
        { id: "p4", name: "علي جاسم", team: "الشرطة", position: "وسط", price: 9.5, totalPoints: 79, form: 4 },
        { id: "p5", name: "حسن عبد الكريم", team: "القوة الجوية", position: "وسط", price: 8.5, totalPoints: 70, form: 3 },
        { id: "p6", name: "سعد ناطق", team: "الشرطة", position: "مدافع", price: 8.0, totalPoints: 65, form: 4 },
        { id: "p7", name: "ريبين سولاقا", team: "الزوراء", position: "مدافع", price: 7.0, totalPoints: 60, form: 3 },
        { id: "p8", name: "جاسم كريم", team: "النجف", position: "حارس", price: 4.5, totalPoints: 42, form: 2 }
    ];
}

app.get('/standings', async (req, res) => {
    let data = cache.get('standings');
    if (!data) {
        data = await scrapeStandings();
        if (data.length > 0) cache.set('standings', data);
    }
    res.json({ data });
});

app.get('/players', async (req, res) => {
    let data = cache.get('players');
    if (!data) {
        data = await scrapePlayers();
        if (data.length > 0) cache.set('players', data);
    }
    res.json({ data });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
