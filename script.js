document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("select-target");
  const lista = document.getElementById("lista-ingredienti");
  const btnCalc = document.getElementById("btn-calc");
  const btnReset = document.getElementById("btn-reset");
  const inputTargetVal = document.getElementById("input-target-value");

  if (!select || !lista || !btnCalc) return;

  // costruisco array ingredienti
  const ingredienti = [];
  const lis = Array.from(lista.querySelectorAll("li"));
  lis.forEach((li) => {
    const nome = li.getAttribute("data-name") || "";
    const qty =
      parseFloat(li.getAttribute("data-qty")) ||
      parseFloat(li.querySelector(".qty").textContent) ||
      0;
    const unit =
      li.getAttribute("data-unit") ||
      (li.querySelector(".unit") ? li.querySelector(".unit").textContent : "");
    const adjQtyEl = li.querySelector(".adj-qty");
    const adjUnitEl = li.querySelector(".adj-unit");
    ingredienti.push({
      nome,
      qty,
      unit,
      li,
      origQty: qty,
      adjQtyEl,
      adjUnitEl,
    });
  });

  // riempio la select
  ingredienti.forEach((ing, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${ing.nome} (${ing.origQty} ${ing.unit})`;
    select.appendChild(opt);
  });

  // funzione che azzera la colonna scalata (mostra "—")
  function azzeraScalati() {
    ingredienti.forEach((ing) => {
      if (ing.adjQtyEl) ing.adjQtyEl.textContent = "—";
      if (ing.adjUnitEl) ing.adjUnitEl.textContent = ing.unit || "";
    });
  }

  // quando cambia il target, azzero i valori scalati e imposto il valore default nell'input
  select.addEventListener("change", () => {
    const ing = ingredienti[parseInt(select.value, 10)];
    if (ing) inputTargetVal.value = ing.qty;
    azzeraScalati();
  });

  // quando l'utente modifica il valore target (digitando), azzero i valori scalati per evitare confusione
  inputTargetVal.addEventListener("input", () => {
    azzeraScalati();
  });

  if (ingredienti.length > 0) {
    select.value = 0;
    inputTargetVal.value = ingredienti[0].qty;
    azzeraScalati();
  }

  // formattazione: se unit contiene 'pc' => intero, altrimenti 2 decimali (senza .00)
  function formatQty(val, unit) {
    if (!isFinite(val)) return "—";
    if (unit && unit.toLowerCase().includes("pc"))
      return String(Math.round(val));
    let s = Number(val).toFixed(2);
    s = s.replace(/\.00$/, "");
    s = s.replace(/(\.\d)0$/, "$1");
    return s;
  }

  // calcola valori scalati e aggiorna colonna "Scalato" (INCLUSO il target)
  function scalaRicetta(targetIndex, nuovoVal) {
    const target = ingredienti[targetIndex];
    if (!target) {
      alert("Seleziona un ingrediente target valido.");
      return;
    }
    if (!isFinite(nuovoVal) || nuovoVal <= 0) {
      alert("Inserisci un valore numerico maggiore di 0 per il nuovo valore.");
      return;
    }
    const orig = target.qty;
    if (!(orig > 0)) {
      alert("Valore originale non valido per l'ingrediente selezionato.");
      return;
    }

    const fattore = nuovoVal / orig;

    ingredienti.forEach((ing) => {
      const adj = ing.origQty * fattore;
      if (ing.adjQtyEl) ing.adjQtyEl.textContent = formatQty(adj, ing.unit);
      if (ing.adjUnitEl) ing.adjUnitEl.textContent = ing.unit || "";
    });
  }

  // Applica: legge indice e valore e scala
  btnCalc.addEventListener("click", () => {
    const idx = parseInt(select.value, 10);
    const val = parseFloat(inputTargetVal.value);
    scalaRicetta(idx, val);
  });

  // Reset: svuota la colonna scalata (mostra "—") e riporta l'input al valore originale
  btnReset.addEventListener("click", () => {
    azzeraScalati();
    const idx = parseInt(select.value, 10);
    if (!isNaN(idx) && ingredienti[idx])
      inputTargetVal.value = ingredienti[idx].qty;
  });
});
