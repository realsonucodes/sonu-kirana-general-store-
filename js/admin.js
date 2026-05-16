import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const addProductForm = document.getElementById('addProductForm');
const productTableBody = document.getElementById('productTableBody');
const addProductModal = document.getElementById('addProductModal');
const addOfferForm = document.getElementById('addOfferForm');
const offerTableBody = document.getElementById('offerTableBody');
const addOfferModal = document.getElementById('addOfferModal');

// Authentication Check (Security Rule)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace('login.html');
    } else {
        loadAdminProducts();
        loadAdminOffers();
        loadAdminMessages();
    }
});

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.replace('login.html');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    });
}

// Handle Sidebar Navigation
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('d-none');
        });

        const targetId = e.currentTarget.getAttribute('data-target');
        if (targetId) {
            document.getElementById(targetId).classList.remove('d-none');
        }
    });
});

// ==================== PRODUCTS ====================

async function loadAdminProducts() {
    try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            productTableBody.innerHTML = '';

            const totalProductsCountElem = document.getElementById('totalProductsCount');
            if (totalProductsCountElem) {
                totalProductsCountElem.textContent = productList.length;
            }

            if (productList.length === 0) {
                productTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No products found. Click "Add Product" to get started.</td></tr>';
                return;
            }

            productList.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="ps-4">
                        <div class="d-flex align-items-center">
                            <img src="${product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=80&h=80'}" 
                                 class="rounded me-3 object-fit-cover" width="40" height="40" alt=""
                                 onerror="this.onerror=null;this.src='https://placehold.co/50x50/28a745/FFF?text=P'">
                            <span class="fw-medium">${product.name}</span>
                        </div>
                    </td>
                    <td><span class="badge bg-light text-dark border">${product.category}</span></td>
                    <td>₹${product.price}</td>
                    <td class="text-truncate" style="max-width: 150px;">${product.description || '-'}</td>
                    <td class="pe-4 text-end">
                        <button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="${product.id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </td>
                `;
                productTableBody.appendChild(row);
            });

            // Add delete event listeners
            document.querySelectorAll('.delete-product-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (confirm('Are you sure you want to delete this product?')) {
                        const productId = e.currentTarget.getAttribute('data-id');
                        await handleDeleteProduct(productId);
                    }
                };
            });
        });

    } catch (error) {
        console.error("Error setting up product listener: ", error);
    }
}

if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = addProductForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Adding...';

        try {
            const newProduct = {
                name: document.getElementById('productName').value.trim(),
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                image: document.getElementById('productImage').value.trim(),
                description: document.getElementById('productDescription').value.trim(),
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "products"), newProduct);
            
            addProductForm.reset();
            const modalInstance = bootstrap.Modal.getOrCreateInstance(addProductModal);
            if (modalInstance) modalInstance.hide();
            
            await loadAdminProducts();
            showToast('Product added successfully!', 'success');

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error adding product: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Product';
        }
    });
}

async function handleDeleteProduct(productId) {
    try {
        await deleteDoc(doc(db, "products", productId));
        await loadAdminProducts();
        showToast('Product deleted.', 'danger');
    } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Error deleting product.");
    }
}

// ==================== OFFERS ====================

async function loadAdminOffers() {
    try {
        const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            const offerList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            offerTableBody.innerHTML = '';

            const totalOffersCountElem = document.getElementById('totalOffersCount');
            if (totalOffersCountElem) {
                totalOffersCountElem.textContent = offerList.length;
            }

            if (offerList.length === 0) {
                offerTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">No offers yet. Click "Add Offer" to create one.</td></tr>';
                return;
            }

            offerList.forEach(offer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="ps-4">
                        <img src="${offer.image || 'https://placehold.co/80x50/fd7e14/FFF?text=Offer'}" class="rounded object-fit-cover" width="80" height="50" alt="" onerror="this.src='https://placehold.co/80x50/dc3545/FFF?text=Err'">
                    </td>
                    <td><span class="fw-medium">${offer.title}</span></td>
                    <td>
                        ${offer.badge ? `<span class="badge bg-danger me-2">${offer.badge}</span>` : ''}
                        <span class="text-muted">${offer.desc}</span>
                    </td>
                    <td class="pe-4 text-end">
                        <button class="btn btn-sm btn-outline-danger delete-offer-btn" data-id="${offer.id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </td>
                `;
                offerTableBody.appendChild(row);
            });

            document.querySelectorAll('.delete-offer-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    if (confirm('Are you sure you want to delete this offer?')) {
                        const offerId = e.currentTarget.getAttribute('data-id');
                        await handleDeleteOffer(offerId);
                    }
                };
            });
        });

    } catch (error) {
        console.error("Error setting up offer listener: ", error);
    }
}

