const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    const path = '.env.local';
    if (fs.existsSync(path)) {
        const env = {};
        const content = fs.readFileSync(path, 'utf8');
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [k, v] = line.split('=');
                env[k.trim()] = v.trim();
            }
        });
        return env;
    }
    return {};
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(URL, KEY);

async function run() {
    try {
        const { data, error } = await supabase
            .from('jugadores')
            .select('*')
            .or('es_seguido.eq.true,es_propio.eq.true')
            .order('nombre_corto', { ascending: true });

        if (error) {
            console.error("Query error:", error);
            return;
        }

        console.log("Total records fetched:", data.length);
        const seguidos = data.filter(r => r.es_seguido);
        const propios = data.filter(r => r.es_propio);
        console.log("Followed players count:", seguidos.length);
        console.log("Own players count:", propios.length);
        if (propios.length > 0) {
            console.log("First own player:", propios[0]);
        }
    } catch (err) {
        console.error("Exec error:", err);
    }
}

run();
