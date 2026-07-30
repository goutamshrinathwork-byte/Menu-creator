let menuData = {
    restaurantName: '',
    tagline: '',
    address: '',
    phone: '',
    currency: '$',
    theme: 'classic',
    categories: []
};

let categoryIdCounter = 0;
let itemIdCounter = 0;

const builderPage = document.getElementById('builder-page');
const previewPage = document.getElementById('preview-page');
const categoriesContainer = document.getElementById('categories-container');
const addCategoryBtn = document.getElementById('add-category-btn');
const makeMenuBtn = document.getElementById('make-menu-btn');
const backBtn = document.getElementById('back-btn');
const printBtn = document.getElementById('print-btn');
const downloadBtn = document.getElementById('download-btn');
const totalCategoriesCount = document.getElementById('total-categories-count');
const totalItemsCount = document.getElementById('total-items-count');
const menuPreviewContainer = document.getElementById('menu-preview-container');

addCategoryBtn.addEventListener('click', () => addCategory());
makeMenuBtn.addEventListener('click', generateMenu);
backBtn.addEventListener('click', () => switchPage('builder'));
printBtn.addEventListener('click', () => window.print());
downloadBtn.addEventListener('click', downloadAsPDF);
document.getElementById('load-demo-btn').addEventListener('click', loadDemoData);

document.getElementById('restaurant-name').addEventListener('input', updateCounts);
document.getElementById('currency-symbol').addEventListener('change', updateCurrencyLabels);

document.getElementById('save-menu-btn').addEventListener('click', saveToLocalStorage);
document.getElementById('load-menu-btn').addEventListener('click', loadFromLocalStorage);
document.getElementById('export-json-btn').addEventListener('click', exportAsJSON);
document.getElementById('import-json-btn').addEventListener('click', importFromJSON);
document.getElementById('stats-btn').addEventListener('click', showDetailedStats);
document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
document.getElementById('help-btn').addEventListener('click', showKeyboardShortcuts);

const costPercentage = document.getElementById('cost-percentage');
const itemCost = document.getElementById('item-cost');
const suggestedPrice = document.getElementById('suggested-price');

function calculatePrice() {
    const cost = parseFloat(itemCost.value) || 0;
    const percentage = parseFloat(costPercentage.value) || 30;
    const price = cost / (percentage / 100);
    const currency = document.getElementById('currency-symbol').value;
    suggestedPrice.textContent = `${currency}${price.toFixed(2)}`;
}

costPercentage.addEventListener('input', calculatePrice);
itemCost.addEventListener('input', calculatePrice);

function addCategory(data = null) {
    removeEmptyState();
    
    const template = document.getElementById('category-template');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.category-card');
    
    const catId = ++categoryIdCounter;
    card.dataset.categoryId = catId;

    if (data) {
        card.querySelector('.category-name-input').value = data.name || '';
        card.querySelector('.category-desc-input').value = data.description || '';
        card.querySelector('.current-icon').textContent = data.icon || '🍴';
    }

    const iconBtn = card.querySelector('.current-icon');
    const iconDropdown = card.querySelector('.icon-dropdown');
    
    iconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.icon-dropdown').forEach(d => {
            if (d !== iconDropdown) d.classList.add('hidden');
        });
        iconDropdown.classList.toggle('hidden');
    });

    iconDropdown.querySelectorAll('span').forEach(span => {
        span.addEventListener('click', (e) => {
            e.stopPropagation();
            iconBtn.textContent = span.dataset.icon;
            iconDropdown.classList.add('hidden');
        });
    });

    document.addEventListener('click', () => {
        iconDropdown.classList.add('hidden');
    });

    const collapseBtn = card.querySelector('.btn-collapse');
    const categoryBody = card.querySelector('.category-body');
    const categoryDesc = card.querySelector('.category-description');
    
    collapseBtn.addEventListener('click', () => {
        categoryBody.classList.toggle('collapsed');
        categoryDesc.classList.toggle('collapsed');
        collapseBtn.textContent = categoryBody.classList.contains('collapsed') ? '▶' : '▼';
    });

    card.querySelector('.btn-delete-category').addEventListener('click', () => {
        if (confirm('Delete this category and all its items?')) {
            card.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => {
                card.remove();
                updateCounts();
                if (categoriesContainer.children.length === 0) {
                    showEmptyState();
                }
            }, 280);
        }
    });

    card.querySelector('.btn-duplicate-category').addEventListener('click', () => {
        duplicateCategory(card);
    });

    card.querySelector('.btn-add-item').addEventListener('click', () => {
        addItem(card);
    });

    card.querySelector('.category-name-input').addEventListener('input', () => {
        updateCounts();
        debouncedSave();
    });

    card.querySelector('.category-desc-input').addEventListener('input', debouncedSave);

    makeCategoryDraggable(card);

    categoriesContainer.appendChild(clone);

    if (!data || (data.items && data.items.length === 0)) {
        addItem(card);
    }

    if (data && data.items) {
        data.items.forEach(item => addItem(card, item));
    }

    updateCounts();
    
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.querySelector('.category-name-input').focus();
    }, 100);
}

