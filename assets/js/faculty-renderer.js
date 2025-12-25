/**
 * Shared Faculty Renderer Script - Robust Version
 * Compatible with style.css .faculty-avatar definitions
 */

// 1. Define the Error Handler Function
window.handleImageError = function (img) {
    // Create the container div
    const iconDiv = document.createElement('div');

    // We keep the class so it inherits your global styling (shadows, etc.)
    iconDiv.className = 'faculty-avatar';

    // --- INLINE STYLES (These override style.css to ensure perfect shape) ---

    // 1. Force Flexbox to center the FontAwesome icon (Overrides display:block in CSS)
    iconDiv.style.display = 'flex';
    iconDiv.style.alignItems = 'center';
    iconDiv.style.justifyContent = 'center';

    // 2. Enforce strict dimensions (Prevents "rectangle" stretching)
    iconDiv.style.width = '80px';
    iconDiv.style.height = '80px';
    iconDiv.style.minWidth = '80px'; // Vital for responsive tables

    // 3. Visuals
    // Uses your CSS variable --primary if available, else falls back to blue
    iconDiv.style.background = 'rgba(59, 130, 246, 0.1)';
    iconDiv.style.color = 'var(--primary, #3b82f6)';
    iconDiv.style.fontSize = '2.5rem';

    // 4. Shape & Position
    iconDiv.style.borderRadius = '50%';
    iconDiv.style.margin = '0 auto';

    // 5. Border Handling
    // Your CSS adds a border to .faculty-avatar. 
    // If you want the icon to have ONLY the background, uncomment the line below:
    // iconDiv.style.border = 'none'; 

    // Insert the Icon
    iconDiv.innerHTML = '<i class="fa-solid fa-user-doctor"></i>';

    // Replace the broken image tag with this new icon div
    if (img && img.parentNode) {
        img.parentNode.replaceChild(iconDiv, img);
    }
};

// 2. Define the Render Function
function renderFacultyTable(data, targetId = 'faculty-table-body') {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;

    if (!data || !Array.isArray(data)) {
        console.error("Faculty data is missing or invalid.");
        return;
    }

    let html = '';
    data.forEach((member, index) => {
        // Basic image naming convention: 1.jpg, 2.jpg...
        const photoFileName = `${member.srno}.jpg`;

        // Logic for Registration Numbers
        let regDisplay = '';
        if (member.ugReg && member.ugReg !== '' && member.ugReg !== '-') {
            regDisplay += `<span class="reg-label">UG:</span>${member.ugReg}`;
        }
        if (member.pgReg && member.pgReg !== '') {
            if (regDisplay !== '') regDisplay += '<br>';
            regDisplay += `<span class="reg-label">PG:</span>${member.pgReg}`;
        }
        if (regDisplay === '') regDisplay = '-';

        html += `
          <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td class="photo-col" style="text-align: center;">
                  <img 
                      src="${photoFileName}" 
                      alt="${member.name}" 
                      class="faculty-avatar"
                      style="object-fit: cover;" 
                      onerror="handleImageError(this)"
                  >
              </td>
              <td style="font-weight:600; color:var(--text-main);">${member.name}</td>
              <td>${member.designation}</td>
              <td>${member.qual}</td>
              <td style="line-height:1.6;">${regDisplay}</td>
          </tr>
      `;
    });

    tbody.innerHTML = html;
}