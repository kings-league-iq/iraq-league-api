const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

async function fetchStandingsFromGoal() {
    const url = 'https://www.goal.com/ar-eg/الفريق/الموصل/جدول/Pgj8lTePBG51FlI3ezqp1';

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'ar,en;q=0.9',
            },
            timeout: 8000, // 8 ثواني لتجنب انتهاء وقت Vercel
        });

        const $ = cheerio.load(data);
        let standings = [];

        $('table').each((index, table) => {
            $(table).find('tbody tr').each((rowIndex, row) => {
                const cells = $(row).find('td');
                
                if (cells.length > 3) {
                    // اسم الفريق دائماً في العمود الثاني (index 1)
                    let team = $(cells[1]).text().trim().split('\n')[0]; 
                    
                    // النقاط غالباً في آخر عمود أو قبل الأخير
                    let ptsText = $(cells[cells.length - 1]).text().trim();
                    let pts = parseInt(ptsText.replace(/[^0-9]/g, '')) || 0;

                    // إذا كان آخر عمود فارغ أو صفر، نجرب العمود الذي قبله
                    if (pts === 0 && cells.length > 4) {
                        ptsText = $(cells[cells.length - 2]).text().trim();
                        pts = parseInt(ptsText.replace(/[^0-9]/g, '')) || 0;
                    }

                    if (team.length > 2 && !team.includes('الترتيب')) {
                        standings.push({
                            team: team,
                            points: pts
                        });
                    }
                }
            });
            return false; // نكتفي بالجدول الأول
        });

        // ترتيب الفرق تنازلياً حسب النقاط
        standings.sort((a, b) => b.points - a.points);

        // إضافة المراكز
        standings = standings.map((item, index) => ({
            pos: index + 1,
            team: item.team,
            points: item.points
        }));

        return standings;
    } catch (error) {
        const cachedData = cache.get('standings');
        if (cachedData) return cachedData;
        return []; // إرجاع فارغ في حال الفشل
    }
}

app.get('/standings', async (req, res) => {
    try {
        const cachedStandings = cache.get('standings');
        if (cachedStandings) {
            return res.json({ source: 'cache', updatedAt: new Date().toISOString(), data: cachedStandings });
        }
        
        const standings = await fetchStandingsFromGoal();
        
        if (standings.length > 0) {
            cache.set('standings', standings);
        }
        
        res.json({ source: 'fresh', updatedAt: new Date().toISOString(), data: standings });
    } catch (error) {
        res.status(500).json({ error: 'فشل جلب البيانات', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على المنفذ ${PORT}`);
});
