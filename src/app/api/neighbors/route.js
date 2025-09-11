export async function POST(req) {
    const body = await req.json();
    const word = String(body.word || '').toLowerCase();
    const sense = Number(body.sense ?? 0);
  
    const MOCK = {
      blue: [
        { label: 'color',      n:'Azure', e:'Navy', s:'Indigo', w:'Cyan' },
        { label: 'mood',       n:'Sorrowful', e:'Melancholic', s:'Depressed', w:'Sad' }
      ],
      bank: [
        { label: 'finance',    n:'Lender', e:'Branch', s:'Deposit', w:'Credit' },
        { label: 'river edge', n:'Shore',  e:'Riverbank', s:'Embankment', w:'Levee' }
      ]
    };
  
    const senses = MOCK[word];
    if (!senses) {
      return new Response(JSON.stringify({
        ok:true,
        center: word,
        sense_index: 0,
        neighbors: { north: word+'s', east: 'about', south: 'related', west: 'context' },
        alternates: [{ sense_index: 0, sense_label: 'default'}]
      }), { status: 200, headers: {'Content-Type':'application/json'}});
    }
  
    const s = senses[(sense % senses.length + senses.length) % senses.length];
    return new Response(JSON.stringify({
      ok:true,
      center: word,
      sense_index: sense,
      neighbors: { north: s.n, east: s.e, south: s.s, west: s.w },
      alternates: senses.map((x, i) => ({ sense_index: i, sense_label: x.label }))
    }), { status: 200, headers: {'Content-Type':'application/json'}});
  }
  