// script.js — versione aggiornata: carica dal DB, form dinamico, POST su Netlify Functions
document.addEventListener("DOMContentLoaded", () => {
  // DOM references (verifica esistenza)
  const recipesList =
    document.getElementById("recipes-list") || createRecipesList();
  const btnAdd = document.getElementById("btn-add-recipe");
  const formNuova = document.getElementById("form-nuova-ricetta");
  const btnCancel = document.getElementById("btn-cancel-recipe");
  const btnSave = document.getElementById("btn-save-recipe");
  const ingredientiContainer = document.getElementById("ingredienti-container");
  const btnAddIngredient = document.getElementById("btn-add-ingredient");

  // helper: se non esiste recipes-list lo crea
  function createRecipesList() {
    const container = document.createElement("div");
    container.id = "recipes-list";
    // inserisco prima del main content se c'è, altrimenti in cima al body
    const main = document.querySelector(".ricetta") || document.body.firstChild;
    if (main && main.parentNode) main.parentNode.insertBefore(container, main);
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
    div.style.marginBottom = "8px";
    div.innerHTML = `
      <input type="text" class="ing-nome" placeholder="Nome ingrediente" value="${escapeHtml(
        name
      )}" />
      <input type="number" class="ing-qty" placeholder="Quantità" value="${escapeHtml(
        qty
      )}" style="width:100px" />
      <input type="text" class="ing-unit" placeholder="Unità" value="${escapeHtml(
        unit
      )}" style="width:80px" />
      <button type="button" class="btn-remove-ing">Rimuovi</button>
    `;
    ingredientiContainer.appendChild(div);

    // rimuovi ingrediente
    const btnRemove = div.querySelector(".btn-remove-ing");
    if (btnRemove) {
      btnRemove.addEventListener("click", () => div.remove());
    }
  }

  // escape semplice per valori inseriti in value attr
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
        recipesList.appendChild(el);
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
    const author = r.author
      ? `<p class="author">Autore: ${escapeText(r.author)}</p>`
      : "";
    const image = r.image_url
      ? `<img src="${escapeText(
          r.image_url
        )}" alt="${title}" style="max-width:220px;margin:8px 0;border-radius:6px">`
      : "";
    let ingredientsHtml = "<ul>";
    try {
      const ings = Array.isArray(r.ingredients)
        ? r.ingredients
        : JSON.parse(r.ingredients || "[]");
      ings.forEach((ing) => {
        const name = escapeText(ing.name || ing.nome || "");
        const qty = escapeText(ing.qty != null ? ing.qty : "");
        const unit = escapeText(ing.unit || "");
        ingredientsHtml += `<li>${name}: ${qty} ${unit}</li>`;
      });
    } catch (e) {
      ingredientsHtml += "<li>Errore leggendo ingredienti</li>";
    }
    ingredientsHtml += "</ul>";

    // procedure può essere TEXT normale o JSON array — gestiamo entrambi
    let procedureHtml = "";
    try {
      if (!r.procedure) {
        procedureHtml = "<p>-</p>";
      } else {
        // se è JSON array
        let proc = r.procedure;
        if (typeof proc === "string") {
          // prova a vedere se è JSON
          try {
            const parsed = JSON.parse(proc);
            if (Array.isArray(parsed)) proc = parsed;
          } catch (e) {
            // rimane stringa: split on newlines
            proc = proc
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        if (Array.isArray(proc)) {
          procedureHtml =
            "<ol>" +
            proc.map((p) => `<li>${escapeText(p)}</li>`).join("") +
            "</ol>";
        } else {
          procedureHtml = `<p>${escapeText(String(proc))}</p>`;
        }
      }
    } catch (e) {
      procedureHtml = "<p>Errore procedura</p>";
    }

    wrapper.innerHTML = `
      <h3>${title}</h3>
      <p class="descrizione">${desc}</p>
      ${image}
      <h4>Ingredienti</h4>
      ${ingredientsHtml}
      <h4>Procedimento</h4>
      ${procedureHtml}
      ${author}
      <hr/>
    `;
    return wrapper;
  }

  function escapeText(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---------- salva la nuova ricetta sul DB (POST) ----------
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const titolo = document.getElementById("nuovo-titolo").value.trim();
      const autore = document.getElementById("nuovo-autore").value.trim();
      const descrizione = document
        .getElementById("nuova-descrizione")
        .value.trim();
      const procedimento = document
        .getElementById("nuovo-procedimento")
        .value.trim();

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
      document.querySelectorAll(".ingrediente-row").forEach((row) => {
        const nome = row.querySelector(".ing-nome").value.trim();
        const qty = parseFloat(row.querySelector(".ing-qty").value);
        const unit = row.querySelector(".ing-unit").value.trim();

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

      try {
        const res = await fetch("/.netlify/functions/create-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Errore durante il salvataggio");
        alert("Ricetta salvata con successo!");
        formNuova.style.display = "none";
        loadRecipes(); // ricarica la lista
      } catch (err) {
        console.error("Errore:", err);
        alert("Errore nel salvataggio della ricetta.");
      }
    });
  }

  // inizializza: aggiungo una riga ingrediente di default se il container esiste e lo lascio nascosto
  if (ingredientiContainer && ingredientiContainer.children.length === 0)
    addIngredienteRow();

  // carico ricette all'apertura
  loadRecipes();
});
