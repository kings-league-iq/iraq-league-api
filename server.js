const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 1800 }); // تحديث كل 30 دقيقة

// روابط Goal.com
const standingsUrl = 'https://www.goal.com/ar-eg/الفريق/الموصل/جدول/Pgj8lTePBG51FlI3ezqp1';
// ملاحظة: يمكنك تغيير هذا الرابط لاحقاً لصفحة الهدافين إذا وجدتها في Goal
const playersUrl = 'https://www.goal.com/ar-eg/الفريق/الموصل/الهدافين/Pgj8lTePBG51FlI3ezqp1'; 

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

async function scrapePlayers() {
    try {
        const { data } = await axios.get(playersUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
            timeout: 8000,
        });
        const $ = cheerio.load(data);
        let players = [];
        let idCounter = 1;

        // كود كشط اللاعبين (يقرأ الجداول)
        $('table').each((i, table) => {
            $(table).find('tbody tr').each((rowIndex, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 3) {
                    let name = $(cells[1]).text().trim();
                    let team = $(cells[2]).text().trim();
                    let goals = parseInt($(cells[3]).text().replace(/[^0-9]/g, '')) || 0;

                    if (name.length > 2) {
                        players.push({
                            id: `p${idCounter++}`,
                            name: name,
                            team: team,
                            position: 'مهاجم', // يمكن تعديلها
                            price: 5.0 + (goals * 0.5), // السعر يزيد حسب الأهداف
                            totalPoints: goals * 10, // النقاط حسب الأهداف
                            form: 3
                        });
                    }
                }
            });
        });
        
        // إذا لم يجد بيانات، يعيد قائمة تجريبية حقيقية
        if (players.length === 0) {
            return [
                { id: "p1", name: "أيمن حسين", team: "القوة الجوية", position: "مهاجم", price: 12.5, totalPoints: 95, form: 5 },
                { id: "p2", name: "مهند علي", team: "الطلبة", position: "مهاجم", price: 11.0, totalPoints: 88, form: 4 }
            ];
        }
        return players;
    } catch (e) {
        return [];
    }
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
