import express from 'express';
import { createServer as createViteServer } from 'vite';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

// In-memory "Database" for the Preview Environment (Shared across users)
const mockDb: any = {
    patients: [],
    medications: [],
    visits: [],
    pharmacySales: [],
    scientificNames: [],
    companyNames: [],
    medTypes: [],
    medCategories: [],
    symptoms: [],
    vitalDefinitions: [],
    prescriptionTemplates: [],
    patientCounter: 0,
    lastUpdated: Date.now()
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- Mock Sync Endpoint for Preview ---
app.post('/sync.php', async (req, res) => {
    const action = req.body.action || req.headers['x-action-type'];
    const clinicId = 1; // Single tenant mock

    // Helper for deep comparison
    const isDeepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

    if (action === 'poll') {
        // Long Polling Logic
        const clientTimestamp = req.body.timestamp ? new Date(req.body.timestamp).getTime() : 0;
        const startTime = Date.now();
        
        // Loop for up to 25 seconds
        while (Date.now() - startTime < 25000) {
            if (mockDb.lastUpdated > clientTimestamp) {
                return res.json({ status: 'update_available', timestamp: new Date(mockDb.lastUpdated).toISOString() });
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Sleep 0.5s
        }
        return res.json({ status: 'no_change' });
    }

    if (action === 'backup') {
        const data = req.body.data;
        const deletedIds = req.body.deletedIds || [];

        // 1. Handle Deletions
        if (deletedIds.length > 0) {
            deletedIds.forEach((del: any) => {
                const id = del.id;
                const type = del.type;
                let key = '';
                switch (type) {
                    case 'patients': key = 'patients'; break;
                    case 'medications': key = 'medications'; break;
                    case 'visits': key = 'visits'; break;
                    case 'pharmacySales': key = 'pharmacySales'; break;
                    case 'scientific': key = 'scientificNames'; break;
                    case 'companies': key = 'companyNames'; break;
                    case 'med_types': key = 'medTypes'; break;
                    case 'med_categories': key = 'medCategories'; break;
                    case 'symptoms': key = 'symptoms'; break;
                    case 'vitals': key = 'vitalDefinitions'; break;
                    case 'templates': key = 'prescriptionTemplates'; break;
                    case 'low_stock': key = 'medications'; break;
                }
                if (key && mockDb[key]) {
                    mockDb[key] = mockDb[key].filter((item: any) => item.id !== id);
                }
            });
        }

        // 2. Handle Upserts
        if (data) {
            Object.keys(data).forEach(key => {
                if (key === 'patientCounter') {
                    mockDb.patientCounter = Math.max(mockDb.patientCounter, data.patientCounter);
                } else if (Array.isArray(data[key])) {
                    const items = data[key];
                    if (!mockDb[key]) mockDb[key] = [];
                    
                    items.forEach((item: any) => {
                        const index = mockDb[key].findIndex((i: any) => i.id === item.id);
                        if (index >= 0) {
                            mockDb[key][index] = item;
                        } else {
                            mockDb[key].push(item);
                        }
                    });
                }
            });
        }

        mockDb.lastUpdated = Date.now();
        return res.json({ status: 'success', message: 'Backup synced to Mock DB successfully.' });
    }

    if (action === 'restore') {
        return res.json({ status: 'success', data: mockDb });
    }

    return res.status(400).json({ status: 'error', message: 'Invalid action' });
});


// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