function addItem(categoryCard, data = null) {
    const template = document.getElementById('item-template');
    const clone = template.content.cloneNode(true);
    const itemCard = clone.querySelector('.item-card');
    
    const itemId = ++itemIdCounter;
    itemCard.dataset.itemId = itemId;

    const currency = document.getElementById('currency-symbol').value;
    itemCard.querySelector('.currency-label').textContent = currency;

    if (data) {
        itemCard.querySelector('.item-name-input').value = data.name || '';
        itemCard.querySelector('.item-desc-input').value = data.description || '';
        itemCard.querySelector('.item-price-input').value = data.price || '';
        if (data.tags) {
            if (data.tags.veg) itemCard.querySelector('.tag-veg').checked = true;
            if (data.tags.spicy) itemCard.querySelector('.tag-spicy').checked = true;
            if (data.tags.popular) itemCard.querySelector('.tag-popular').checked = true;
            if (data.tags.new) itemCard.querySelector('.tag-new').checked = true;
        }
    }

    itemCard.querySelector('.btn-delete-item').addEventListener('click', () => {
        itemCard.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            itemCard.remove();
            updateCounts();
            updateItemCountBadge(categoryCard);
        }, 280);
    });

    ['item-name-input', 'item-desc-input', 'item-price-input'].forEach(className => {
        const input = itemCard.querySelector('.' + className);
        if (input) {
            input.addEventListener('input', () => {
                updateCounts();
                updateItemCountBadge(categoryCard);
                debouncedSave();
            });
        }
    });

    itemCard.querySelectorAll('.tag-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', debouncedSave);
    });

    const itemsList = categoryCard.querySelector('.items-list');
    itemsList.appendChild(clone);
    
    updateCounts();
    updateItemCountBadge(categoryCard);

    if (!data) {
        setTimeout(() => {
            itemCard.querySelector('.item-name-input').focus();
        }, 100);
    }
}

function updateItemCountBadge(categoryCard) {
    const items = categoryCard.querySelectorAll('.item-card');
    const badge = categoryCard.querySelector('.item-count-badge');
    const count = items.length;
    badge.textContent = `${count} item${count !== 1 ? 's' : ''}`;
}

function updateCurrencyLabels() {
    const currency = document.getElementById('currency-symbol').value;
    document.querySelectorAll('.currency-label').forEach(label => {
        label.textContent = currency;
    });
    calculatePrice();
}

function updateCounts() {
    const categories = document.querySelectorAll('.category-card');
    const items = document.querySelectorAll('.item-card');
    
    totalCategoriesCount.textContent = categories.length;
    totalItemsCount.textContent = items.length;
}

