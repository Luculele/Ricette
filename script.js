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

  // funzione che azzera la colonna scalata
  function azzeraScalati() {
    ingredienti.forEach((ing) => {
      if (ing.adjQtyEl) ing.adjQtyEl.textContent = "—";
      if (ing.adjUnitEl) ing.adjUnitEl.textContent = ing.unit || "";
    });
  }

  // quando cambia il target o l'input
  function resetOnChange() {
    const ing = ingredienti[parseInt(select.value, 10)];
    if (ing) inputTargetVal.value = ing.qty;
    azzeraScalati();
  }

  select.addEventListener("change", resetOnChange);
  inputTargetVal.addEventListener("input", azzeraScalati);

  if (ingredienti.length > 0) resetOnChange();

  // formattazione valori
  function formatQty(val, unit) {
    if (!isFinite(val)) return "—";
    if (unit && unit.toLowerCase().includes("pc"))
      return String(Math.round(val));
    let s = Number(val).toFixed(2);
    s = s.replace(/\.00$/, "");
    s = s.replace(/(\.\d)0$/, "$1");
    return s;
  }

  // calcolo valori scalati senza toccare gli originali
  function scalaRicetta(targetIndex, nuovoVal) {
    const target = ingredienti[targetIndex];
    if (!target) return alert("Seleziona un ingrediente target valido.");
    if (!isFinite(nuovoVal) || nuovoVal <= 0)
      return alert("Inserisci un valore numerico maggiore di 0.");

    const fattore = nuovoVal / target.qty;

    ingredienti.forEach((ing) => {
      const adj = ing.origQty * fattore;
      if (ing.adjQtyEl) ing.adjQtyEl.textContent = formatQty(adj, ing.unit);
      if (ing.adjUnitEl) ing.adjUnitEl.textContent = ing.unit || "";
    });
  }

  // Applica
  btnCalc.addEventListener("click", () => {
    const idx = parseInt(select.value, 10);
    const val = parseFloat(inputTargetVal.value);
    scalaRicetta(idx, val);
  });

  // Reset
  btnReset.addEventListener("click", resetOnChange);
});
