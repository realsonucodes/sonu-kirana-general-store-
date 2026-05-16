import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async function() {

    // ─── Hero Carousel Auto-Scroll (Manual Bootstrap Init) ───────────────────
    const heroCarouselEl = document.getElementById('heroCarousel');
    if (heroCarouselEl) {
        // Force start carousel with interval
        const carousel = new bootstrap.Carousel(heroCarouselEl, {
            interval: 4000,
            ride: 'carousel',
            wrap: true,
            pause: false
        });
        carousel.cycle();
    }

    // ─── Smooth Scrolling for Navigation Links ────────────────────────────────
    document.querySelectorAll('a.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    // ─── Update Active Nav Link on Scroll ────────────────────────────────────
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        let current = '';
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - navbarHeight - 50) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ─── Contact Form — Save to Firestore ────────────────────────────────────
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Collect values
            const nameVal   = contactForm.querySelector('input[type="text"]').value.trim();
            const phoneVal  = contactForm.querySelector('input[type="tel"]').value.trim();
            const msgVal    = contactForm.querySelector('textarea').value.trim();

            if (!nameVal || !phoneVal || !msgVal) {
                alert('Sabh fields fill karein.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

            try {
                await addDoc(collection(db, "messages"), {
                    name: nameVal,
                    phone: phoneVal,
                    message: msgVal,
                    sentAt: new Date().toISOString(),
                    read: false
                });

                console.log("Message saved successfully!");
                contactForm.reset();
                
                // Show success banner
                const banner = document.getElementById('contactSuccessBanner');
                if (banner) {
                    banner.classList.remove('d-none');
                    setTimeout(() => banner.classList.add('d-none'), 5000);
                }
            } catch (err) {
                console.error("Error saving message:", err);
                alert('Message send karne mein error aayi: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // ─── Load Products from Firestore ─────────────────────────────────────────
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        loadProducts(productsGrid);
    }

    // ─── Load Offers from Firestore ───────────────────────────────────────────
    const offersSection = document.getElementById('dynamic-offers-container');
    if (offersSection) {
        loadOffers(offersSection);
    }
});

// ==================== PRODUCTS ====================

function loadProducts(gridContainer) {
    try {
        const q = query(collection(db, 'products'));
        
        onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            gridContainer.innerHTML = '';

            if (productList.length === 0) {
                renderFallbackProducts(gridContainer);
                return;
            }

            productList.forEach(product => {
                const productHTML = createProductCardHTML(product);
                gridContainer.insertAdjacentHTML('beforeend', productHTML);
            });
        }, (error) => {
            console.error("Error with products real-time listener:", error);
            gridContainer.innerHTML = '';
            renderFallbackProducts(gridContainer);
        });

    } catch (error) {
        console.error("Error setting up product listener:", error);
        gridContainer.innerHTML = '';
        renderFallbackProducts(gridContainer);
    }
}

function renderFallbackProducts(gridContainer) {
    const fallbackProducts = [
        { 
            name: "Premium Basmati Rice", price: "450", category: "Atta & Rice", 
            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400&h=300",
            description: "High quality long grain basmati rice."
        },
        { 
            name: "Aashirvaad Atta", price: "320", category: "Atta & Rice", 
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=300",
            description: "100% pure whole wheat flour."
        },
        { 
            name: "White Sugar", price: "45", category: "Daily Essentials", 
            image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400&h=300",
            description: "Pure and refined white sugar."
        },
        { 
            name: "Fortune Cooking Oil", price: "145", category: "Oil & Ghee", 
            image: "https://images.unsplash.com/photo-1474979266404-7eaacbadcbaf?auto=format&fit=crop&q=80&w=400&h=300",
            description: "Healthy and refined soyabean oil."
        }
    ];
    fallbackProducts.forEach(product => {
        gridContainer.insertAdjacentHTML('beforeend', createProductCardHTML(product));
    });
}

