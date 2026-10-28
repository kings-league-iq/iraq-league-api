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
                'User-Agent': 'IraqLeagueAPI/1.0 (Contact: your-email@example.com)',
                'Accept-Language': 'ar,en;q=0.9',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(data);
        const standings = [];

        $('table').each((index, table) => {
            const headers = $(table).find('th').map((i, el) => $(el).text().trim()).get();
            if (headers.some(h => h.includes('نقاط') || h.includes('فريق') || h.includes('Team'))) {
                $(table).find('tbody tr').each((rowIndex, row) => {
                    const cells = $(row).find('td');
                    if (cells.length >= 9) {
                        standings.push({
                            pos: $(cells[0]).text().trim(),
                            team: $(cells[1]).text().trim(),
                            played: $(cells[2]).text().trim(),
                            won: $(cells[3]).text().trim(),
                            drawn: $(cells[4]).text().trim(),
                            lost: $(cells[5]).text().trim(),
                            goalsFor: $(cells[6]).text().trim(),
                            goalsAgainst: $(cells[7]).text().trim(),
                            goalDifference: $(cells[8]).text().trim(),
                            points: $(cells[9]).text().trim(),
                        });
                    }
                });
                return false;
            }
        });

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

app.get('/health', (req, res) => { res.json({ status: 'ok' }); });

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على المنفذ ${PORT}`);
});