function collectMenuData() {
    const data = {
        restaurantName: document.getElementById('restaurant-name').value.trim(),
        tagline: document.getElementById('restaurant-tagline').value.trim(),
        address: document.getElementById('restaurant-address').value.trim(),
        phone: document.getElementById('restaurant-phone').value.trim(),
        currency: document.getElementById('currency-symbol').value,
        theme: document.getElementById('menu-theme').value,
        categories: []
    };

    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        const category = {
            name: card.querySelector('.category-name-input').value.trim(),
            description: card.querySelector('.category-desc-input').value.trim(),
            icon: card.querySelector('.current-icon').textContent,
            items: []
        };

        const itemCards = card.querySelectorAll('.item-card');
        itemCards.forEach(itemCard => {
            const item = {
                name: itemCard.querySelector('.item-name-input').value.trim(),
                description: itemCard.querySelector('.item-desc-input').value.trim(),
                price: parseFloat(itemCard.querySelector('.item-price-input').value) || 0,
                tags: {
                    veg: itemCard.querySelector('.tag-veg').checked,
                    spicy: itemCard.querySelector('.tag-spicy').checked,
                    popular: itemCard.querySelector('.tag-popular').checked,
                    new: itemCard.querySelector('.tag-new').checked
                }
            };
            
            if (item.name) {
                category.items.push(item);
            }
        });

        if (category.name || category.items.length > 0) {
            data.categories.push(category);
        }
    });

    return data;
}
function validateData(data) {
    if (!data.restaurantName) {
        showToast('Please enter a restaurant name!', 'error');
        document.getElementById('restaurant-name').focus();
        return false;
    }

    if (data.categories.length === 0) {
        showToast('Please add at least one category with items!', 'error');
        return false;
    }

    let hasItems = false;
    data.categories.forEach(cat => {
        if (cat.items.length > 0) hasItems = true;
    });

    if (!hasItems) {
        showToast('Please add at least one menu item!', 'error');
        return false;
    }

    return true;
}

function generateMenu() {
    const data = collectMenuData();
    
    if (!validateData(data)) return;

    menuData = data;
    const theme = data.theme;

    let html = `<div class="menu-page theme-${theme}">`;

    html += `<div class="menu-header-section">`;
    html += `<div class="menu-restaurant-name">${escapeHtml(data.restaurantName)}</div>`;
    
    if (data.tagline) {
        html += `<div class="menu-restaurant-tagline">${escapeHtml(data.tagline)}</div>`;
    }
    
    html += `<div class="menu-divider-ornament">✦ MENU ✦</div>`;
    html += `</div>`;

    html += `<div class="menu-body-section">`;

    data.categories.forEach(category => {
        if (!category.name && category.items.length === 0) return;

        html += `<div class="menu-category-block">`;
        
        if (category.name) {
            html += `<div class="menu-category-title">${category.icon ? category.icon + ' ' : ''}${escapeHtml(category.name)}</div>`;
        }

        if (category.description) {
            html += `<div class="menu-category-desc">${escapeHtml(category.description)}</div>`;
        }

        html += `<div class="menu-category-divider"><span>✦</span></div>`;

        category.items.forEach(item => {
            html += `<div class="menu-item-row">`;
            html += `<div class="menu-item-left">`;
            html += `<div class="menu-item-name-line">`;
            html += `<span class="menu-item-name">${escapeHtml(item.name)}</span>`;
            html += `<span class="menu-item-dots"></span>`;
            html += `</div>`;

            if (item.description) {
                html += `<div class="menu-item-description">${escapeHtml(item.description)}</div>`;
            }

            const tags = [];
            if (item.tags.veg) tags.push('<span class="menu-item-tag tag-veg">🌱 Vegetarian</span>');
            if (item.tags.spicy) tags.push('<span class="menu-item-tag tag-spicy">🌶️ Spicy</span>');
            if (item.tags.popular) tags.push('<span class="menu-item-tag tag-popular">⭐ Popular</span>');
            if (item.tags.new) tags.push('<span class="menu-item-tag tag-new">🆕 New</span>');
            
            if (tags.length > 0) {
                html += `<div class="menu-item-tags">${tags.join('')}</div>`;
            }

            html += `</div>`;

            if (item.price > 0) {
                html += `<span class="menu-item-price">${data.currency}${item.price.toFixed(2)}</span>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
    });

    html += `</div>`;

    html += `<div class="menu-footer-section">`;
    if (data.address) {
        html += `<p>📍 ${escapeHtml(data.address)}</p>`;
    }
    if (data.phone) {
        html += `<p>📞 ${escapeHtml(data.phone)}</p>`;
    }
    html += `<p style="margin-top: 10px; opacity: 0.7;">Thank you for dining with us!</p>`;
    html += `</div>`;

    html += `</div>`;

    menuPreviewContainer.innerHTML = html;
    switchPage('preview');
    showToast('Menu generated successfully! 🎉', 'success');
}

function switchPage(page) {
    if (page === 'preview') {
        builderPage.classList.remove('active');
        previewPage.classList.add('active');
        document.getElementById('floating-toolbar').style.display = 'none';
        window.scrollTo(0, 0);
    } else {
        previewPage.classList.remove('active');
        builderPage.classList.add('active');
        document.getElementById('floating-toolbar').style.display = 'flex';
        window.scrollTo(0, 0);
    }
}

function downloadAsPDF() {
    showToast('Opening print dialog. Select "Save as PDF" as the printer.', 'success');
    setTimeout(() => {
        window.print();
    }, 500);
}

function saveToLocalStorage() {
    const data = collectMenuData();
    localStorage.setItem('menuMakerData', JSON.stringify(data));
    localStorage.setItem('menuMakerTimestamp', new Date().toISOString());
    showToast('Menu saved! 💾', 'success');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('menuMakerData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            loadMenuData(data);
            const timestamp = localStorage.getItem('menuMakerTimestamp');
            if (timestamp) {
                const date = new Date(timestamp);
                showToast(`Loaded from ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 'success');
            }
        } catch (e) {
            showToast('Error loading saved data', 'error');
        }
    } else {
        showToast('No saved menu found', 'error');
    }
}

function loadMenuData(data) {
    categoriesContainer.innerHTML = '';
    categoryIdCounter = 0;
    itemIdCounter = 0;

    document.getElementById('restaurant-name').value = data.restaurantName || '';
    document.getElementById('restaurant-tagline').value = data.tagline || '';
    document.getElementById('restaurant-address').value = data.address || '';
    document.getElementById('restaurant-phone').value = data.phone || '';
    document.getElementById('currency-symbol').value = data.currency || '$';
    document.getElementById('menu-theme').value = data.theme || 'classic';

    updateCurrencyLabels();

    if (data.categories && data.categories.length > 0) {
        data.categories.forEach(cat => addCategory(cat));
    } else {
        showEmptyState();
    }

    updateCounts();
}

let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const categories = document.querySelectorAll('.category-card');
        if (categories.length > 0) {
            const data = collectMenuData();
            localStorage.setItem('menuMakerData', JSON.stringify(data));
        }
    }, 2000);
}