function createProductCardHTML(product) {
    const defaultImg = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300";
    const imageUrl = product.image && product.image.trim() !== '' ? product.image : defaultImg;
    const descriptionHTML = product.description ? `<p class="card-text text-muted mb-2" style="font-size: 0.8rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>` : '';
    
    return `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden product-card transition-up d-flex flex-column">
                <div class="position-relative overflow-hidden bg-white" style="height: 180px;">
                    <img src="${imageUrl}" 
                         onerror="this.onerror=null; this.src='${defaultImg}';" 
                         class="w-100 h-100" 
                         style="object-fit: cover;" 
                         alt="${product.name}">
                    <div class="position-absolute top-0 start-0 m-2 px-2 py-1 bg-success text-white rounded-2 fw-medium shadow-sm" style="z-index:2; font-size: 0.65rem;">
                        ${product.category}
                    </div>
                </div>
                <div class="card-body p-3 d-flex flex-column">
                    <h6 class="card-title fw-bold mb-1" style="font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</h6>
                    ${descriptionHTML}
                    <div class="mt-auto pt-2 d-flex justify-content-between align-items-center">
                        <span class="fs-5 fw-bolder text-success">₹${product.price}</span>
                        <button class="btn btn-sm btn-success rounded-pill px-3 shadow-sm d-none d-sm-block fw-medium">
                            Add <i class="bi bi-cart-plus ms-1"></i>
                        </button>
                        <button class="btn btn-sm btn-success rounded-circle shadow-sm d-sm-none d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                            <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// ==================== OFFERS ====================

function loadOffers(container) {
    try {
        const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
        
        // Show loading initially
        let isDataLoaded = false;
        
        // Set a timeout to show defaults if Firebase takes too long (> 5 seconds)
        const loadingTimeout = setTimeout(() => {
            if (!isDataLoaded) {
                console.warn("Offers loading timed out, showing defaults.");
                renderDefaultOffers(container);
            }
        }, 5000);

        onSnapshot(q, (snapshot) => {
            isDataLoaded = true;
            clearTimeout(loadingTimeout);
            const offerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            container.innerHTML = '';

            if (offerList.length === 0) {
                renderDefaultOffers(container);
                return;
            }

            offerList.forEach(offer => {
                container.insertAdjacentHTML('beforeend', createOfferCardHTML(offer));
            });
        }, (error) => {
            console.error("Error with offers real-time listener:", error);
            clearTimeout(loadingTimeout);
            renderDefaultOffers(container);
        });

    } catch (error) {
        console.error("Error setting up offers listener:", error);
        renderDefaultOffers(container);
    }
}

function renderDefaultOffers(container) {
    const defaultOffers = [
        {
            title: "Premium Basmati Rice",
            badge: "10% OFF",
            desc: "Atta & Rice",
            image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=600&h=400"
        },
        {
            title: "Assorted Biscuits",
            badge: "BUY 2 GET 1",
            desc: "Snacks & Biscuits",
            image: "https://images.unsplash.com/photo-1558961363-a0e2343fcbf4?auto=format&fit=crop&q=80&w=600&h=400"
        },
        {
            title: "Refined Cooking Oil",
            badge: "SPECIAL DISCOUNT",
            desc: "Oil & Ghee",
            image: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&q=80&w=600&h=400"
        }
    ];
    defaultOffers.forEach(offer => {
        container.insertAdjacentHTML('beforeend', createOfferCardHTML(offer));
    });
}


function createOfferCardHTML(offer) {
    const imageUrl = offer.image && offer.image.trim() !== ''
        ? offer.image
        : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&h=400";
    const badgeHTML = offer.badge
        ? `<div class="discount-badge pulse-animation position-absolute top-0 end-0 m-3 bg-danger text-white fw-bold px-3 py-2 rounded-pill" style="z-index:4;">${offer.badge}</div>`
        : '';

    return `
        <div class="col-md-4">
            <div class="offer-card position-relative rounded-4 overflow-hidden shadow-sm" style="min-height: 300px;">
                ${badgeHTML}
                <!-- Actual image fills the full card -->
                <img src="${imageUrl}"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&h=400';"
                     class="position-absolute top-0 start-0 w-100 h-100"
                     style="object-fit: cover; z-index: 0;"
                     alt="${offer.title}">
                <!-- Dark gradient overlay -->
                <div class="offer-overlay position-absolute top-0 start-0 w-100 h-100" style="z-index:1;"></div>
                <!-- Text content -->
                <div class="position-absolute bottom-0 start-0 w-100 p-4 text-white" style="z-index:2;">
                    <span class="badge bg-success mb-2">${offer.desc}</span>
                    <h4 class="fw-bold mb-3">${offer.title}</h4>
                    <button class="btn btn-warning rounded-pill text-white fw-medium shadow-sm shop-btn">
                        Shop Now <i class="bi bi-arrow-right ms-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}
