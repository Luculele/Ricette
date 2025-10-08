// script.js — versione corretta: tutto dentro DOMContentLoaded (escapeText accessibile alle funzioni del modal)
document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Helper per escaping
  // -------------------------
  function escapeText(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -------------------------
  // DOM refs principali
  // -------------------------
  const recipesList =
    document.getElementById("recipes-list") || createRecipesList();
  const btnAdd = document.getElementById("btn-add-recipe");
  const formNuova = document.getElementById("form-nuova-ricetta");
  const btnCancel = document.getElementById("btn-cancel-recipe");
  const btnSave = document.getElementById("btn-save-recipe");
  const ingredientiContainer = document.getElementById("ingredienti-container");
  const btnAddIngredient = document.getElementById("btn-add-ingredient");

  // -------------------------
  // helper: se non esiste recipes-list lo crea
  // -------------------------
  function createRecipesList() {
    const container = document.createElement("div");
    container.id = "recipes-list";
    // inserisco prima del main content se c'è, altrimenti in cima al body
    const main = document.querySelector("main") || document.body.firstChild;
    if (main && main.parentNode)
      main.parentNode.insertBefore(container, main.nextSibling);
    else document.body.insertBefore(container, document.body.firstChild);
    return container;
  }

  // ---------- evento apertura form ----------
  if (btnAdd && formNuova) {
    btnAdd.addEventListener("click", () => {
      formNuova.style.display = "block";
      // pulisco ingredienti e inserisco una riga vuota iniziale
      if (ingredientiContainer) {
        ingredientiContainer.innerHTML = "";
        addIngredienteRow();
      }
      // sposta focus sul titolo per comodità
      const t = document.getElementById("nuovo-titolo");
      if (t) t.focus();
    });
  }

  if (btnCancel && formNuova) {
    btnCancel.addEventListener("click", () => {
      formNuova.style.display = "none";
    });
  }

  // ---------- funzione per aggiungere una riga ingrediente ----------
  function addIngredienteRow(name = "", qty = "", unit = "") {
    if (!ingredientiContainer) return;
    const div = document.createElement("div");
    div.className = "ingrediente-row";
    div.innerHTML = `
      <input type="text" class="ing-nome" placeholder="Nome ingrediente" value="${escapeHtml(
        name
      )}" />
      <input type="number" class="ing-qty" placeholder="Quantità" value="${escapeHtml(
        qty
      )}" />
      <input type="text" class="ing-unit" placeholder="Unità" value="${escapeHtml(
        unit
      )}" />
      <button type="button" class="btn-remove-ing">Rimuovi</button>
    `;
    ingredientiContainer.appendChild(div);

    // rimuovi ingrediente
    const btnRemove = div.querySelector(".btn-remove-ing");
    if (btnRemove) {
      btnRemove.addEventListener("click", () => div.remove());
    }

    // scrolla in basso per mostrare il nuovo campo (animato)
    ingredientiContainer.scrollTo({
      top: ingredientiContainer.scrollHeight,
      behavior: "smooth",
    });

    // focus sul nome appena creato
    const nomeInput = div.querySelector(".ing-nome");
    if (nomeInput) nomeInput.focus();
  }

  // bind sul bottone "Aggiungi ingrediente"
  if (btnAddIngredient) {
    btnAddIngredient.addEventListener("click", (e) => {
      e.preventDefault();
      addIngredienteRow();
    });
  }

  // ---------- carica ricette dal DB e le renderizza ----------
  async function loadRecipes() {
    recipesList.innerHTML = "<p>Caricamento ricette…</p>";
    try {
      const res = await fetch("/.netlify/functions/get-recipes");
      if (!res.ok) throw new Error(`Errore fetch: ${res.status}`);
      const recipes = await res.json();

      // svuota area e ricrea
      recipesList.innerHTML = "";
      if (!Array.isArray(recipes) || recipes.length === 0) {
        recipesList.innerHTML = "<p>Nessuna ricetta trovata.</p>";
        return;
      }

      recipes.forEach((r) => {
        const el = renderRecipe(r);

        // aggiungo animazione di ingresso
        el.classList.add("new");
        recipesList.appendChild(el);

        // rimuovo la classe new dopo l'animazione
        setTimeout(() => {
          el.classList.remove("new");
        }, 700);
      });
    } catch (err) {
      console.error("loadRecipes error:", err);
      recipesList.innerHTML = `<p>Errore nel caricamento delle ricette.</p>`;
    }
  }

  // helper: crea DOM di una ricetta (usa proprietà della tabella: image_url, ingredients JSONB, procedure TEXT)
  function renderRecipe(r) {
    const wrapper = document.createElement("article");
    wrapper.className = "ricetta";
    const title = escapeText(r.title || "Untitled");
    const desc = escapeText(r.description || "");
    const authorHtml = r.author
      ? `<p class="autore">Autore: ${escapeText(r.author)}</p>`
      : "";
    const imageHtml = r.image_url
      ? `<img src="${escapeText(
          r.image_url
        )}" alt="${title}" class="recipe-image">`
      : "";

    // build ingredients html (but we keep data on the recipe object for modal)
    let ingredientsHtml = "<ul>";
    try {
      const ings = Array.isArray(r.ingredients)
        ? r.ingredients
        : JSON.parse(r.ingredients || "[]");
      ings.forEach((ing) => {
        const name = escapeText(ing.name || ing.nome || "");
        const qty = escapeText(ing.qty != null ? ing.qty : "");
        const unit = escapeText(ing.unit || "");
        ingredientsHtml += `<li>${name}: <span class="modal-qty">${qty}</span> <span class="modal-unit">${unit}</span></li>`;
      });
    } catch (e) {
      ingredientsHtml += "<li>Errore leggendo ingredienti</li>";
    }
    ingredientsHtml += "</ul>";

    wrapper.innerHTML = `
    <h3>${title}</h3>
    ${authorHtml}
    ${imageHtml}
    <p class="descrizione">${desc}</p>
    <h4>Ingredienti</h4>
    ${ingredientsHtml}
  `;

    // apri modal al click (non delegato) — passa l'oggetto recipe 'r'
    wrapper.addEventListener("click", (ev) => {
      openModal(r);
    });

    return wrapper;
  }

  // -------------------------
  // Salvataggio nuova ricetta (POST)
  // -------------------------
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const titoloEl = document.getElementById("nuovo-titolo");
      const autoreEl = document.getElementById("nuovo-autore");
      const descrizioneEl = document.getElementById("nuova-descrizione");
      const procedimentoEl = document.getElementById("nuovo-procedimento");

      const titolo = titoloEl ? titoloEl.value.trim() : "";
      const autore = autoreEl ? autoreEl.value.trim() : "";
      const descrizione = descrizioneEl ? descrizioneEl.value.trim() : "";
      const procedimento = procedimentoEl ? procedimentoEl.value.trim() : "";

      if (!titolo) {
        alert("Inserisci il titolo della ricetta!");
        return;
      }
      if (!autore) {
        alert("Inserisci il nome dell'autore!");
        return;
      }

      // raccogli ingredienti
      const ingredientiArr = [];
      (ingredientiContainer
        ? ingredientiContainer.querySelectorAll(".ingrediente-row")
        : []
      ).forEach((row) => {
        const nomeEl = row.querySelector(".ing-nome");
        const qtyEl = row.querySelector(".ing-qty");
        const unitEl = row.querySelector(".ing-unit");
        const nome = nomeEl ? nomeEl.value.trim() : "";
        const qty = qtyEl ? parseFloat(qtyEl.value) : NaN;
        const unit = unitEl ? unitEl.value.trim() : "";
        if (nome && !isNaN(qty)) {
          ingredientiArr.push({ name: nome, qty, unit });
        }
      });

      if (ingredientiArr.length === 0) {
        alert("Inserisci almeno un ingrediente valido!");
        return;
      }

      const body = {
        title: titolo,
        author: autore,
        description: descrizione,
        procedure: procedimento,
        ingredients: ingredientiArr,
      };

      // disabilita il bottone mentre invia
      btnSave.disabled = true;
      btnSave.textContent = "Salvo...";

      try {
        const res = await fetch("/.netlify/functions/create-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.error("create-recipe failed:", data);
          alert("Errore durante il salvataggio. Controlla console.");
        } else {
          // successo: pulisco il form e ricarico la lista
          alert("Ricetta salvata con successo!");
          formNuova.style.display = "none";

          // pulizia input
          if (titoloEl) titoloEl.value = "";
          if (autoreEl) autoreEl.value = "";
          if (descrizioneEl) descrizioneEl.value = "";
          if (procedimentoEl) procedimentoEl.value = "";
          if (ingredientiContainer) ingredientiContainer.innerHTML = "";

          // aggiungo una riga ingredient di default per la prossima apertura del form
          if (ingredientiContainer) addIngredienteRow();

          await loadRecipes();
        }
      } catch (err) {
        console.error("Errore:", err);
        alert("Errore nel salvataggio della ricetta.");
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = "Salva ricetta";
      }
    });
  }

  // inizializza: aggiungo una riga ingrediente di default se il container esiste e lo lascio nascosto
  if (ingredientiContainer && ingredientiContainer.children.length === 0)
    addIngredienteRow();

  // carico ricette all'apertura
  loadRecipes();

  // -------------------------
  // Modal helpers (dentro DOMContentLoaded così vedono escapeText)
  // -------------------------
  const modalRoot = document.getElementById("recipe-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalCloseBtn = document.getElementById("modal-close");
  const modalTitle = document.getElementById("modal-title");
  const modalAuthor = document.getElementById("modal-author");
  const modalImage = document.getElementById("modal-image");
  const modalDesc = document.getElementById("modal-description");
  const modalIngredients = document.getElementById("modal-ingredients");
  const modalProcedure = document.getElementById("modal-procedure");
  const modalSelect = document.getElementById("modal-select-target");
  const modalInputVal = document.getElementById("modal-input-target-value");
  const modalBtnApply = document.getElementById("modal-btn-apply");
  const modalBtnReset = document.getElementById("modal-btn-reset");

  function openModal(recipe) {
    if (!modalRoot) return;
    // popola titolo, autore, image, descrizione, procedimento
    modalTitle.textContent = recipe.title || "Untitled";
    modalAuthor.textContent = recipe.author ? `Autore: ${recipe.author}` : "";
    if (recipe.image_url) {
      modalImage.src = recipe.image_url;
      modalImage.style.display = "block";
    } else {
      if (modalImage) modalImage.style.display = "none";
    }
    modalDesc.textContent = recipe.description || "";

    // ingredienti: ricreiamo la lista con originali e campo scalato (—)
    if (!modalIngredients) return;
    modalIngredients.innerHTML = "";
    const ings = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : JSON.parse(recipe.ingredients || "[]");
    ings.forEach((ing, idx) => {
      const li = document.createElement("li");
      li.setAttribute("data-name", ing.name || ing.nome || "");
      li.setAttribute("data-qty", ing.qty != null ? ing.qty : "");
      li.setAttribute("data-unit", ing.unit || "");
      li.innerHTML = `
        <span class="ing-left">${escapeText(ing.name || ing.nome || "")}</span>
        <span class="ing-mid">Originale: <span class="orig-qty">${formatQty(
          ing.qty,
          ing.unit
        )}</span> <span class="unit">${escapeText(ing.unit || "")}</span></span>
        <span class="ing-right">Scalato: <span class="scaled-qty">—</span> <span class="unit-scaled">${escapeText(
          ing.unit || ""
        )}</span></span>
      `;
      modalIngredients.appendChild(li);
    });

    // riempi select target
    if (modalSelect) {
      modalSelect.innerHTML = "";
      ings.forEach((ing, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = `${ing.name} (${formatQty(ing.qty, ing.unit)} ${
          ing.unit || ""
        })`;
        modalSelect.appendChild(opt);
      });
    }

    // imposta default valore input con qty del primo ingrediente
    if (modalInputVal && ings.length > 0) modalInputVal.value = ings[0].qty;

    // evento apply/reset (rimuove eventuali handler precedenti per sicurezza)
    if (modalBtnApply) {
      modalBtnApply.onclick = () => {
        const idx = parseInt(modalSelect.value, 10);
        const val = parseFloat(modalInputVal.value);
        scalaRicettaModal(idx, val);
      };
    }
    if (modalBtnReset) {
      modalBtnReset.onclick = () => {
        // azzera scalati
        Array.from(modalIngredients.querySelectorAll(".scaled-qty")).forEach(
          (el) => (el.textContent = "—")
        );
        // riporta input al valore originale dell'elemento selezionato
        const idx = parseInt(modalSelect.value, 10);
        if (!isNaN(idx) && ings[idx]) modalInputVal.value = ings[idx].qty;
      };
    }

    // mostra modal
    modalRoot.style.display = "block";
    modalRoot.setAttribute("aria-hidden", "false");

    // chiusura con backdrop / pulsante / Esc
    if (modalBackdrop) modalBackdrop.onclick = closeModal;
    if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
    document.addEventListener("keydown", handleEscClose);
  }

  function closeModal() {
    if (!modalRoot) return;
    modalRoot.style.display = "none";
    modalRoot.setAttribute("aria-hidden", "true");
    // cleanup
    if (modalBackdrop) modalBackdrop.onclick = null;
    if (modalCloseBtn) modalCloseBtn.onclick = null;
    if (modalBtnApply) modalBtnApply.onclick = null;
    if (modalBtnReset) modalBtnReset.onclick = null;
    document.removeEventListener("keydown", handleEscClose);
  }

  function handleEscClose(e) {
    if (e.key === "Escape") closeModal();
  }

  /* formatting helper (like before) */
  function formatQty(val, unit) {
    if (!isFinite(val)) return "—";
    if (unit && unit.toLowerCase().includes("pc"))
      return String(Math.round(val));
    let s = Number(val).toFixed(2);
    s = s.replace(/\.00$/, "");
    s = s.replace(/(\.\d)0$/, "$1");
    return s;
  }

  /* scalaRicettaModal: calcola e scrive i valori scalati nella lista del modal */
  function scalaRicettaModal(targetIndex, nuovoVal) {
    if (!modalIngredients) return;
    const lis = Array.from(modalIngredients.querySelectorAll("li"));
    if (!lis[targetIndex]) {
      alert("Seleziona un ingrediente target valido.");
      return;
    }
    if (!isFinite(nuovoVal) || nuovoVal <= 0) {
      alert("Inserisci un valore numerico maggiore di 0.");
      return;
    }

    const targetQty = parseFloat(lis[targetIndex].getAttribute("data-qty"));
    if (!(targetQty > 0)) {
      alert("Valore originale non valido per l'ingrediente selezionato.");
      return;
    }

    const fattore = nuovoVal / targetQty;
    lis.forEach((li) => {
      const orig = parseFloat(li.getAttribute("data-qty"));
      const unit = li.getAttribute("data-unit") || "";
      const scaled = orig * fattore;
      const display = formatQty(scaled, unit);
      const scaledEl = li.querySelector(".scaled-qty");
      if (scaledEl) scaledEl.textContent = display;
    });
  }
}); // fine DOMContentLoaded