if (addOfferForm) {
    addOfferForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = addOfferForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Publishing...';

        try {
            const newOffer = {
                title: document.getElementById('offerTitle').value.trim(),
                desc: document.getElementById('offerDesc').value.trim(),
                badge: document.getElementById('offerBadge').value.trim(),
                image: document.getElementById('offerImage').value.trim(),
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "offers"), newOffer);

            addOfferForm.reset();
            const modalInstance = bootstrap.Modal.getOrCreateInstance(addOfferModal);
            if (modalInstance) modalInstance.hide();

            await loadAdminOffers();
            showToast('Offer published successfully!', 'warning');

        } catch (error) {
            console.error("Error adding offer: ", error);
            alert("Error adding offer: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Publish Offer';
        }
    });
}

async function handleDeleteOffer(offerId) {
    try {
        await deleteDoc(doc(db, "offers", offerId));
        await loadAdminOffers();
        showToast('Offer deleted.', 'danger');
    } catch (error) {
        console.error("Error deleting offer: ", error);
        alert("Error deleting offer.");
    }
}

// ==================== MESSAGES ====================

async function loadAdminMessages() {
    const messagesTableBody = document.getElementById('messagesTableBody');
    const unreadBadge = document.getElementById('unreadBadge');
    if (!messagesTableBody) return;

    try {
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const q = query(collection(db, 'messages'), orderBy('sentAt', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            const messageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Update unread badge and MARK AS READ if section is visible
            const unreadCount = messageList.filter(m => !m.read).length;
            const messagesSection = document.getElementById('messages-section');
            const isSectionVisible = messagesSection && !messagesSection.classList.contains('d-none');

            if (unreadBadge) {
                if (unreadCount > 0) {
                    unreadBadge.textContent = unreadCount;
                    unreadBadge.style.display = 'block';
                    
                    // If user is currently looking at messages, mark them all as read
                    if (isSectionVisible) {
                        messageList.forEach(async (msg) => {
                            if (!msg.read) {
                                try {
                                    await updateDoc(doc(db, "messages", msg.id), { read: true });
                                } catch (e) { console.error("Error marking read:", e); }
                            }
                        });
                    }
                } else {
                    unreadBadge.style.display = 'none';
                }
            }

            messagesTableBody.innerHTML = '';

            if (messageList.length === 0) {
                messagesTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">No messages yet.</td></tr>';
                return;
            }

            messageList.forEach(msg => {
                const date = new Date(msg.sentAt).toLocaleString();
                const row = document.createElement('tr');
                row.className = msg.read ? '' : 'table-light'; // Highlight unread
                row.innerHTML = `
                    <td class="ps-4 fw-medium">${msg.name} ${msg.read ? '' : '<span class="badge bg-primary ms-1" style="font-size:0.6rem">NEW</span>'}</td>
                    <td><a href="tel:${msg.phone}" class="text-decoration-none">${msg.phone}</a></td>
                    <td style="max-width: 300px; white-space: normal;">${msg.message}</td>
                    <td class="small text-muted">${date}</td>
                    <td class="pe-4 text-end">
                        <button class="btn btn-sm btn-outline-danger delete-message-btn" data-id="${msg.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                messagesTableBody.appendChild(row);
            });

            // Add delete event listeners
            document.querySelectorAll('.delete-message-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm('Delete this message?')) {
                        await handleDeleteMessage(id);
                    }
                };
            });
        });

    } catch (error) {
        console.error("Error setting up message listener:", error);
        messagesTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error loading messages. Check Firestore rules.</td></tr>';
    }
}

async function handleDeleteMessage(messageId) {
    try {
        await deleteDoc(doc(db, "messages", messageId));
        await loadAdminMessages();
        showToast('Message deleted.', 'danger');
    } catch (error) {
        console.error("Error deleting message:", error);
    }
}

// Make globally available for the Refresh button
window.loadAdminMessages = loadAdminMessages;

// ==================== IMAGE PREVIEW FUNCTIONS ====================

// These are global so inline oninput handlers can call them
window.previewOfferImage = function(url) {
    const previewDiv = document.getElementById('offerImagePreview');
    const previewImg = document.getElementById('offerPreviewImg');
    if (!previewDiv || !previewImg) return;

    if (url && url.trim() !== '') {
        previewImg.src = url;
        previewImg.onerror = () => {
            previewImg.src = 'https://placehold.co/400x150/dc3545/FFF?text=Image+Not+Loading';
        };
        previewDiv.classList.remove('d-none');
    } else {
        previewDiv.classList.add('d-none');
    }
};

window.previewProductImage = function(url) {
    const previewDiv = document.getElementById('productImagePreview');
    const previewImg = document.getElementById('productPreviewImg');
    if (!previewDiv || !previewImg) return;

    if (url && url.trim() !== '') {
        previewImg.src = url;
        previewImg.onerror = () => {
            previewImg.src = 'https://placehold.co/400x150/dc3545/FFF?text=Image+Not+Loading';
        };
        previewDiv.classList.remove('d-none');
    } else {
        previewDiv.classList.add('d-none');
    }
};

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    const id = 'toast-' + Date.now();
    const colorMap = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning' };
    toastContainer.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-white ${colorMap[type] || 'bg-success'} border-0 rounded-3 shadow" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-medium">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);
    const toastEl = document.getElementById(id);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}
