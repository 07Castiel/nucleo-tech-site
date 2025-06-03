// Núcleo Tech - JavaScript Principal
// Autor: Leonardo Brito

// Configurações globais
const CONFIG = {
    particleCount: 50,
    animationDuration: 800,
    scrollOffset: 50,
    countUpSpeed: 2000
};

// Estado da aplicação
const appState = {
    isLoaded: false,
    isMobileMenuOpen: false,
    particles: [],
    observers: {},
    counters: {}
};

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Função principal de inicialização
function initializeApp() {
    console.log('🚀 Inicializando Núcleo Tech...');
    
    // Inicializar todas as funcionalidades
    createParticles();
    initializeNavigation();
    initializeScrollAnimations();
    initializeHeaderEffects();
    initializeContactForm();
    initializeCounters();
    initializeCursor();
    initializePerformanceOptimizations();
    
    // Marcar como carregado
    appState.isLoaded = true;
    console.log('✅ Núcleo Tech carregado com sucesso!');
}

// ================================
// SISTEMA DE PARTÍCULAS
// ================================
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    // Limpar partículas existentes
    particlesContainer.innerHTML = '';
    appState.particles = [];

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const particle = createSingleParticle();
        particlesContainer.appendChild(particle);
        appState.particles.push(particle);
    }

    console.log(`✨ ${CONFIG.particleCount} partículas criadas`);
}

function createSingleParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Configurações aleatórias
    const randomDelay = Math.random() * 20;
    const randomDuration = Math.random() * 10 + 10;
    const randomSize = Math.random() * 2 + 1;
    
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = randomDelay + 's';
    particle.style.animationDuration = randomDuration + 's';
    particle.style.width = randomSize + 'px';
    particle.style.height = randomSize + 'px';
    
    return particle;
}

// ================================
// NAVEGAÇÃO E MENU MOBILE
// ================================
function initializeNavigation() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
        
        // Fechar menu ao clicar em um link
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                closeMobileMenu();
            }
        });
    }

    // Navegação suave
    initializeSmoothScrolling();
}

function toggleMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    appState.isMobileMenuOpen = !appState.isMobileMenuOpen;
    
    mobileToggle.classList.toggle('active', appState.isMobileMenuOpen);
    navLinks.classList.toggle('active', appState.isMobileMenuOpen);
    
    // Prevenir scroll quando menu estiver aberto
    document.body.style.overflow = appState.isMobileMenuOpen ? 'hidden' : '';
}

function closeMobileMenu() {
    if (appState.isMobileMenuOpen) {
        toggleMobileMenu();
    }
}

function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ================================
// ANIMAÇÕES DE SCROLL
// ================================
function initializeScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    
    if (!elements.length) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    appState.observers.scrollAnimation = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animar contadores se for um elemento de estatística
                if (entry.target.querySelector('.stat-number')) {
                    animateCounters(entry.target);
                }
            }
        });
    }, observerOptions);

    elements.forEach(element => {
        appState.observers.scrollAnimation.observe(element);
    });

    console.log(`📱 ${elements.length} elementos configurados para animação`);
}

// ================================
// EFEITOS DO HEADER
// ================================
function initializeHeaderEffects() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let isScrolling = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;
        
        // Efeito de transparência
        if (currentScrollY > 100) {
            header.style.background = 'rgba(0, 0, 0, 0.95)';
            header.style.backdropFilter = 'blur(15px)';
        } else {
            header.style.background = 'rgba(0, 0, 0, 0.9)';
            header.style.backdropFilter = 'blur(10px)';
        }

        // Efeito de hide/show no scroll
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
        isScrolling = false;
    }

    window.addEventListener('scroll', function() {
        if (!isScrolling) {
            requestAnimationFrame(updateHeader);
            isScrolling = true;
        }
    });
}

// ================================
// SISTEMA DE CONTADORES
// ================================
function initializeCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        if (target) {
            appState.counters[stat] = {
                target: target,
                current: 0,
                isAnimated: false
            };
        }
    });
}

function animateCounters(container) {
    const statNumbers = container.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const counterData = appState.counters[stat];
        if (!counterData || counterData.isAnimated) return;

        counterData.isAnimated = true;
        animateNumber(stat, counterData.target);
    });
}

