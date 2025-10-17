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

  // 🔄 Sauvegarde automatique
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    const key = el.id;
    if (localStorage.getItem(key)) el.innerHTML = localStorage.getItem(key);
    el.addEventListener('input', () => localStorage.setItem(key, el.innerHTML));
  });

  // 📄 Export PDF multi-pages
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
          el.style.backgroundColor = '#ffffff'; // <- fond blanc pour le PDF
          el.style.color = '#111';               // <- texte visible
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

  // 📌 Ajout dynamique de section
  const addSectionBtn = document.createElement('button');
  addSectionBtn.textContent = '➕ Ajouter une section';
  document.querySelector('.toolbar').appendChild(addSectionBtn);

  addSectionBtn.addEventListener('click', () => {
    const sectionType = prompt('Type de section ? (texte, liste, code, retenir)', 'texte');
    if (!sectionType) return;

    const newSection = document.createElement('section');
    newSection.classList.add('card');
    const id = 'section-' + Date.now(); // ID unique
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
      default:
        newSection.innerHTML += `<p>Votre contenu ici...</p>`;
    }

    document.getElementById('fiche-content').appendChild(newSection);

    // Sauvegarde automatique pour la nouvelle section
    newSection.addEventListener('input', () => localStorage.setItem(id, newSection.innerHTML));
  });
});
