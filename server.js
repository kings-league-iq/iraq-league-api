const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchStandingsFromGoal() {
    const fallbackUrl = 'https://www.goal.com/ar-eg/الفريق/الموصل/جدول/Pgj8lTePBG51FlI3ezqp1';

    try {
        const { data } = await axios.get(fallbackUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'ar,en;q=0.9',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(data);
        let standings = [];

        $('table').each((index, table) => {
            const headers = $(table).find('th').map((i, el) => $(el).text().trim()).get();
            
            if (headers.length > 5 && headers.some(h => h.includes('نقاط') || h.includes('فريق'))) {
                $(table).find('tbody tr').each((rowIndex, row) => {
                    const cells = $(row).find('td');
                    let team = "";
                    let pts = 0;

                    // استخراج الاسم من العمود الثاني، والنقاط من العمود الأخير
                    cells.each((i, cell) => {
                        const text = $(cell).text().trim();
                        if (i === 1 && text.length > 2) {
                            team = text; // اسم الفريق
                        }
                        if (i === cells.length - 1) {
                            // نستخرج الأرقام فقط من النص
                            const numbersOnly = text.replace(/[^0-9]/g, '');
                            if (numbersOnly !== '') pts = parseInt(numbersOnly);
                        }
                    });

                    if (team !== "" && !team.includes('الترتيب')) {
                        standings.push({
                            team: team,
                            points: pts
                        });
                    }
                });
                return false;
            }
        });

        // ترتيب الجدول تنازلياً حسب النقاط
        standings.sort((a, b) => b.points - a.points);

        // إضافة المركز بعد الترتيب
        standings = standings.map((item, index) => ({
            pos: index + 1,
            team: item.team,
            points: item.points
        }));

        if (standings.length === 0) throw new Error('لم يتم العثور على جدول الترتيب');
        return standings;
    } catch (error) {
        const cachedData = cache.get('standings');
        if (cachedData) return cachedData;
        throw error;
    }
}

app.get('/standings', async (req, res) => {
    try {
        const cachedStandings = cache.get('standings');
        if (cachedStandings) {
            return res.json({ source: 'cache', updatedAt: new Date().toISOString(), data: cachedStandings });
        }
        await delay(1000);
        const standings = await fetchStandingsFromGoal();
        cache.set('standings', standings);
        res.json({ source: 'fresh', updatedAt: new Date().toISOString(), data: standings });
    } catch (error) {
        res.status(500).json({ error: 'فشل جلب البيانات', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على المنفذ ${PORT}`);
});
