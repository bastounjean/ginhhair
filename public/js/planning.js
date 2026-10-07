// Planning hebdomadaire partagé par la page RDV (clients) et l'espace barbers.
// options : { el, onSlot(slot), filterBarber: id|null, showTaken: bool }
function Planning(options) {
  const state = { monday: mondayOf(new Date()), barbers: [], hidden: new Set(), slots: [] };

  function mondayOf(d) {
    const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    return m;
  }
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  options.el.innerHTML = `
    <div class="legend"></div>
    <div class="week-nav">
      <button class="btn small light" data-move="-7">‹ Semaine préc.</button>
      <span class="title"></span>
      <button class="btn small light" data-move="7">Semaine suiv. ›</button>
    </div>
    <div class="week"></div>`;
  $$('[data-move]', options.el).forEach((b) => (b.onclick = () => {
    state.monday = addDays(state.monday, Number(b.dataset.move));
    load();
  }));

  async function init() {
    state.barbers = await api('/api/barbers');
    const legend = $('.legend', options.el);
    if (options.filterBarber) {
      const b = state.barbers.find((x) => x.id === options.filterBarber);
      legend.innerHTML = `<span class="chip"><span class="dot" style="background:${b.color}"></span>Tes créneaux</span>`;
    } else {
      legend.innerHTML = state.barbers.map((b) =>
        `<span class="chip" data-id="${b.id}" title="Afficher / masquer"><span class="dot" style="background:${b.color}"></span>${esc(b.name)}</span>`).join('');
      $$('.chip', legend).forEach((c) => (c.onclick = () => {
        const id = Number(c.dataset.id);
        state.hidden.has(id) ? state.hidden.delete(id) : state.hidden.add(id);
        c.classList.toggle('off');
        render();
      }));
    }
    await load();
  }

  async function load() {
    const end = addDays(state.monday, 7);
    state.slots = await api(`/api/slots?from=${isoDay(state.monday)}&to=${isoDay(end)}`);
    render();
  }

  function render() {
    const end = addDays(state.monday, 6);
    $('.title', options.el).textContent =
      `${state.monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    const week = $('.week', options.el);
    week.innerHTML = '';
    const today = isoDay(new Date());
    for (let i = 0; i < 7; i++) {
      const d = addDays(state.monday, i);
      const key = isoDay(d);
      const slots = state.slots.filter((s) => s.start.startsWith(key) && !state.hidden.has(s.barber_id) &&
        (!options.filterBarber || s.barber_id === options.filterBarber) &&
        (options.showTaken || s.status === 'open' || s.status === 'held'));
      const day = document.createElement('div');
      day.className = 'day' + (key === today ? ' today' : '') + (slots.length ? '' : ' empty');
      day.innerHTML = `<h4>${d.toLocaleDateString('fr-FR', { weekday: 'short' })}<b>${d.getDate()}</b></h4><div class="slots"></div>`;
      const box = $('.slots', day);
      if (!slots.length) box.innerHTML = '<div class="none">—</div>';
      for (const s of slots) {
        const btn = document.createElement('button');
        btn.className = 'slot ' + (s.status !== 'open' ? s.status : '');
        btn.style.setProperty('--c', s.color);
        const label = s.status === 'held' ? ' ⏳' : s.status === 'booked' ? ' ✓' : '';
        btn.title = `${s.barber} · ${s.duration} min${s.status === 'held' ? ' · déjà demandé' : ''}`;
        btn.innerHTML = `<b>${s.start.slice(11, 16).replace(':', 'h')}</b>${esc(s.barber)}${label}`;
        btn.onclick = () => options.onSlot && options.onSlot(s);
        box.appendChild(btn);
      }
      week.appendChild(day);
    }
  }

  init();
  return { reload: load, get barbers() { return state.barbers; } };
}