setInterval(() => {
    const categories = document.querySelectorAll('.category-card');
    if (categories.length > 0) {
        const data = collectMenuData();
        localStorage.setItem('menuMakerData', JSON.stringify(data));
    }
}, 30000);

function exportAsJSON() {
    const data = collectMenuData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.restaurantName || 'menu'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Menu exported! 📦', 'success');
}

function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    loadMenuData(data);
                    showToast('Menu imported! 📥', 'success');
                } catch (error) {
                    showToast('Error importing file', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function duplicateCategory(categoryCard) {
    const data = {
        name: categoryCard.querySelector('.category-name-input').value + ' (Copy)',
        description: categoryCard.querySelector('.category-desc-input').value,
        icon: categoryCard.querySelector('.current-icon').textContent,
        items: []
    };

    const itemCards = categoryCard.querySelectorAll('.item-card');
    itemCards.forEach(itemCard => {
        const item = {
            name: itemCard.querySelector('.item-name-input').value,
            description: itemCard.querySelector('.item-desc-input').value,
            price: parseFloat(itemCard.querySelector('.item-price-input').value) || 0,
            tags: {
                veg: itemCard.querySelector('.tag-veg').checked,
                spicy: itemCard.querySelector('.tag-spicy').checked,
                popular: itemCard.querySelector('.tag-popular').checked,
                new: itemCard.querySelector('.tag-new').checked
            }
        };
        data.items.push(item);
    });

    addCategory(data);
    showToast('Category duplicated! 📋', 'success');
}

let draggedElement = null;

function makeCategoryDraggable(categoryCard) {
    categoryCard.setAttribute('draggable', 'true');
    
    categoryCard.addEventListener('dragstart', () => {
        categoryCard.classList.add('dragging');
        draggedElement = categoryCard;
    });
    
    categoryCard.addEventListener('dragend', () => {
        categoryCard.classList.remove('dragging');
        draggedElement = null;
    });
}

categoriesContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(categoriesContainer, e.clientY);
    if (draggedElement) {
        if (afterElement == null) {
            categoriesContainer.appendChild(draggedElement);
        } else {
            categoriesContainer.insertBefore(draggedElement, afterElement);
        }
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.category-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function showDetailedStats() {
    const data = collectMenuData();
    
    let totalItems = 0;
    let totalPrice = 0;
    let vegCount = 0;
    let spicyCount = 0;
    let popularCount = 0;
    let newCount = 0;

    data.categories.forEach(cat => {
        cat.items.forEach(item => {
            totalItems++;
            totalPrice += item.price;
            if (item.tags.veg) vegCount++;
            if (item.tags.spicy) spicyCount++;
            if (item.tags.popular) popularCount++;
            if (item.tags.new) newCount++;
        });
    });

    const avgPrice = totalItems > 0 ? (totalPrice / totalItems).toFixed(2) : 0;

    const statsHTML = `
        <div class="stats-modal-overlay" id="stats-modal" onclick="if(event.target.id==='stats-modal') this.remove()">
            <div class="stats-modal">
                <div class="stats-modal-header">
                    <h2>📊 Menu Statistics</h2>
                    <button class="btn-close-modal" onclick="document.getElementById('stats-modal').remove()">✕</button>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📁</div>
                        <div class="stat-value">${data.categories.length}</div>
                        <div class="stat-label">Categories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🍽️</div>
                        <div class="stat-value">${totalItems}</div>
                        <div class="stat-label">Total Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-value">${data.currency}${avgPrice}</div>
                        <div class="stat-label">Average Price</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌱</div>
                        <div class="stat-value">${vegCount}</div>
                        <div class="stat-label">Vegetarian</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌶️</div>
                        <div class="stat-value">${spicyCount}</div>
                        <div class="stat-label">Spicy Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${popularCount}</div>
                        <div class="stat-label">Popular</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🆕</div>
                        <div class="stat-value">${newCount}</div>
                        <div class="stat-label">New Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-value">${data.currency}${totalPrice.toFixed(2)}</div>
                        <div class="stat-label">Total Value</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', statsHTML);
}

function showKeyboardShortcuts() {
    const shortcuts = `
        <div class="shortcuts-modal-overlay" id="shortcuts-modal" onclick="if(event.target.id==='shortcuts-modal') this.remove()">
            <div class="shortcuts-modal">
                <div class="shortcuts-modal-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="btn-close-modal" onclick="document.getElementById('shortcuts-modal').remove()">✕</button>
                </div>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <div><kbd>Ctrl</kbd> + <kbd>Enter</kbd></div>
                        <span>Generate Menu</span>
                    </div>
                    <div class="shortcut-item">
                        <div><kbd>Ctrl</kbd> + <kbd>S</kbd></div>
                        <span>Save Menu</span>
                    </div>
                    <div class="shortcut-item">
                        <div><kbd>Ctrl</kbd> + <kbd>E</kbd></div>
                        <span>Export JSON</span>
                    </div>
                    <div class="shortcut-item">
                        <div><kbd>Esc</kbd></div>
                        <span>Go Back / Close</span>
                    </div>
                    <div class="shortcut-item">
                        <div><kbd>Ctrl</kbd> + <kbd>P</kbd></div>
                        <span>Print Menu</span>
                    </div>
                    <div class="shortcut-item">
                        <div><kbd>?</kbd></div>
                        <span>Show This Help</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const existing = document.getElementById('shortcuts-modal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', shortcuts);
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (builderPage.classList.contains('active')) {
            generateMenu();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportAsJSON();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && previewPage.classList.contains('active')) {
        e.preventDefault();
        window.print();
    }
    
    if (e.key === '?' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        showKeyboardShortcuts();
    }
    
    if (e.key === 'Escape') {
        if (previewPage.classList.contains('active')) {
            switchPage('builder');
        }
        document.querySelectorAll('.stats-modal-overlay, .shortcuts-modal-overlay').forEach(m => m.remove());
    }
});

function clearAllData() {
    if (confirm('⚠️ Clear all data? This cannot be undone!')) {
        categoriesContainer.innerHTML = '';
        document.getElementById('restaurant-name').value = '';
        document.getElementById('restaurant-tagline').value = '';
        document.getElementById('restaurant-address').value = '';
        document.getElementById('restaurant-phone').value = '';
        document.getElementById('currency-symbol').value = '$';
        document.getElementById('menu-theme').value = 'classic';
        localStorage.removeItem('menuMakerData');
        localStorage.removeItem('menuMakerTimestamp');
        categoryIdCounter = 0;
        itemIdCounter = 0;
        showEmptyState();
        updateCounts();
        showToast('All data cleared! 🗑️', 'success');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showEmptyState() {
    if (categoriesContainer.children.length === 0) {
        categoriesContainer.innerHTML = `
            <div class="empty-state" id="empty-state">
                <span class="empty-state-icon">📋</span>
                <h3>No categories yet</h3>
                <p>Click "Add New Category" below to start building your menu!</p>
            </div>
        `;
    }
}

function removeEmptyState() {
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.remove();
}

function loadDemoData() {
    categoriesContainer.innerHTML = '';
    categoryIdCounter = 0;
    itemIdCounter = 0;

    document.getElementById('restaurant-name').value = 'The Golden Fork';
    document.getElementById('restaurant-tagline').value = 'Fine Dining Since 1985';
    document.getElementById('restaurant-address').value = '123 Gourmet Avenue, New York, NY 10001';
    document.getElementById('restaurant-phone').value = '(555) 123-4567';

    addCategory({
        name: 'Appetizers',
        description: 'Start your meal with our carefully crafted starters',
        icon: '🥗',
        items: [
            { name: 'Bruschetta al Pomodoro', description: 'Toasted bread topped with fresh tomatoes, basil, and garlic', price: 12.99, tags: { veg: true, spicy: false, popular: true, new: false } },
            { name: 'Spicy Tuna Tartare', description: 'Fresh ahi tuna with avocado, sesame, and spicy mayo', price: 16.99, tags: { veg: false, spicy: true, popular: false, new: true } },
            { name: 'Soup of the Day', description: 'Ask your server for today\'s selection', price: 9.99, tags: { veg: false, spicy: false, popular: false, new: false } }
        ]
    });

    addCategory({
        name: 'Main Courses',
        description: 'Our signature dishes prepared with the finest ingredients',
        icon: '🥩',
        items: [
            { name: 'Grilled Ribeye Steak', description: '12oz premium cut with roasted vegetables and red wine jus', price: 38.99, tags: { veg: false, spicy: false, popular: true, new: false } },
            { name: 'Pan-Seared Salmon', description: 'Atlantic salmon with lemon butter sauce and asparagus', price: 32.99, tags: { veg: false, spicy: false, popular: true, new: false } },
            { name: 'Wild Mushroom Risotto', description: 'Arborio rice with porcini, truffle oil, and parmesan', price: 26.99, tags: { veg: true, spicy: false, popular: false, new: false } },
            { name: 'Spicy Thai Curry', description: 'Red curry with coconut milk, vegetables, and jasmine rice', price: 24.99, tags: { veg: true, spicy: true, popular: false, new: true } }
        ]
    });

    addCategory({
        name: 'Desserts',
        description: 'Indulge in our sweet creations',
        icon: '🍰',
        items: [
            { name: 'Tiramisu', description: 'Classic Italian dessert with mascarpone and espresso', price: 11.99, tags: { veg: true, spicy: false, popular: true, new: false } },
            { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center and vanilla ice cream', price: 13.99, tags: { veg: true, spicy: false, popular: true, new: false } },
            { name: 'Crème Brûlée', description: 'Classic French vanilla custard with caramelized sugar', price: 10.99, tags: { veg: true, spicy: false, popular: false, new: false } }
        ]
    });

    addCategory({
        name: 'Beverages',
        description: 'Refreshing drinks and fine wines',
        icon: '🍷',
        items: [
            { name: 'Artisan Lemonade', description: 'Fresh-squeezed with mint and honey', price: 6.99, tags: { veg: true, spicy: false, popular: false, new: true } },
            { name: 'Espresso', description: 'Double shot Italian espresso', price: 4.99, tags: { veg: true, spicy: false, popular: true, new: false } },
            { name: 'House Red Wine', description: 'Cabernet Sauvignon, Napa Valley', price: 12.99, tags: { veg: true, spicy: false, popular: false, new: false } }
        ]
    });

    updateCounts();
    showToast('Demo menu loaded! Feel free to edit it.', 'success');
}

function init() {
    showEmptyState();
    
    const saved = localStorage.getItem('menuMakerData');
    if (saved) {
        setTimeout(() => {
            if (confirm('Found a saved menu. Would you like to load it?')) {
                loadFromLocalStorage();
            }
        }, 500);
    }
}

init();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('Service Worker registered:', reg.scope))
            .catch((err) => console.warn('Service Worker registration failed:', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showToast('📲 Tap "Install App" or "Add to Home Screen" in your browser menu!', 'success');
});
