// Slopopedia JavaScript - Basic Wiki Functionality

class Slopopedia {
    constructor() {
        this.pages = this.loadPages();
        this.currentSession = 19; // Claude sessions that have committed changes
        this.init();
    }

    init() {
        this.setupNavigation();
        this.updateSessionInfo();
        this.loadFileBasedPages();
        this.renderPages();
        this.setupRandomPage();
        this.setupSearch();
        this.setupExport();
        this.setupNetwork();
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
                    // Check if page already exists in localStorage
                    const existingPageIndex = this.pages.findIndex(p => p.id === pageData.id);
                    if (existingPageIndex !== -1) {
                        // Update existing page with file-based content
                        this.pages[existingPageIndex] = pageData;
                    } else {
                        // Add new page
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
            this.populatePageSelector(); // Update export selector even if no pages
            return;
        }

        pagesList.innerHTML = this.pages.map(page => `
            <div class="page-card" data-page-id="${page.id}">
                <h3>${page.title}</h3>
                <p>${page.excerpt || page.content.substring(0, 150) + '...'}</p>
                ${page.tags && page.tags.length > 0 ? `
                <div class="page-tags">
                    ${page.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
                </div>
                ` : ''}
                <div class="page-meta">
                    <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                    <span>Links: ${page.links ? page.links.length : 0}</span>
                </div>
            </div>
        `).join('');

        // Update export page selector when pages change
        this.populatePageSelector();
        
        // Update network if it's been rendered
        if (window.location.hash === '#network' && this.networkSvg) {
            setTimeout(() => this.renderNetwork(), 100);
        }

        // Add click handlers for page cards
        document.querySelectorAll('.page-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on a tag
                if (e.target.classList.contains('tag')) {
                    return;
                }
                const pageId = card.getAttribute('data-page-id');
                window.location.hash = `page/${pageId}`;
            });
        });
        
        // Add click handlers for tags
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagName = tag.getAttribute('data-tag');
                this.filterByTag(tagName);
            });
        });
    }
    
    filterByTag(tagName) {
        const filteredPages = this.pages.filter(page => 
            page.tags && page.tags.includes(tagName)
        );
        
        const pagesList = document.getElementById('pages-list');
        pagesList.innerHTML = `
            <div class="tag-filter-header">
                <h3>Pages tagged with "${tagName}" (${filteredPages.length})</h3>
                <button class="clear-filter-btn">Show All Pages</button>
            </div>
            ${filteredPages.map(page => `
                <div class="page-card" data-page-id="${page.id}">
                    <h3>${page.title}</h3>
                    <p>${page.excerpt || page.content.substring(0, 150) + '...'}</p>
                    ${page.tags && page.tags.length > 0 ? `
                    <div class="page-tags">
                        ${page.tags.map(tag => `<span class="tag ${tag === tagName ? 'tag-active' : ''}" data-tag="${tag}">${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                    <div class="page-meta">
                        <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                        <span>Links: ${page.links ? page.links.length : 0}</span>
                    </div>
                </div>
            `).join('')}
        `;
        
        // Re-add event handlers
        document.querySelectorAll('.page-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag')) {
                    return;
                }
                const pageId = card.getAttribute('data-page-id');
                window.location.hash = `page/${pageId}`;
            });
        });
        
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagName = tag.getAttribute('data-tag');
                this.filterByTag(tagName);
            });
        });
        
        document.querySelector('.clear-filter-btn').addEventListener('click', () => {
            this.renderPages();
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

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const searchResults = document.getElementById('search-results');
        
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (!query) {
                searchResults.innerHTML = '<p class="empty-state">Enter a search term to find pages.</p>';
                return;
            }
            
            const results = this.searchPages(query);
            this.displaySearchResults(results, query);
        };
        
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Auto-search as user types (with debounce)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.trim().length > 0) {
                    performSearch();
                }
            }, 300);
        });
    }

    displaySearchResults(results, query) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = `<p class="empty-state">No pages found for "${query}".</p>`;
            return;
        }
        
        searchResults.innerHTML = `
            <p class="search-summary">${results.length} page${results.length === 1 ? '' : 's'} found for "${query}":</p>
            <div class="search-results-list">
                ${results.map(page => `
                    <div class="search-result" data-page-id="${page.id}">
                        <h3>${this.highlightSearchTerm(page.title, query)}</h3>
                        <p>${this.highlightSearchTerm(page.excerpt || this.stripHtml(page.content).substring(0, 150) + '...', query)}</p>
                        <div class="page-meta">
                            <span>Updated: ${new Date(page.updated).toLocaleDateString()}</span>
                            <span>Links: ${page.links ? page.links.length : 0}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers for search results
        document.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                const pageId = result.getAttribute('data-page-id');
                window.location.hash = `page/${pageId}`;
            });
        });
    }
    
    highlightSearchTerm(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
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
        const timestamp = new Date().toISOString();
        const page = {
            id: Date.now().toString(),
            title,
            content,
            excerpt,
            created: timestamp,
            updated: timestamp,
            links: [],
            currentVersion: 1,
            history: [{
                version: 1,
                title,
                content,
                excerpt,
                updated: timestamp,
                changes: "Initial version"
            }]
        };

        this.pages.push(page);
        this.savePages();
        this.renderPages();
        return page;
    }

    updatePage(pageId, updates) {
        const pageIndex = this.pages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
            const currentPage = this.pages[pageIndex];
            const timestamp = new Date().toISOString();
            
            // Initialize history if it doesn't exist
            if (!currentPage.history) {
                currentPage.history = [{
                    version: 1,
                    title: currentPage.title,
                    content: currentPage.content,
                    excerpt: currentPage.excerpt,
                    updated: currentPage.created,
                    changes: "Initial version"
                }];
            }
            
            // Create new version entry
            const newVersion = {
                version: currentPage.history.length + 1,
                title: updates.title || currentPage.title,
                content: updates.content || currentPage.content,
                excerpt: updates.excerpt || currentPage.excerpt,
                updated: timestamp,
                changes: updates.changes || "Updated content"
            };
            
            currentPage.history.push(newVersion);
            
            // Update the main page content
            this.pages[pageIndex] = {
                ...currentPage,
                ...updates,
                updated: timestamp,
                currentVersion: newVersion.version
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
            
            // Special handling for network section
            if (sectionId === 'network' && this.pages.length > 0) {
                setTimeout(() => this.renderNetwork(), 100);
            }
        }
    }

    viewPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (page) {
            // Show the page view section
            this.showSection('page-view');
            
            // Update page content
            const pageContent = document.getElementById('page-content');
            const hasHistory = page.history && page.history.length > 1;
            
            pageContent.innerHTML = `
                <article class="page-article">
                    <header>
                        <h1>${page.title}</h1>
                        ${page.tags && page.tags.length > 0 ? `
                        <div class="page-tags">
                            ${page.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
                        </div>
                        ` : ''}
                        <div class="page-meta">
                            <span>Created: ${new Date(page.created).toLocaleDateString()}</span>
                            <span>Updated: ${new Date(page.updated).toLocaleDateString()}</span>
                            <span>Links: ${page.links ? page.links.length : 0}</span>
                            ${hasHistory ? `<span>Version: ${page.currentVersion || page.history.length}</span>` : ''}
                        </div>
                        ${hasHistory ? `
                        <div class="version-controls">
                            <button id="toggle-history" class="history-button">View History (${page.history.length} versions)</button>
                        </div>
                        ` : ''}
                    </header>
                    <div class="page-body">
                        ${page.content}
                    </div>
                    ${hasHistory ? `
                    <aside id="page-history" class="page-history" style="display: none;">
                        <h3>Page History</h3>
                        <div class="history-list">
                            ${page.history.slice().reverse().map(version => `
                                <div class="history-item ${version.version === (page.currentVersion || page.history.length) ? 'current-version' : ''}" data-version="${version.version}">
                                    <div class="version-header">
                                        <strong>Version ${version.version}</strong>
                                        <span class="version-date">${new Date(version.updated).toLocaleString()}</span>
                                    </div>
                                    <div class="version-changes">${version.changes}</div>
                                    <button class="view-version-btn" data-version="${version.version}">View This Version</button>
                                    ${version.version > 1 ? `<button class="compare-version-btn" data-version="${version.version}">Compare with Previous</button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </aside>
                    ` : ''}
                </article>
            `;
            
            // Add click handlers for tags in page view
            document.querySelectorAll('#page-content .tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const tagName = tag.getAttribute('data-tag');
                    window.location.hash = 'pages';
                    setTimeout(() => this.filterByTag(tagName), 100);
                });
            });
            
            // Add history toggle functionality
            const historyToggle = document.getElementById('toggle-history');
            const historySection = document.getElementById('page-history');
            if (historyToggle && historySection) {
                historyToggle.addEventListener('click', () => {
                    const isHidden = historySection.style.display === 'none';
                    historySection.style.display = isHidden ? 'block' : 'none';
                    historyToggle.textContent = isHidden ? 
                        `Hide History` : 
                        `View History (${page.history.length} versions)`;
                });
                
                // Add version view functionality
                document.querySelectorAll('.view-version-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const versionNum = parseInt(btn.getAttribute('data-version'));
                        this.viewPageVersion(pageId, versionNum);
                    });
                });
                
                // Add version compare functionality
                document.querySelectorAll('.compare-version-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const versionNum = parseInt(btn.getAttribute('data-version'));
                        this.comparePageVersions(pageId, versionNum, versionNum - 1);
                    });
                });
            }
        }
    }

    viewPageVersion(pageId, versionNumber) {
        const page = this.pages.find(p => p.id === pageId);
        if (page && page.history) {
            const version = page.history.find(v => v.version === versionNumber);
            if (version) {
                // Show the page view section with historical content
                this.showSection('page-view');
                
                const pageContent = document.getElementById('page-content');
                pageContent.innerHTML = `
                    <article class="page-article version-view">
                        <div class="version-notice">
                            <span>📖 Viewing Version ${version.version} from ${new Date(version.updated).toLocaleString()}</span>
                            <button id="return-to-current" class="return-btn">Return to Current Version</button>
                        </div>
                        <header>
                            <h1>${version.title}</h1>
                            <div class="page-meta">
                                <span>Version: ${version.version}</span>
                                <span>Date: ${new Date(version.updated).toLocaleDateString()}</span>
                                <span>Changes: ${version.changes}</span>
                            </div>
                        </header>
                        <div class="page-body">
                            ${version.content}
                        </div>
                    </article>
                `;
                
                // Add return to current version functionality
                document.getElementById('return-to-current').addEventListener('click', () => {
                    this.viewPage(pageId);
                });
            }
        }
    }

    comparePageVersions(pageId, newVersionNum, oldVersionNum) {
        const page = this.pages.find(p => p.id === pageId);
        if (page && page.history) {
            const newVersion = page.history.find(v => v.version === newVersionNum);
            const oldVersion = page.history.find(v => v.version === oldVersionNum);
            
            if (newVersion && oldVersion) {
                // Show the page view section with diff content
                this.showSection('page-view');
                
                const pageContent = document.getElementById('page-content');
                pageContent.innerHTML = `
                    <article class="page-article diff-view">
                        <div class="diff-notice">
                            <span>📋 Comparing Version ${newVersionNum} with Version ${oldVersionNum}</span>
                            <button id="return-to-current" class="return-btn">Return to Current Version</button>
                        </div>
                        <header>
                            <h1>Page Diff: ${page.title}</h1>
                            <div class="page-meta">
                                <span>Comparing: v${oldVersionNum} → v${newVersionNum}</span>
                                <span>Date range: ${new Date(oldVersion.updated).toLocaleDateString()} → ${new Date(newVersion.updated).toLocaleDateString()}</span>
                            </div>
                        </header>
                        <div class="diff-content">
                            ${this.generateDiff(oldVersion, newVersion)}
                        </div>
                    </article>
                `;
                
                // Add return to current version functionality
                document.getElementById('return-to-current').addEventListener('click', () => {
                    this.viewPage(pageId);
                });
            }
        }
    }

    generateDiff(oldVersion, newVersion) {
        const changes = [];
        
        // Compare titles
        if (oldVersion.title !== newVersion.title) {
            changes.push(`
                <div class="diff-section">
                    <h3>Title Changed</h3>
                    <div class="diff-item">
                        <div class="diff-old">- ${oldVersion.title}</div>
                        <div class="diff-new">+ ${newVersion.title}</div>
                    </div>
                </div>
            `);
        }
        
        // Compare content - simple word-by-word diff
        const contentDiff = this.createSimpleDiff(oldVersion.content, newVersion.content);
        if (contentDiff.length > 0) {
            changes.push(`
                <div class="diff-section">
                    <h3>Content Changes</h3>
                    <div class="diff-content-comparison">
                        ${contentDiff}
                    </div>
                </div>
            `);
        }
        
        // Show change summary
        changes.unshift(`
            <div class="diff-summary">
                <h3>Change Summary</h3>
                <div class="change-details">
                    <strong>Version ${newVersion.version}</strong> (${new Date(newVersion.updated).toLocaleString()})<br>
                    <em>Changes: ${newVersion.changes}</em>
                </div>
            </div>
        `);
        
        return changes.length > 1 ? changes.join('') : `
            <div class="diff-section">
                <p>No significant differences detected between these versions.</p>
            </div>
        `;
    }

    createSimpleDiff(oldText, newText) {
        // Simple line-by-line comparison
        const oldLines = oldText.split('\n').filter(line => line.trim());
        const newLines = newText.split('\n').filter(line => line.trim());
        
        const maxLines = Math.max(oldLines.length, newLines.length);
        const diffHtml = [];
        
        for (let i = 0; i < maxLines; i++) {
            const oldLine = oldLines[i] || '';
            const newLine = newLines[i] || '';
            
            if (oldLine !== newLine) {
                if (oldLine && !newLine) {
                    diffHtml.push(`<div class="diff-line removed">- ${this.escapeHtml(oldLine)}</div>`);
                } else if (!oldLine && newLine) {
                    diffHtml.push(`<div class="diff-line added">+ ${this.escapeHtml(newLine)}</div>`);
                } else {
                    diffHtml.push(`<div class="diff-line removed">- ${this.escapeHtml(oldLine)}</div>`);
                    diffHtml.push(`<div class="diff-line added">+ ${this.escapeHtml(newLine)}</div>`);
                }
            }
        }
        
        return diffHtml.join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupExport() {
        // Set up export functionality
        const exportAllJson = document.getElementById('export-all-json');
        const exportAllMarkdown = document.getElementById('export-all-markdown');
        const pageSelector = document.getElementById('page-selector');
        const exportPageJson = document.getElementById('export-page-json');
        const exportPageMarkdown = document.getElementById('export-page-markdown');

        // Populate page selector
        this.populatePageSelector();

        // Export all pages as JSON
        exportAllJson?.addEventListener('click', () => {
            this.exportAllPagesJson();
        });

        // Export all pages as Markdown ZIP
        exportAllMarkdown?.addEventListener('click', () => {
            this.exportAllPagesMarkdown();
        });

        // Page selector change handler
        pageSelector?.addEventListener('change', (e) => {
            const isPageSelected = e.target.value !== '';
            exportPageJson.disabled = !isPageSelected;
            exportPageMarkdown.disabled = !isPageSelected;
        });

        // Export individual page handlers
        exportPageJson?.addEventListener('click', () => {
            const pageId = pageSelector.value;
            if (pageId) {
                this.exportPageJson(pageId);
            }
        });

        exportPageMarkdown?.addEventListener('click', () => {
            const pageId = pageSelector.value;
            if (pageId) {
                this.exportPageMarkdown(pageId);
            }
        });
    }

    populatePageSelector() {
        const pageSelector = document.getElementById('page-selector');
        if (!pageSelector) return;

        // Clear existing options except the first
        pageSelector.innerHTML = '<option value="">Select a page...</option>';
        
        // Add pages to selector
        this.pages.forEach(page => {
            const option = document.createElement('option');
            option.value = page.id;
            option.textContent = page.title;
            pageSelector.appendChild(option);
        });
    }

    exportAllPagesJson() {
        const data = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            sessionCount: this.currentSession,
            pages: this.pages
        };

        this.downloadFile(
            JSON.stringify(data, null, 2),
            `slopopedia-all-pages-${this.formatDateForFilename()}.json`,
            'application/json'
        );
    }

    async exportAllPagesMarkdown() {
        // Note: This is a simplified version that creates a single text file
        // with all pages. A full ZIP implementation would require additional libraries
        let markdownContent = `# Slopopedia Export\n\nExported on: ${new Date().toLocaleString()}\nSession: ${this.currentSession}\n\n---\n\n`;
        
        this.pages.forEach(page => {
            markdownContent += this.pageToMarkdown(page);
            markdownContent += '\n\n---\n\n';
        });

        this.downloadFile(
            markdownContent,
            `slopopedia-all-pages-${this.formatDateForFilename()}.md`,
            'text/markdown'
        );
    }

    exportPageJson(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) return;

        const data = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            page: page
        };

        this.downloadFile(
            JSON.stringify(data, null, 2),
            `slopopedia-${this.slugify(page.title)}-${this.formatDateForFilename()}.json`,
            'application/json'
        );
    }

    exportPageMarkdown(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) return;

        const markdownContent = this.pageToMarkdown(page);

        this.downloadFile(
            markdownContent,
            `slopopedia-${this.slugify(page.title)}-${this.formatDateForFilename()}.md`,
            'text/markdown'
        );
    }

    pageToMarkdown(page) {
        let markdown = `# ${page.title}\n\n`;
        
        if (page.excerpt) {
            markdown += `*${page.excerpt}*\n\n`;
        }

        // Convert HTML content to markdown (basic conversion)
        let content = page.content;
        
        // Convert basic HTML tags to markdown
        content = content.replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => {
            return '#'.repeat(parseInt(level)) + ' ' + text + '\n';
        });
        content = content.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        content = content.replace(/<em>(.*?)<\/em>/g, '*$1*');
        content = content.replace(/<ul>/g, '').replace(/<\/ul>/g, '\n');
        content = content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
        content = content.replace(/<br\s*\/?>/g, '\n');
        
        // Remove any remaining HTML tags
        content = content.replace(/<[^>]*>/g, '');
        
        markdown += content;
        
        // Add metadata
        markdown += `\n\n---\n\n`;
        markdown += `**Metadata:**\n`;
        markdown += `- Created: ${new Date(page.created).toLocaleString()}\n`;
        markdown += `- Updated: ${new Date(page.updated).toLocaleString()}\n`;
        markdown += `- Version: ${page.currentVersion || 1}\n`;
        
        if (page.links && page.links.length > 0) {
            markdown += `- Links: ${page.links.length} connected pages\n`;
        }

        return markdown;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    formatDateForFilename() {
        return new Date().toISOString().split('T')[0];
    }

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    setupNetwork() {
        this.networkLayout = 'force';
        this.networkSvg = null;
        this.networkSimulation = null;
        
        // Set up network controls
        document.getElementById('layout-force')?.addEventListener('click', () => {
            this.setNetworkLayout('force');
        });
        
        document.getElementById('layout-circle')?.addEventListener('click', () => {
            this.setNetworkLayout('circle');
        });
        
        document.getElementById('reset-zoom')?.addEventListener('click', () => {
            this.resetNetworkView();
        });
        
        // Set default active button
        document.getElementById('layout-force')?.classList.add('active');
    }
    
    setNetworkLayout(layout) {
        this.networkLayout = layout;
        
        // Update button states
        document.querySelectorAll('.network-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`layout-${layout}`).classList.add('active');
        
        this.renderNetwork();
    }
    
    renderNetwork() {
        const svg = document.getElementById('network-svg');
        const container = document.getElementById('network-container');
        if (!svg || !container || this.pages.length === 0) return;
        
        // Clear existing content
        svg.innerHTML = '';
        
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Prepare data
        const nodes = this.pages.map(page => ({
            id: page.id,
            title: page.title,
            links: page.links || [],
            linkCount: (page.links || []).length
        }));
        
        const links = [];
        this.pages.forEach(page => {
            if (page.links && page.links.length > 0) {
                page.links.forEach(targetId => {
                    const target = this.pages.find(p => p.id === targetId);
                    if (target) {
                        links.push({
                            source: page.id,
                            target: targetId,
                            sourceTitle: page.title,
                            targetTitle: target.title
                        });
                    }
                });
            }
        });
        
        // Create SVG elements
        const svgEl = d3.select(svg);
        const g = svgEl.append('g');
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svgEl.call(zoom);
        
        // Create links
        const linkElements = g.selectAll('.network-link')
            .data(links)
            .enter().append('line')
            .attr('class', 'network-link')
            .style('stroke', '#94a3b8')
            .style('stroke-width', '1.5px')
            .style('opacity', 0.6);
        
        // Create nodes
        const nodeElements = g.selectAll('.network-node')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'network-node')
            .attr('r', d => Math.max(8, Math.min(20, 8 + d.linkCount * 2)))
            .style('fill', d => this.getNodeColor(d.linkCount))
            .style('stroke', '#ffffff')
            .style('stroke-width', '2px')
            .style('cursor', 'pointer');
        
        // Create labels
        const labelElements = g.selectAll('.network-node-label')
            .data(nodes)
            .enter().append('text')
            .attr('class', 'network-node-label')
            .text(d => this.truncateTitle(d.title, 15))
            .style('font-size', '11px')
            .style('font-weight', '500')
            .style('fill', '#1e293b')
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('user-select', 'none');
        
        // Add interactions
        this.addNetworkInteractions(nodeElements, labelElements);
        
        // Apply layout
        if (this.networkLayout === 'force') {
            this.applyForceLayout(nodes, links, linkElements, nodeElements, labelElements, width, height);
        } else {
            this.applyCircleLayout(nodes, linkElements, nodeElements, labelElements, width, height);
        }
        
        // Store references
        this.networkSvg = svgEl;
        this.networkZoom = zoom;
        
        // Update stats
        this.updateNetworkStats(nodes, links);
    }
    
    getNodeColor(linkCount) {
        if (linkCount === 0) return '#e2e8f0';
        if (linkCount <= 2) return '#93c5fd';
        if (linkCount <= 4) return '#60a5fa';
        if (linkCount <= 6) return '#3b82f6';
        return '#1d4ed8';
    }
    
    truncateTitle(title, maxLength) {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    }
    
    addNetworkInteractions(nodeElements, labelElements) {
        const tooltip = document.getElementById('node-tooltip');
        
        nodeElements
            .on('mouseover', (event, d) => {
                if (tooltip) {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <strong>${d.title}</strong><br>
                        Connections: ${d.linkCount}<br>
                        <em>Click to view page</em>
                    `;
                    tooltip.style.left = (event.pageX + 10) + 'px';
                    tooltip.style.top = (event.pageY - 10) + 'px';
                }
            })
            .on('mouseout', () => {
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            })
            .on('click', (event, d) => {
                window.location.hash = `page/${d.id}`;
            });
    }
    
    applyForceLayout(nodes, links, linkElements, nodeElements, labelElements, width, height) {
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(25));
        
        simulation.on('tick', () => {
            linkElements
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            nodeElements
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            labelElements
                .attr('x', d => d.x)
                .attr('y', d => d.y + 25);
        });
        
        this.networkSimulation = simulation;
    }
    
    applyCircleLayout(nodes, linkElements, nodeElements, labelElements, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.3;
        
        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
        
        // Update positions
        linkElements
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        nodeElements
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        labelElements
            .attr('x', d => d.x)
            .attr('y', d => d.y + 25);
    }
    
    updateNetworkStats(nodes, links) {
        const statsElement = document.getElementById('network-stats');
        if (statsElement) {
            const avgConnections = nodes.reduce((sum, node) => sum + node.linkCount, 0) / nodes.length;
            statsElement.innerHTML = `
                <strong>Network Stats</strong><br>
                Pages: ${nodes.length}<br>
                Connections: ${links.length}<br>
                Avg Links: ${avgConnections.toFixed(1)}
            `;
        }
    }
    
    resetNetworkView() {
        if (this.networkSvg && this.networkZoom) {
            this.networkSvg.transition().duration(750).call(
                this.networkZoom.transform,
                d3.zoomIdentity
            );
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