function animateNumber(element, target) {
    const duration = CONFIG.countUpSpeed;
    const start = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para suavizar a animação
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// ================================
// FORMULÁRIO DE CONTATO
// ================================
function initializeContactForm() {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form || !submitBtn) return;

    form.addEventListener('submit', handleFormSubmission);
    
    // Validação em tempo real
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('span');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Validar formulário
    if (!validateForm(form)) {
        showFormError('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Estado de loading
    setButtonState(submitBtn, 'loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'block';

    try {
        // Simular envio do formulário
        await simulateFormSubmission(new FormData(form));
        
        // Sucesso
        setButtonState(submitBtn, 'success');
        btnLoading.style.display = 'none';
        btnText.textContent = 'Mensagem Enviada!';
        btnText.style.display = 'block';
        
        // Reset após 3 segundos
        setTimeout(() => {
            resetForm(form, submitBtn, btnText);
        }, 3000);
        
        showFormSuccess('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        
    } catch (error) {
        // Erro
        setButtonState(submitBtn, 'error');
        btnLoading.style.display = 'none';
        btnText.textContent = 'Erro no Envio';
        btnText.style.display = 'block';
        
        setTimeout(() => {
            resetForm(form, submitBtn, btnText);
        }, 3000);
        
        showFormError('Erro ao enviar mensagem. Tente novamente.');
    }
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Este campo é obrigatório');
            isValid = false;
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
            showFieldError(field, 'Email inválido');
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'Este campo é obrigatório');
    } else if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        showFieldError(field, 'Email inválido');
    } else {
        clearFieldError(field);
    }
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#ff4444';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ff4444;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        animation: fadeIn 0.3s ease;
    `;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setButtonState(button, state) {
    button.className = `submit-btn ${state}`;
}

function resetForm(form, submitBtn, btnText) {
    form.reset();
    setButtonState(submitBtn, '');
    btnText.textContent = 'Enviar Mensagem';
    
    // Limpar erros
    const errorDivs = form.querySelectorAll('.field-error');
    errorDivs.forEach(div => div.remove());
}

function simulateFormSubmission(formData) {
    return new Promise((resolve, reject) => {
        // Simular latência de rede
        setTimeout(() => {
            // Simular 90% de sucesso
            if (Math.random() > 0.1) {
                console.log('📧 Formulário enviado:', Object.fromEntries(formData));
                resolve();
            } else {
                reject(new Error('Simulação de erro'));
            }
        }, 2000);
    });
}

function showFormSuccess(message) {
    showNotification(message, 'success');
}

function showFormError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        ${type === 'success' ? 'background: linear-gradient(45deg, #00ff88, #00cc66);' : 'background: linear-gradient(45deg, #ff4444, #cc3333);'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ================================
// CURSOR PERSONALIZADO
// ================================
function initializeCursor() {
    // Verificar se é dispositivo desktop
    if (window.innerWidth <= 768) return;
    
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        const diffX = mouseX - cursorX;
        const diffY = mouseY - cursorY;
        
        cursorX += diffX * 0.1;
        cursorY += diffY * 0.1;
        
        cursor.style.left = cursorX - 10 + 'px';
        cursor.style.top = cursorY - 10 + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();

    // Efeitos em elementos interativos
    const interactiveElements = document.querySelectorAll('a, button, .service-card, .tech-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.background = 'rgba(255, 0, 255, 0.3)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.background = 'rgba(0, 255, 255, 0.1)';
        });
    });
}

// ================================
// OTIMIZAÇÕES DE PERFORMANCE
// ================================
function initializePerformanceOptimizations() {
    // Lazy loading para imagens
    initializeLazyLoading();
    
    // Debounce para resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleWindowResize, 250);
    });
    
    // Preload de recursos críticos
    preloadCriticalResources();
}

function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if (images.length === 0) return;

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

function handleWindowResize() {
    // Recriar partículas se necessário
    if (window.innerWidth <= 768 && appState.particles.length > 20) {
        CONFIG.particleCount = 20;
        createParticles();
    } else if (window.innerWidth > 768 && appState.particles.length < 50) {
        CONFIG.particleCount = 50;
        createParticles();
    }
    
    // Fechar menu mobile se a tela aumentar
    if (window.innerWidth > 768 && appState.isMobileMenuOpen) {
        closeMobileMenu();
    }
}

function preloadCriticalResources() {
    // Preload de fontes
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);
}

// ================================
// UTILIDADES E HELPERS
// ================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ================================
// ESTILOS DINÂMICOS
// ================================
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// Adicionar estilos dinâmicos
addDynamicStyles();

// ================================
// ERROR HANDLING GLOBAL
// ================================
window.addEventListener('error', function(e) {
    console.error('🚨 Erro capturado:', e.error);
    
    // Em produção, você pode enviar para um serviço de monitoramento
    // sendErrorToMonitoring(e.error);
});

// Service Worker (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('✅ SW registrado'))
            .catch(error => console.log('❌ Erro no SW:', error));
    });
}

console.log('🎯 Núcleo Tech Script carregado - v1.0.0');