document.addEventListener('DOMContentLoaded', () => {
  // 🌙 Mode Nuit
  const themeBtn = document.getElementById('toggle-theme');
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeBtn.textContent = document.body.classList.contains('dark') ? '☀️ Mode Jour' : '🌙 Mode Nuit';
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️ Mode Jour';
  }

  //  Sauvegarde automatique
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    const key = el.id;
    if (localStorage.getItem(key)) el.innerHTML = localStorage.getItem(key);
    el.addEventListener('input', () => localStorage.setItem(key, el.innerHTML));
  });

  //  Export PDF multi-pages
  document.getElementById('export-pdf').addEventListener('click', async () => {
    const element = document.getElementById('fiche-content');
    document.body.classList.add('pdf-mode');

    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: clonedDoc => {
        clonedDoc.querySelectorAll('.card').forEach(el => {
          el.style.backdropFilter = 'none';
          el.style.webkitBackdropFilter = 'none';
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111';
          el.style.border = '1px solid #ccc';
        });
      }
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    let position = 0;
    while (position < canvasHeight) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = Math.min((pdfHeight * canvasWidth) / pdfWidth, canvasHeight - position);
      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, position, canvasWidth, pageCanvas.height, 0, 0, canvasWidth, pageCanvas.height);
      const pageImg = pageCanvas.toDataURL('image/jpeg', 1.0);

      if (position > 0) pdf.addPage();
      pdf.addImage(pageImg, 'JPEG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvasWidth);
      position += pageCanvas.height;
    }

    pdf.save(`${document.getElementById('chapter-title').innerText || 'Fiche_NSI'}.pdf`);
    document.body.classList.remove('pdf-mode');
  });

  //  Bouton d'ajout de section
  const addSectionBtn = document.createElement('button');
  addSectionBtn.textContent = '+ Ajouter une section';
  document.querySelector('.toolbar').appendChild(addSectionBtn);

  //  Fonction utilitaire pour supprimer une section
  function addDeleteButton(section) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'X';
    deleteBtn.classList.add('delete-btn');
    section.appendChild(deleteBtn);

    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Supprimer cette section ?')) {
        localStorage.removeItem(section.id);
        section.remove();
      }
    });
  }

  // Appliquer la croix à toutes les sections existantes
  document.querySelectorAll('.card').forEach(section => addDeleteButton(section));

  // Création dynamique d'une nouvelle section
// Création dynamique d'une nouvelle section
addSectionBtn.addEventListener('click', () => {
  const sectionType = prompt('Type de section ? (texte, liste, code, retenir, image)', 'texte');
  if (!sectionType) return;

  const newSection = document.createElement('section');
  newSection.classList.add('card');
  const id = 'section-' + Date.now();
  newSection.id = id;
  newSection.contentEditable = true;

  let h2Text = prompt('Titre de la section', 'Nouvelle section');
  newSection.innerHTML = `<h2>${h2Text}</h2>`;

  switch (sectionType.toLowerCase()) {
    case 'texte':
      newSection.innerHTML += `<p>Votre contenu ici...</p>`;
      break;
    case 'liste':
      newSection.innerHTML += `<ul><li>Point 1</li><li>Point 2</li></ul>`;
      break;
    case 'code':
      newSection.innerHTML += `<pre><code class="code-block">console.log('Hello NSI!');</code></pre>`;
      break;
    case 'retenir':
      newSection.classList.add('highlight');
      newSection.innerHTML += `<p>À retenir...</p>`;
      break;
    case 'image':
      newSection.contentEditable = false; // éviter de casser l'image en éditant
      const uploadInput = document.createElement('input');
      uploadInput.type = 'file';
      uploadInput.accept = 'image/*';
      uploadInput.style.marginTop = '1rem';

      const img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.marginTop = '1rem';
      img.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';

      uploadInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          img.src = ev.target.result;
          localStorage.setItem(id + '_img', img.src);
        };
        reader.readAsDataURL(file);
      });

      // Charger l'image si elle existe déjà
      const savedImg = localStorage.getItem(id + '_img');
      if (savedImg) img.src = savedImg;

      newSection.appendChild(uploadInput);
      newSection.appendChild(img);
      break;
    default:
      newSection.innerHTML += `<p>Votre contenu ici...</p>`;
  }

  addDeleteButton(newSection);
  newSection.setAttribute('draggable', true);
  document.getElementById('fiche-content').appendChild(newSection);
  newSection.addEventListener('input', () => localStorage.setItem(id, newSection.innerHTML));
});


  // Déplacement des sections (drag & drop)
  let draggedSection = null;

  document.addEventListener('dragstart', e => {
    if (e.target.classList.contains('card')) {
      draggedSection = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
    }
  });

  document.addEventListener('dragend', e => {
    if (draggedSection) {
      draggedSection.style.opacity = '1';
      draggedSection = null;
    }
  });

  document.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.card');
    const container = document.getElementById('fiche-content');
    if (target && draggedSection && target !== draggedSection) {
      const rect = target.getBoundingClientRect();
      const next = e.clientY > rect.top + rect.height / 2;
      container.insertBefore(draggedSection, next ? target.nextSibling : target);
    }
  });

  // Rendre toutes les sections existantes draggables
  document.querySelectorAll('.card').forEach(section => {
    section.setAttribute('draggable', true);
  });
});
