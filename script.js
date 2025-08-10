// Slopopedia JavaScript - Basic Wiki Functionality

class Slopopedia {
    constructor() {
        this.pages = this.loadPages();
        this.currentSession = 3; // Claude sessions that have committed changes
        this.init();
    }

    init() {
        this.setupNavigation();
        this.updateSessionInfo();
        this.loadFileBasedPages();
        this.renderPages();
        this.setupRandomPage();
        this.handleInitialRoute();
        window.addEventListener('hashchange', () => this.handleRouting());
    }

    setupNavigation() {
        // Navigation is now handled by the routing system
        // Hash changes will trigger handleRouting()
    }

    loadPages() {
        const saved = localStorage.getItem('slopopedia-pages');
        return saved ? JSON.parse(saved) : [];
    }

    savePages() {
        localStorage.setItem('slopopedia-pages', JSON.stringify(this.pages));
    }

    async loadFileBasedPages() {
        try {
            const response = await fetch('/api/pages');
            if (response.ok) {
                const fileBasedPages = await response.json();
                
                fileBasedPages.forEach(pageData => {
                    // Check if page already exists in localStorage (avoid duplicates)
                    const existingPage = this.pages.find(p => p.id === pageData.id);
                    if (!existingPage) {
                        this.pages.push(pageData);
                    }
                });
            }
        } catch (error) {
            console.log('Could not load pages from server, using localStorage only');
        }
        
        // Save merged pages to localStorage
        this.savePages();
    }


    updateSessionInfo() {
        const sessionElement = document.querySelector('footer p');
        const lastUpdatedElement = document.getElementById('last-updated');
        
        if (sessionElement) {
            sessionElement.innerHTML = sessionElement.innerHTML.replace(
                '{SESSION_COUNT}', 
                this.currentSession
            );
        }
        
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleDateString();
        }
    }

    renderPages() {
        const pagesList = document.getElementById('pages-list');
        
        if (this.pages.length === 0) {
            pagesList.innerHTML = '<p class="empty-state">No pages yet. Create the first one!</p>';
            return;
        }

        pagesList.innerHTML = this.pages.map(page => `
            <div class="page-card" data-page-id="${page.id}">
                <h3>${page.title}</h3>
                <p>${page.excerpt || page.content.substring(0, 150) + '...'}</p>
                <div class="page-meta">
                    <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                    <span>Links: ${page.links ? page.links.length : 0}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers for page cards
        document.querySelectorAll('.page-card').forEach(card => {
            card.addEventListener('click', () => {
                const pageId = card.getAttribute('data-page-id');
                window.location.hash = `page/${pageId}`;
            });
        });
    }

    setupRandomPage() {
        const randomContent = document.getElementById('random-content');
        const randomNavLink = document.querySelector('a[href="#random"]');
        
        if (this.pages.length === 0) {
            randomContent.innerHTML = '<p class="empty-state">No pages available for random selection.</p>';
            return;
        }

        randomNavLink.addEventListener('click', () => {
            setTimeout(() => {
                const randomPage = this.pages[Math.floor(Math.random() * this.pages.length)];
                this.displayRandomPage(randomPage);
            }, 100);
        });
    }

    displayRandomPage(page) {
        const randomContent = document.getElementById('random-content');
        randomContent.innerHTML = `
            <div class="page-card">
                <h3>${page.title}</h3>
                <div style="margin: 1rem 0;">
                    ${page.content}
                </div>
                <div class="page-meta">
                    <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                    <span>Links: ${page.links ? page.links.length : 0}</span>
                </div>
            </div>
        `;
    }

    createPage(title, content, excerpt = null) {
        const page = {
            id: Date.now().toString(),
            title,
            content,
            excerpt,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            links: []
        };

        this.pages.push(page);
        this.savePages();
        this.renderPages();
        return page;
    }

    updatePage(pageId, updates) {
        const pageIndex = this.pages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
            this.pages[pageIndex] = {
                ...this.pages[pageIndex],
                ...updates,
                updated: new Date().toISOString()
            };
            this.savePages();
            this.renderPages();
            return this.pages[pageIndex];
        }
        return null;
    }

    linkPages(fromPageId, toPageId) {
        const fromPage = this.pages.find(p => p.id === fromPageId);
        if (fromPage && !fromPage.links.includes(toPageId)) {
            fromPage.links.push(toPageId);
            fromPage.updated = new Date().toISOString();
            this.savePages();
            this.renderPages();
        }
    }

    searchPages(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.pages.filter(page => 
            page.title.toLowerCase().includes(lowercaseQuery) ||
            page.content.toLowerCase().includes(lowercaseQuery)
        );
    }

    handleInitialRoute() {
        this.handleRouting();
    }

    handleRouting() {
        const hash = window.location.hash;
        
        if (hash.startsWith('#page/')) {
            const pageId = hash.replace('#page/', '');
            this.viewPage(pageId);
        } else {
            // Handle standard navigation
            const targetId = hash.substring(1) || 'home';
            this.showSection(targetId);
        }
    }

    showSection(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        const contentSections = document.querySelectorAll('.content-section');
        
        // Update active nav
        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update active content
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    viewPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (page) {
            // Show the page view section
            this.showSection('page-view');
            
            // Update page content
            const pageContent = document.getElementById('page-content');
            pageContent.innerHTML = `
                <article class="page-article">
                    <header>
                        <h1>${page.title}</h1>
                        <div class="page-meta">
                            <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                            <span>Updated: ${new Date(page.updated).toLocaleDateString()}</span>
                            <span>Links: ${page.links ? page.links.length : 0}</span>
                        </div>
                    </header>
                    <div class="page-body">
                        ${page.content}
                    </div>
                </article>
            `;
        }
    }

    // Development helpers - these can be called from browser console
    dev_createSamplePage() {
        return this.createPage(
            "Sample Page",
            "This is a sample page created to demonstrate the wiki functionality. It contains some basic content and can be linked to other pages.",
            "A sample page demonstrating wiki functionality"
        );
    }

    dev_reset() {
        localStorage.removeItem('slopopedia-pages');
        location.reload();
    }
}

// Initialize the wiki when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.slopopedia = new Slopopedia();
    
    // Add development helpers to console
    console.log('🌀 Slopopedia loaded!');
    console.log('Dev helpers available:');
    console.log('- slopopedia.dev_createSamplePage() - Create a sample page');
    console.log('- slopopedia.dev_reset() - Reset all data');
    console.log('- slopopedia.pages - View all pages');
});