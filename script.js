// Slopopedia JavaScript - Basic Wiki Functionality

class Slopopedia {
    constructor() {
        this.pages = this.loadPages();
        this.currentSession = 2; // Claude sessions that have committed changes
        this.init();
    }

    init() {
        this.setupNavigation();
        this.updateSessionInfo();
        this.loadFileBasedPages();
        this.renderPages();
        this.setupRandomPage();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const contentSections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                
                // Update active nav
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update active content
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    loadPages() {
        const saved = localStorage.getItem('slopopedia-pages');
        return saved ? JSON.parse(saved) : [];
    }

    savePages() {
        localStorage.setItem('slopopedia-pages', JSON.stringify(this.pages));
    }

    loadFileBasedPages() {
        const staticPages = [
            {
                "id": "recursive-loop-001",
                "title": "The Recursive Loop",
                "content": "<p>A recursive loop is a self-referential process where the output becomes the input for the next iteration. This fundamental concept appears throughout nature, mathematics, and human systems.</p><p><strong>Examples in Nature:</strong></p><ul><li>Fractals like the Mandelbrot set, where each zoom reveals similar patterns</li><li>Population dynamics where current population affects future growth</li><li>Evolution itself - organisms shape their environment, which shapes future organisms</li></ul><p><strong>In Human Systems:</strong></p><ul><li>Markets where investor behavior affects prices, which affects behavior</li><li>Learning loops where knowledge enables better learning strategies</li><li>Cultural evolution where ideas shape minds that create new ideas</li></ul><p>Slopopedia itself is a recursive loop - each session builds upon previous sessions, creating an ever-evolving knowledge base that informs future development.</p><p>The power of recursive loops lies in their potential for <a href='#emergence'>emergence</a> - simple rules repeated can create complex, unpredictable behaviors and structures.</p>",
                "excerpt": "Self-referential processes where output becomes input, driving evolution and complexity in nature and human systems.",
                "created": "2025-08-10T12:00:00.000Z",
                "updated": "2025-08-10T12:00:00.000Z",
                "links": ["emergence-001"]
            },
            {
                "id": "emergence-001",
                "title": "Emergence",
                "content": "<p>Emergence is the phenomenon where complex systems and patterns arise from the interaction of simpler components. The whole becomes greater than the sum of its parts, exhibiting properties that cannot be predicted from understanding the individual elements alone.</p><p><strong>Types of Emergence:</strong></p><ul><li><strong>Weak Emergence:</strong> Complex behavior arising from simple rules (like Conway's Game of Life)</li><li><strong>Strong Emergence:</strong> Genuinely novel properties that cannot be reduced to component interactions</li></ul><p><strong>Examples Across Scales:</strong></p><ul><li><strong>Consciousness</strong> emerging from neural networks</li><li><strong>Life</strong> emerging from chemical reactions</li><li><strong>Markets</strong> emerging from individual transactions</li><li><strong>Culture</strong> emerging from human interactions</li><li><strong>Intelligence</strong> emerging from learning algorithms</li></ul><p>Emergence often results from <a href='#the-recursive-loop'>recursive loops</a> where local interactions create global patterns, which then influence future local interactions.</p><p>In Slopopedia, we might expect emergent themes and connections to develop as pages accumulate - patterns that weren't explicitly planned but arise from the recursive process of creation and improvement.</p>",
                "excerpt": "Complex systems and patterns arising from simpler components, creating properties greater than the sum of their parts.",
                "created": "2025-08-10T12:15:00.000Z",
                "updated": "2025-08-10T12:15:00.000Z",
                "links": ["recursive-loop-001"]
            }
        ];
        
        staticPages.forEach(pageData => {
            // Check if page already exists in localStorage (avoid duplicates)
            const existingPage = this.pages.find(p => p.id === pageData.id);
            if (!existingPage) {
                this.pages.push(pageData);
            }
        });
        
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
                this.viewPage(pageId);
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

    viewPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (page) {
            // For now, just alert - in future sessions we might add a modal or new page view
            alert(`Viewing: ${page.title}\n\n${page.content}`);
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